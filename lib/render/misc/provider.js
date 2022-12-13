import {Vector2} from "../../utils/vector.js";
import {EasingFunctions} from "../animation/base.js";

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

    /***
     * @param {number} value
     * @param {number} spread
     * @param {EasingFunction} [easing=null]
     * @return {T}
     */
    static fromValue(value, spread, easing = null) {
        return new NumericValueProvider(value).setSpread(spread, easing);
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

    /**
     * @param {number} xSpread
     * @param {number} ySpread
     * @param {EasingFunction} [easing=null]
     * @return {VectorValueProvider}
     */
    setSpread(xSpread, ySpread, easing = null) {
        this.#xProvider.setSpread(xSpread, easing);
        this.#yProvider.setSpread(ySpread, easing);

        return this;
    }

    /**
     * @param {Vector2} vector
     * @return {VectorValueProvider}
     */
    static fromPoint(vector) {
        return new VectorValueProvider(NumericValueProvider.fromValue(vector.x), NumericValueProvider.fromValue(vector.y));
    }
}