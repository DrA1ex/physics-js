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
     *          showBoundary?: boolean, showVectorLength?: boolean, showVector?: boolean
     * }} options
     */
    constructor(canvas, options) {
        this.#canvas = canvas;
        this.#ctx = canvas.getContext("2d");

        this.#debug = options.debug;
        this.#slowMotion = options.slowMotionRate;

        this.#debugInstance = new Debug(options);
        window.__app = {DebugInstance: this.#debugInstance};

        this.#solver = new ImpulseBasedSolver();
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
    }
}