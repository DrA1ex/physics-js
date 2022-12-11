import {Vector2} from "../utils/vector.js";
import {EasingFunctions} from "./animation.js";
import {Particle} from "./particle.js";
import {EventEmitter} from "../utils/event.js";

class IValueProvider {

    /**
     * @abstract
     *
     * @param {number} delta
     * @return {*}
     */
    next(delta) {}
}

/**
 * @template T
 * @extends T
 */
export class NumericValueProvider extends IValueProvider {
    #value;

    #spread = 0;
    #spreadEasing = EasingFunctions.linear;

    /**
     * @param {number} value
     */
    constructor(value) {
        super();
        this.#value = value;
    }

    /**
     * @param {number} spread
     * @param {EasingFunction} [easing=null]
     * @return {T}
     */
    setSpread(spread, easing = null) {
        this.#spread = spread;
        if (easing) this.#spreadEasing = easing;

        return this;
    }

    next(delta) {
        const spreadFactor = this.#spreadEasing(Math.random());
        return this.#value + this.#spread * (0.5 - spreadFactor);
    }
}

export class LinerRateProvider extends NumericValueProvider {
    next(delta) {
        return super.next(delta) * delta;
    }
}

export class VectorValueProvider extends IValueProvider {
    #xProvider;
    #yProvider;

    /**
     * @param {NumericValueProvider} xProvider
     * @param {NumericValueProvider} yProvider
     */
    constructor(xProvider, yProvider) {
        super();
        this.#xProvider = xProvider;
        this.#yProvider = yProvider;
    }

    next(delta) {
        return new Vector2(this.#xProvider.next(delta), this.#yProvider.next(delta));
    }
}

export class ParticleEmitter extends EventEmitter {
    #positionProvider;
    #rateProvider;
    #particleType;
    #notUsedRate = 0;

    #particleArgs = [];

    /** @type {Event<Particle>} */
    #onParticleCreated = this.createEvent("particle_created")

    get onParticleCreated() {return this.#onParticleCreated;}

    /**
     * @param {typeof Particle} particleType
     * @param {VectorValueProvider} positionProvider
     * @param {NumericValueProvider} rateProvider
     */
    constructor(particleType, positionProvider, rateProvider) {
        super();

        this.#particleType = particleType;
        this.#positionProvider = positionProvider;
        this.#rateProvider = rateProvider;
    }

    /***
     * @param {*} args
     * @return {ParticleEmitter}
     */
    setParticleArguments(...args) {
        this.#particleArgs = args;

        return this;
    }

    step(delta) {
        const rate = this.#rateProvider.next(delta);
        const count = Math.floor(rate + this.#notUsedRate);
        this.#notUsedRate += rate - count;

        for (let i = 0; i < count; i++) {
            const position = this.#positionProvider.next(delta);
            const particle = new this.#particleType(position.x, position.y, ...this.#particleArgs);

            this.#particleCreated(particle);
        }
    }

    #particleCreated(particle) {
        const initialState = particle.transitions.get(Particle.InitialState);
        if (initialState !== undefined) {
            particle.setState(initialState);
        }

        this.onParticleCreated.emit(particle);
    }
}

export class ParticleSystem extends EventEmitter {
    /** @type {Set<ParticleEmitter>} */
    #emitters = new Set();
    /** @type {Set<Particle>}  */
    #particles = new Set();

    /** @type {Event<Particle>} */
    #onParticleCreated = this.createEvent("particle_created");
    /** @type {Event<Particle>} */
    #onParticleDeleted = this.createEvent("particle_deleted");

    get onParticleCreated() {return this.#onParticleCreated;}
    get onParticleDeleted() {return this.#onParticleDeleted;}

    /**
     * @param {ParticleEmitter} emitter
     */
    addParticleEmitter(emitter) {
        emitter.onParticleCreated.subscribe(this, (sender, p) => { this.addParticle(p); });
        this.#emitters.add(emitter);
    }

    step(delta) {
        for (let emitter of this.#emitters.values()) {
            emitter.step(delta);
        }

        for (const particle of this.#particles.values()) {
            particle.step(delta);
            if (particle.destroyed) this.#destroyParticle(particle);
        }
    }

    /**
     * @param {Particle} particle
     */
    addParticle(particle) {
        this.#particles.add(particle);
        this.onParticleCreated.emit(particle);
    }

    #destroyParticle(particle) {
        if (this.#particles.has(particle)) {
            this.#particles.delete(particle);
            this.onParticleDeleted.emit(particle);
        } else {
            console.warn(`Unable to find particle ${particle}`);
        }
    }
}