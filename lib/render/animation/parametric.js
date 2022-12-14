import * as CommonUtils from "../../utils/common.js";
import {AnimationDirection, AnimationMode, EasingFunctions, IParametricAnimation} from "./base.js";

/**
 * @extends IParametricAnimation<ParametricAnimation>
 */
export class ParametricAnimation extends IParametricAnimation {
    #min;
    #max;
    #step;
    #initial;
    #size;

    #relativeStep;
    #relativeValue;
    #relativeInitial;
    #easing = EasingFunctions.linear;

    #repeatLimit = 0;
    #repeatedCount = 0;
    #direction = AnimationDirection.forward;
    #mode = AnimationMode.once;

    get easing() {return this.#easing();}
    get repeatedCount() {return this.#repeatedCount;}
    get repeatCount() {return this.#repeatLimit;}
    get direction() {return this.#direction;}
    get mode() {return this.#mode;}

    /**
     * @param {number} min
     * @param {number} max
     * @param {number} [step=1]
     * @param {number|null} [initial=null]
     */
    constructor(min, max, step = 1, initial = null) {
        super();

        this.#min = min;
        this.#max = Math.max(this.#min + 1e-6, max);
        this.#step = step;
        this.#initial = initial;

        this.#size = (max - min);
        this.#relativeStep = step / this.#size;

        const value = initial ?? min;
        this.#relativeInitial = (CommonUtils.clamp(min, max, value) - min) / this.#size;
        this.#relativeValue = this.#relativeInitial;
    }


    setEasing(easing) {
        this.#easing = easing;

        return this;
    }

    setMode(value) {
        this.#mode = value;
        this.reset();

        return this;
    }

    setDirection(value) {
        this.#direction = value;
        this.reset();

        return this;
    }

    setRepeatLimit(value) {
        this.#repeatLimit = value;
        this.#repeatedCount = 0;

        return this;
    }

    reset() {
        this.#repeatedCount = 0;
        this.#relativeValue = this.#relativeInitial;

        this.#relativeStep = this.#direction === AnimationDirection.backward ? -Math.abs(this.#relativeStep) : Math.abs(this.#relativeStep);
        if (this.#relativeValue <= 0 || this.#relativeValue >= 1) {
            this.#relativeValue = this.#direction === AnimationDirection.backward ? 1 : 0;
        }
    }

    next(delta) {
        if (!this.hasNextValue()) {
            if (this.direction === AnimationDirection.backward) return this.#min;
            return this.#max;
        }

        const current = this.#min + this.#size * this.#easing(this.#relativeValue);
        this.#relativeValue = CommonUtils.clamp(-1e-6, 1 + 1e-6, this.#relativeValue + this.#relativeStep * delta);
        switch (this.direction) {
            case AnimationDirection.forward:
                if (this.#relativeValue > 1) {
                    this.#relativeValue = 0;
                    ++this.#repeatedCount;
                }
                break;
            case AnimationDirection.backward:
                if (this.#relativeValue < 0) {
                    this.#relativeValue = 1
                    ++this.#repeatedCount;
                }
                break;

            case AnimationDirection.both:
                if (this.#relativeValue < 0) {
                    this.#relativeStep *= -1
                } else if (this.#relativeValue > 1) {
                    this.#relativeStep *= -1
                    ++this.#repeatedCount;
                }
                break;
        }

        return current;
    }

    hasNextValue() {
        if (this.#mode === AnimationMode.once && this.#repeatedCount > 0) {
            return false;
        } else if (this.#mode === AnimationMode.repeating && this.#repeatLimit > 0 && this.#repeatedCount >= this.#repeatLimit) {
            return false;
        }

        return true;
    }
}

/**
 * @abstract
 */
export class ParametricBasedAnimation extends IParametricAnimation {
    /** @type{ParametricAnimation} */
    #parametricAnimation;

    get parametricAnimation() {return this.#parametricAnimation;}

    /**
     * @param {number} from
     * @param {number} to
     * @param {number} step
     */
    constructor(from, to, step) {
        super();

        this.#parametricAnimation = new ParametricAnimation(from, to, step);
    }

    setEasing(easing) {
        this.#parametricAnimation.setEasing(easing);
        return this;
    }

    setMode(value) {
        this.#parametricAnimation.setMode(value);
        return this;
    }

    setDirection(value) {
        this.#parametricAnimation.setDirection(value);
        return this;
    }

    setRepeatLimit(value) {
        this.#parametricAnimation.setRepeatLimit(value);
        return this;
    }

    reset() {
        this.#parametricAnimation.reset();
    }

    hasNextValue() {
        return this.#parametricAnimation.hasNextValue();
    }
}

