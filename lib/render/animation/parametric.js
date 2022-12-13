import {AngleAnimationDirection, AnimationDirection, AnimationMode, EasingFunctions, IParametricAnimation} from "./base.js";
import * as CommonUtils from "../../utils/common.js";
import {formatAngle} from "../../utils/common.js";
import * as ColorUtils from "../../utils/color.js";

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

/**
 *
 * @extends {ParametricBasedAnimation<ColorAnimation, string>}
 */
export class ColorAnimation extends ParametricBasedAnimation {
    #startColor;
    #endColor;
    #step;

    /**
     * @param {string} startColor
     * @param {string} endColor
     * @param {number} step
     */
    constructor(startColor, endColor, step) {
        super(0, 1, step);

        if (typeof startColor !== "string") throw new Error(`Invalid parameter value ${startColor}`)
        if (typeof endColor !== "string") throw new Error(`Invalid parameter value ${endColor}`)

        this.#startColor = startColor;
        this.#endColor = endColor;
        this.#step = step;
    }

    /**
     * @param delta
     * @return {string}
     */
    next(delta) {
        const value = this.parametricAnimation.next(delta);
        return ColorUtils.colorBetween(this.#startColor, this.#endColor, value);
    }
}

export class NumericAnimation extends ParametricBasedAnimation {
    #from;
    #to;
    #size;

    get from() {return this.#from;}
    get to() {return this.#to;}
    get size() {return this.#size;}


    /**
     * @param {number} from
     * @param {number} to
     * @param {number} step
     */
    constructor(from, to, step) {
        if (!Number.isFinite(from) || !Number.isFinite(to)) throw new Error("Invalid parameter value: value is not a number");

        super(0, 1, step);

        if (from <= to) {
            [this.#from, this.#to] = [from, to];
        } else {
            [this.#from, this.#to] = [to, from];
            this.setDirection(AnimationDirection.backward);
        }

        this.#size = this.#to - this.#from;
    }

    next(delta) {
        const value = this.parametricAnimation.next(delta);
        return this.#from + this.#size * value
    };
}

export class PercentAnimation extends NumericAnimation {
    /**
     * @param {string} from
     * @param {string} to
     * @param {number} step
     */
    constructor(from, to, step) {
        const begin = Number.parseFloat(from);
        const end = Number.parseFloat(to);

        super(begin, end, step);
    }

    next(delta) {
        return `${super.next(delta)}%`;
    }
}

export class AngleAnimation extends NumericAnimation {
    #unit;

    /**
     * @param {string} from
     * @param {string} to
     * @param {number} step
     * @param {AngleAnimationDirection} [direction=AngleAnimationDirection.nearest]
     */
    constructor(from, to, step, direction = AngleAnimationDirection.nearest) {
        let [fromRad, unit] = CommonUtils.parseAngle(from);
        let [toRad] = CommonUtils.parseAngle(to);

        fromRad = CommonUtils.clampPeriodic(fromRad, Math.PI * 2);
        toRad = CommonUtils.clampPeriodic(toRad, Math.PI * 2);

        [fromRad, toRad] = AngleAnimation.#prepareAngles(fromRad, toRad, direction);

        super(fromRad, toRad, step);
        this.#unit = unit;
    }

    next(delta) {
        return formatAngle(super.next(delta), this.#unit);
    }

    static #prepareAngles(fromRad, toRad, direction) {
        if (direction === AngleAnimationDirection.unset) return [fromRad, toRad];

        const pi_2 = Math.PI * 2;
        fromRad = CommonUtils.clampPeriodic(fromRad, pi_2);
        toRad = CommonUtils.clampPeriodic(toRad, pi_2);

        switch (direction) {
            case AngleAnimationDirection.clockwise:
                if (toRad < fromRad) toRad += pi_2;
                break;

            case AngleAnimationDirection.anticlockwise:
                if (fromRad < toRad) fromRad += pi_2;
                break;

            case AngleAnimationDirection.nearest:
                const directDistance = Math.abs(toRad - fromRad);
                if (directDistance > Math.PI) {
                    if (fromRad < toRad) {
                        fromRad += pi_2;
                    } else {
                        toRad += pi_2;
                    }
                }
                break;
        }

        return [fromRad, toRad];
    }
}