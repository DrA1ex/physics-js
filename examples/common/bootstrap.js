import {Debug} from "../../lib/misc/debug.js";
import {Body} from "../../lib/physics/body/base.js";
import {ImpulseBasedSolver} from "../../lib/physics/solver.js";
import {Particle} from "../../lib/render/particles/particle.js";
import {ParticleSystem} from "../../lib/render/particles/system.js";
import * as Utils from "../../lib/utils/common.js";
import * as CommonUtils from "./utils.js";


/**
 * @template T
 * @typedef {function(delta: number): T} WaiterCallback
 *
 * @typedef {function(delta: number): void} WaiterItem
 */

/*** @enum {number} */
export const State = {
    play: 0,
    pause: 1,
    stop: 2,
    step: 3
}

const ShapeType = {
    point: 0,
    vector: 1,
    rect: 2
}

export class Bootstrap {
    /** @type {State} */
    #state = State.stop;
    /** @type {Debug} */
    #debugInstance;
    /** @type {ImpulseBasedSolver} */
    #solver;
    /** @type {ParticleSystem} */
    #particleSystem;
    /** @type {IRenderer} */
    #renderer;
    /** @type {HTMLCanvasElement} */
    #auxCanvas;
    /** @type {CanvasRenderingContext2D} */
    #auxCtx;

    #shapeId = 0;
    #drawingShapes = new Map();
    #bodyToRenderObj = new Map();
    /** @type {Set<WaiterItem>}*/
    #renderWaiters = new Set();
    /** @type {Set<WaiterItem>}*/
    #physicsWaiters = new Set();

    #bodyParticle = new Map();

    #statsElement;
    #stats = {
        elapsed: 0,
        physicsTime: 0,
        treeTime: 0,
        collisionTime: 0,
        renderTime: 0,
        bodiesCount: 0,
        collisionCount: 0,
        checkCount: 0,
        lastStepTime: 0,
        extra: {}
    };

    #debug = false;
    #slowMotion = 1;

    get state() {return this.#state;}

    get renderer() { return this.#renderer;}

    /** @deprecated Use renderer instead */
    get canvas() {return this.#renderer.canvas;}
    /** @deprecated Use renderer instead */
    get dpr() {return this.#renderer.dpr;}
    /** @deprecated Use renderer instead */
    get canvasWidth() {return this.#renderer.canvasWidth;}
    /** @deprecated Use renderer instead */
    get canvasHeight() {return this.#renderer.canvasHeight;}

    get stats() {return {...this.#stats};}
    get statsExtra() {return this.#stats.extra;}

    get rigidBodies() {return this.#solver.rigidBodies;}
    get constraints() {return this.#solver.constraints;}


    /**
     * @param renderer
     * @param {{
     *          debug?: boolean, slowMotion?: number, useDpr?: boolean,
     *          showBoundary?: boolean, showVectorLength?: boolean, showVector?: boolean, statistics?: boolean,
     *          solverSteps?: number, solverBias?: number, solverBeta?: number, allowedOverlap?: boolean, solverWarming?: boolean,
     *          solverTreeDivider?: number, solverTreeMaxCount?: number
     * }} options
     */
    constructor(renderer, options = {}) {
        this.#renderer = renderer;

        this.#debug = options.debug;
        this.#slowMotion = Math.max(0.01, Math.min(2, options.slowMotion ?? 1));

        this.#particleSystem = new ParticleSystem();
        this.#particleSystem.onParticleCreated.subscribe(this, this.#addParticle.bind(this));
        this.#particleSystem.onParticleDeleted.subscribe(this, this.#destroyParticle.bind(this));

        this.#solver = new ImpulseBasedSolver();
        if (Number.isFinite(options.solverSteps)) this.#solver.steps = options.solverSteps;
        if (Number.isFinite(options.solverBias)) this.#solver.velocityBiasFactor = options.solverBias;
        if (Number.isFinite(options.solverBeta)) this.#solver.positionCorrectionBeta = options.solverBeta;
        if (Number.isFinite(options.allowedOverlap)) this.#solver.allowedOverlap = options.allowedOverlap;
        if (Number.isFinite(options.solverTreeDivider)) this.#solver.treeDivider = options.solverTreeDivider;
        if (Number.isFinite(options.solverTreeMaxCount)) this.#solver.treeMaxCount = options.solverTreeMaxCount;
        if (options.solverWarming !== undefined) this.#solver.warming = options.solverWarming;

        if (options.debug) {
            this.#debugInstance = new Debug(options);
            this.#solver.setDebugger(this.#debugInstance);
            window.__app = {DebugInstance: this.#debugInstance};
        }

        if (options.statistics) {
            this.#statsElement = document.createElement("pre");
            document.body.appendChild(this.#statsElement);
        }

        this.#init();
    }

    /**
     * @template T
     *
     * @param {Body} body
     * @param {T} [renderer=null]
     * @return {{body: Body, renderer: T}}
     */
    addRigidBody(body, renderer = null) {
        if (!body) {
            throw new Error("Body should be specified");
        }

        this.#solver.addRigidBody(body);
        if (renderer !== null) {
            this.#renderer.addObject(renderer);
        } else {
            renderer = this.#renderer.addBody(body);
        }

        this.#bodyToRenderObj.set(body, renderer);
        return {body, renderer};
    }

    addRenderStep(renderer) {
        this.#renderer.addObject(renderer);
    }

    /**
     * @param {ParticleEmitter} emitter
     */
    addParticleEmitter(emitter) {
        this.#particleSystem.addParticleEmitter(emitter);
    }

    /***
     * @param {Particle} particle
     */
    addParticle(particle) {
        this.#particleSystem.addParticle(particle);
    }

    /**
     * @template TRet
     * @param {WaiterCallback<TRet>} callback
     * @return {Promise<TRet>}
     */
    async requestRenderFrame(callback) {
        return await this.#addWaiter(this.#renderWaiters, callback);
    }

    /**
     * @template TRet
     * @param {WaiterCallback<TRet>} callback
     * @return {Promise<TRet>}
     */
    async requestPhysicsFrame(callback) {
        return await this.#addWaiter(this.#physicsWaiters, callback);
    }

    async #addWaiter(collection, callback) {
        return new Promise((resolve, reject) => {
            collection.add(delta => {
                try {
                    resolve(callback(delta));
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    /**
     * @param {ParticleSystem} sender
     * @param {Particle} particle
     */
    #addParticle(sender, particle) {
        if (this.#bodyParticle.has(particle.body)) throw new Error("Body already used");

        this.addRigidBody(particle.body, particle.renderObject);
        this.#bodyParticle.set(particle.body, particle);
    }

    /**
     * @param {ParticleSystem} sender
     * @param {Particle} particle
     */
    #destroyParticle(sender, particle) {
        this.#bodyParticle.delete(particle.body);
        this.#destroyBodyImpl(particle.body);
    }

    /**
     * @param {Body} body
     */
    destroyBody(body) {
        if (this.#bodyParticle.has(body)) {
            this.#bodyParticle.get(body).destroy();
        } else {
            this.#destroyBodyImpl(body);
        }
    }

    #destroyBodyImpl(body) {
        const index = this.#solver.rigidBodies.indexOf(body);
        if (index !== -1) {
            this.#solver.rigidBodies.splice(index, 1);

            const rendererObj = this.#bodyToRenderObj.get(body);
            if (rendererObj) {
                this.#renderer.removeObject(rendererObj);
                this.#bodyToRenderObj.delete(body);
            }
        } else {
            console.warn(`Unable to find object ${body}`);
        }
    }

    /** @param constraint */
    addConstraint(constraint) {
        this.#solver.addConstraint(constraint);
    }

    /** @param force*/
    addForce(force) {
        this.#solver.addForce(force);
    }

    /**
     * @param {Body} body
     * @return {BodyRenderer}
     */
    getRenderObject(body) {
        return this.#bodyToRenderObj.get(body);
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
        this.#drawingShapes.set(this.#shapeId, {type: ShapeType.point, point, color});
        return this.#shapeId++;
    }

    addVector(point, size, color = "black") {
        this.#drawingShapes.set(this.#shapeId, {type: ShapeType.vector, point, size, color});
        return this.#shapeId++;
    }

    addRect(rect, color = "black") {
        this.#drawingShapes.set(this.#shapeId, {type: ShapeType.rect, rect, color});
        return this.#shapeId++;
    }

    removeShape(id) {
        if (this.#drawingShapes.has(id)) {
            this.#drawingShapes.delete(id);
        }
    }

    enableHotKeys() {
        document.body.onkeydown = (e) => {
            if (e.code === "Escape") this.state === State.play ? this.pause() : this.play();
            else if (e.code === "Space") this.stepMode();
            else return;

            e.preventDefault();
        }
    }

    #init() {
        this.#renderer.init();

        const rect = this.#renderer.canvas.getBoundingClientRect();

        this.#auxCanvas = document.createElement("canvas");
        this.#auxCanvas.style.pointerEvents = "none";
        this.#auxCanvas.style.touchAction = "none";
        this.#auxCanvas.style.zIndex = "9999999";
        this.#auxCanvas.style.position = "absolute";
        this.#auxCanvas.style.left = rect.left + "px";
        this.#auxCanvas.style.top = rect.top + "px";
        this.#auxCanvas.style.width = rect.width + "px";
        this.#auxCanvas.style.height = rect.height + "px";

        document.body.appendChild(this.#auxCanvas);

        const {dpr} = CommonUtils.initCanvas(this.#auxCanvas);
        this.#auxCtx = this.#auxCanvas.getContext("2d");
        this.#auxCtx.scale(dpr, dpr)

        if (this.#statsElement) {
            this.#statsElement.className = "stats-block";
            this.#statsElement.style.pointerEvents = "none";
            this.#statsElement.style.position = "absolute";
            this.#statsElement.style.left = "1rem";
            this.#statsElement.style.bottom = "1rem";
            this.#statsElement.style.margin = "0";
            this.#statsElement.style.fontSize = "0.6rem";
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

            for (const collision of this.#solver.stepInfo.collisions) {
                collision.aBody.collider.onCollide(collision, collision.bBody);
                collision.bBody.collider.onCollide(collision, collision.aBody);
            }
        }

        if (this.state === State.step) {
            this.pause();
        }

        this.#stats.physicsTime = performance.now() - t;
        this.#stats.treeTime = this.#solver.stepInfo.treeTime;
        this.#stats.collisionTime = this.#solver.stepInfo.collisionTime;
        this.#stats.bodiesCount = this.#solver.rigidBodies.length
        this.#stats.collisionCount = this.#solver.stepInfo.collisionCount;
        this.#stats.checkCount = this.#solver.stepInfo.checkCount;

        requestAnimationFrame(timestamp => {
            this.#stats.elapsed = timestamp - this.#stats.lastStepTime;
            this.#stats.lastStepTime = timestamp;

            const t = performance.now();
            this.#render(this.#solver.stepInfo.delta);
            this.#stats.renderTime = performance.now() - t;

            setTimeout(() => this.#step());
        });
    }

    #physicsStep(elapsed) {
        const delta = Math.max(0, Math.min(0.1, elapsed * this.#slowMotion));
        if (delta === 0) return;

        for (const waiterCb of this.#physicsWaiters) waiterCb(delta);
        this.#physicsWaiters.clear();

        this.#particleSystem.step(delta);
        this.#solver.solve(delta);
    }

    #render(delta) {
        if (!this.#debugInstance || this.#debugInstance.showBodies) {
            this.#renderer.render(this.state === State.play ? delta : 1e-12);
        }

        if (this.state === State.play) {
            for (const waiterCb of this.#renderWaiters) waiterCb(delta);
            this.#renderWaiters.clear();
        }

        if (this.#debugInstance || this.#shapeId > 0) {
            this.#auxCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        }

        if (this.#debug) {
            this.#debugInstance.render(this.#auxCtx, this.#solver.rigidBodies, this.#solver.stepInfo.tree);
        }

        for (const shape of this.#drawingShapes.values()) {
            switch (shape.type) {
                case ShapeType.point:
                    this.#drawPoint(shape.point, shape.color);
                    break;
                case ShapeType.vector:
                    this.#drawVector(shape.point, shape.size, shape.color);
                    break;
                case ShapeType.rect:
                    this.#drawRect(shape.rect, shape.color);
                    break;
            }
        }

        if (this.#statsElement) {
            let eMovement = 0, eRotation = 0;
            for (const body of this.#solver.rigidBodies) {
                eMovement += body.mass / 2 * Math.pow(body.velocity.length(), 2);
                eRotation += body.inertia / 2 * Math.pow(body.angularVelocity, 2);
            }

            const extra = Object.entries(this.#stats.extra).map(([key, value]) => `${key}: ${value}`);
            this.#statsElement.innerText = [
                `Bodies: ${this.#stats.bodiesCount}`,
                `Collisions: ${this.#stats.collisionCount}`,
                `Checks: ${this.#stats.checkCount} (${this.#stats.bodiesCount * (this.#stats.bodiesCount + 1) / 2})`,
                `Total energy: ${Utils.formatStandardUnit(eMovement + eRotation, "J")}`,
                ` - movement: ${Utils.formatStandardUnit(eMovement, "J")}`,
                ` - rotation: ${Utils.formatStandardUnit(eRotation, "J")}`,
                `FPS: ${(1000 / this.#stats.elapsed).toFixed(0)}`,
                `Physics time: ${this.#stats.physicsTime.toFixed(2)}ms`,
                ` - tree: ${this.#stats.treeTime.toFixed(2)}ms`,
                ` - collision: ${this.#stats.collisionTime.toFixed(2)}ms`,
                `Render time: ${this.#stats.renderTime.toFixed(2)}ms`,
                ...extra
            ].join("\n");
        }
    }

    #drawPoint(point, color, size = 2) {
        this.#auxCtx.strokeStyle = color;
        this.#auxCtx.fillStyle = color;

        this.#auxCtx.beginPath();
        this.#auxCtx.arc(point.x, point.y, size, 0, Math.PI * 2);
        this.#auxCtx.fill()
    }

    #drawVector(point, size, color, pointSize = 2) {
        this.#auxCtx.strokeStyle = color;

        this.#auxCtx.beginPath();
        this.#auxCtx.moveTo(point.x, point.y);
        this.#auxCtx.lineTo(point.x + size.x, point.y + size.y);
        this.#auxCtx.stroke()

        this.#drawPoint(point.copy().add(size), color, pointSize);
    }

    #drawRect(rect, color) {
        this.#auxCtx.strokeStyle = color;
        this.#auxCtx.strokeRect(rect.left, rect.top, rect.width, rect.height);
    }
}