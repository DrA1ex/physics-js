import {ImpulseBasedSolver} from "../../solver.js";
import {Debug} from "../../debug.js";


/*** @enum {number} */
export const State = {
    play: 0,
    pause: 1,
    stop: 2,
    step: 3
}

export class Bootstrap {
    /** @type {State} */
    #state = State.stop;
    #debugInstance;
    #solver;
    #canvas;
    #ctx;

    #pointId = 0;
    #drawingPoints = new Map();
    #vectorId = 0;
    #drawingVectors = new Map();

    #statsElement;
    #stats = {
        elapsed: 0,
        physicsTime: 0,
        bodiesCount: 0,
        collisionCount: 0,
        lastStepTime: 0,
        renderTime: 0,
    };

    #debug = false;
    #slowMotion = 1;
    #dpr;
    #canvasWidth;
    #canvasHeight;

    get solver() {return this.#solver;}
    get state() {return this.#state;}

    get dpr() {return this.#dpr;}
    get canvasWidth() {return this.#canvasWidth;}
    get canvasHeight() {return this.#canvasHeight;}

    get stats() {return {...this.#stats};}

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {{
     *          debug?: boolean, slowMotionRate?: number,
     *          showBoundary?: boolean, showVectorLength?: boolean, showVector?: boolean,
     *          statistics?: boolean
     * }} options
     */
    constructor(canvas, options = {}) {
        this.#canvas = canvas;
        this.#ctx = canvas.getContext("2d");

        this.#debug = options.debug;
        this.#slowMotion = Math.max(0.01, Math.min(2, options.slowMotionRate ?? 1));

        this.#debugInstance = new Debug(options);
        window.__app = {DebugInstance: this.#debugInstance};

        this.#solver = new ImpulseBasedSolver();
        if (options.statistics) {
            this.#statsElement = document.createElement("pre");
            document.body.appendChild(this.#statsElement);
        }

        this.#init();
    }

    /** @param {Body} body */
    addRigidBody(body) {
        this.#solver.addRigidBody(body);
    }

    /** @param constraint */
    addConstraint(constraint) {
        this.#solver.addConstraint(constraint);
    }

    /** @param force*/
    addForce(force) {
        this.#solver.addForce(force);
    }

    run() {
        if (this.state === State.play) {
            return;
        }

        this.#state = State.play;
        this.#stats.elapsed = 0;

        this.#step();
    }

    play() {
        if (this.state !== State.stop) {
            this.#state = State.play;
        }
    }

    pause() {
        if (this.state !== State.stop) {
            this.#state = State.pause;
        }
    }

    stepMode() {
        if (this.state !== State.stop) {
            this.#state = State.step;
        }
    }

    stop() {
        this.#state = State.stop;
    }

    addPoint(point, color = "black") {
        this.#drawingPoints.set(this.#pointId, {point, color});
        return this.#pointId++;
    }

    removePoint(id) {
        if (this.#drawingPoints.has(id)) {
            this.#drawingPoints.delete(id);
        }
    }

    addVector(point, size, color = "black") {
        this.#drawingVectors.set(this.#vectorId, {point, size, color});
        return this.#vectorId++;
    }

    removeVector(id) {
        if (this.#drawingVectors.has(id)) {
            this.#drawingVectors.delete(id);
        }
    }

    #init() {
        const rect = canvas.getBoundingClientRect();

        this.#dpr = window.devicePixelRatio;
        this.#canvasWidth = rect.width;
        this.#canvasHeight = rect.height;

        this.#canvas.style.width = this.canvasWidth + "px";
        this.#canvas.style.height = this.canvasHeight + "px";
        this.#canvas.width = this.canvasWidth * this.dpr;
        this.#canvas.height = this.canvasHeight * this.dpr;

        this.#ctx.scale(this.dpr, this.dpr);

        if (this.#statsElement) {
            this.#statsElement.className = "stats-block";
            this.#statsElement.style.pointerEvents = "none";
            this.#statsElement.style.position = "absolute";
            this.#statsElement.style.left = "1rem";
            this.#statsElement.style.bottom = "1rem";
            this.#statsElement.style.margin = "0";
            this.#statsElement.style.textShadow = "0 0 2px white, 0 0 2px white, 0 0 2px white, 0 0 2px white";
        }
    }

    #step() {
        if (this.state === State.stop) {
            return;
        }

        const t = performance.now();
        if (this.state !== State.pause) {
            this.#physicsStep(this.#stats.elapsed / 1000);
        }

        if (this.state === State.step) {
            this.pause();
        }

        this.#stats.physicsTime = performance.now() - t;
        this.#stats.bodiesCount = this.#solver.rigidBodies.length
        this.#stats.collisionCount = this.#solver.stepInfo.collisionCount;

        requestAnimationFrame(timestamp => {
            this.#stats.elapsed = timestamp - this.#stats.lastStepTime;
            this.#stats.lastStepTime = timestamp;

            const t = performance.now();
            this.#render();
            this.#stats.renderTime = performance.now() - t;

            setTimeout(() => this.#step());
        });
    }

    #physicsStep(elapsed) {
        this.#solver.solve(elapsed * this.#slowMotion);
    }

    #render() {
        this.#ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

        this.#ctx.strokeStyle = "black";
        for (const {box} of this.#solver.constraints) {
            this.#ctx.strokeRect(box.left, box.top, box.width, box.height);
        }

        this.#ctx.strokeStyle = "lightgrey";
        this.#ctx.fillStyle = "black";
        for (const body of this.#solver.rigidBodies) {
            body.renderer.render(this.#ctx);
        }

        if (this.#debug) {
            this.#debugInstance.render(this.#ctx, this.#solver.rigidBodies);
        }

        for (const {point, color} of this.#drawingPoints.values()) {
            this.#drawPoint(point, color);
        }

        for (const {point, size, color} of this.#drawingVectors.values()) {
            this.#drawVector(point, size, color);
        }

        if (this.#statsElement) {
            this.#statsElement.innerText = [
                `Bodies: ${this.#stats.bodiesCount}`,
                `Collisions: ${this.#stats.collisionCount}`,
                `FPS: ${(1000 / this.#stats.elapsed).toFixed(0)}`,
                `Physics time: ${this.#stats.physicsTime.toFixed(2)}ms`,
                `Render time: ${this.#stats.renderTime.toFixed(2)}ms`,
            ].join("\n");
        }
    }

    #drawPoint(point, color, size = 2) {
        this.#ctx.strokeStyle = color;
        this.#ctx.fillStyle = color;

        this.#ctx.beginPath();
        this.#ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        this.#ctx.fill()
    }

    #drawVector(point, size, color, pointSize = 2) {
        this.#ctx.strokeStyle = color;
        this.#ctx.fillStyle = color;

        this.#ctx.beginPath();
        this.#ctx.moveTo(point.x, point.y);
        this.#ctx.lineTo(point.x + size.x, point.y + size.y);
        this.#ctx.stroke()

        this.#drawPoint(point.copy().add(size), color, pointSize);
    }
}