import {Vector2} from "../utils/vector.js";
import {EasingFunctions} from "./animation.js";

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

export class ParticleEmitter {
    #positionProvider;
    #rateProvider;
    #particleType;
    #notUsedRate = 0;

    #particleArgs = [];

    /**
     * @param {typeof Particle} particleType
     * @param {VectorValueProvider} positionProvider
     * @param {NumericValueProvider} rateProvider
     */
    constructor(particleType, positionProvider, rateProvider) {
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

    step(delta, callback) {
        const rate = this.#rateProvider.next(delta);
        const count = Math.floor(rate + this.#notUsedRate);
        this.#notUsedRate += rate - count;

        for (let i = 0; i < count; i++) {
            const position = this.#positionProvider.next(delta);
            const particle = new this.#particleType(position.x, position.y, ...this.#particleArgs);

            callback(particle);
        }
    }
}