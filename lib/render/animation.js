import {BoundaryBox} from "../physics/body.js";
import {Vector2} from "../utils/vector.js";
import * as GeomUtils from "../utils/geom.js";
import * as CommonUtils from "../utils/common.js";

/**
 * @enum {string}
 */
export const AnimationAxis = {
    x: "x",
    xInverted: "xInverted",
    y: "y",
    yInverted: "yInverted"
}

/**
 * @enum {string}
 */
export const AnimationDirection = {
    forward: "forward",
    backward: "backward",
    both: "both",
}

/**
 * @enum {string}
 */
export const AnimationMode = {
    repeating: "repeating",
    once: "once",
}

// noinspection JSUnusedGlobalSymbols
/**
 * @readonly
 */
export const EasingFunctions = {
    linear: t => t,
    easeInSine: x => 1 - Math.cos((x * Math.PI) / 2),
    easeOutSine: x => Math.sin((x * Math.PI) / 2),
    easeInOutSine: x => -(Math.cos(Math.PI * x) - 1) / 2,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInQuart: t => t * t * t * t,
    easeOutQuart: t => 1 - (--t) * t * t * t,
    easeInOutQuart: t => t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    easeInQuint: t => t * t * t * t * t,
    easeOutQuint: t => 1 + (--t) * t * t * t * t,
    easeInOutQuint: t => t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
    easeInElastic: t => t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * (2 * Math.PI) / 3),
    easeOutElastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1,
    easeInOutElastic: t => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI) / 4.5)) / 2 : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI) / 4.5)) / 2 + 1,
}

export class ILayerAnimation {
    /**
     * @abstract
     *
     * @param {Layer} layer
     * @param {number} delta
     * @return {void}
     */
    apply(layer, delta) {}
}


export class IPathAnimation {

    /**
     * @abstract
     *
     * @param {Path} layer
     * @param {number} delta
     * @return {void}
     */
    apply(layer, delta) {}
}

export class ParametricAnimation {
    #min;
    #max;
    #size;

    #relativeStep;
    #relativeValue;
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
        this.#min = min;
        this.#max = Math.max(this.#min + 1e-6, max);

        this.#size = (max - min);
        this.#relativeStep = step / this.#size;

        const value = initial ?? min;
        this.#relativeValue = (CommonUtils.clamp(min, max, value) - min) / this.#size;
    }

    /**
     * @param {function(t:number):number} easing
     * @return {ParametricAnimation}
     */
    setEasing(easing) {
        this.#easing = easing;

        return this;
    }

    /**
     * @param {AnimationMode} value
     * @return {ParametricAnimation}
     */
    setMode(value) {
        this.#repeatedCount = 0;
        this.#mode = value;

        return this;
    }

    /**
     * @param {AnimationDirection} value
     * @return {ParametricAnimation}
     */
    setDirection(value) {
        this.#direction = value;

        this.#relativeStep = this.#direction === AnimationDirection.backward ? -Math.abs(this.#relativeStep) : Math.abs(this.#relativeStep);
        if (this.#relativeValue > 0 || this > this.#relativeValue < 1) {
            this.#relativeValue = this.#direction === AnimationDirection.backward ? 1 : 0;
        }

        return this;
    }

    /**
     * @param {number} value
     * @return {ParametricAnimation}
     */
    setRepeatLimit(value) {
        this.#repeatLimit = value;
        this.#repeatedCount = 0;

        return this;
    }

    /**
     * @param {number} delta
     * @return {number}
     */
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

export class SkewPathAnimation extends IPathAnimation {
    /**
     * @typedef {{__originalPoints: Vector2[], __boundary: BoundaryBox}} PathExtension
     */

    axles;
    anchor;
    parametricAnimation;

    /**
     * @param {AnimationAxis[]} axles
     * @param {ParametricAnimation} parametricAnimation
     * @param {Vector2} [anchor=new Vector2(0, 0)]
     */
    constructor(axles, parametricAnimation, anchor = new Vector2(0, 0)) {
        super();

        this.axles = axles;
        this.parametricAnimation = parametricAnimation;
        this.anchor = anchor;
    }

    /**
     * @param {Path&PathExtension} path
     * @param {number} delta
     */
    apply(path, delta) {
        this.#preparePath(path);

        const value = this.parametricAnimation.next(delta);
        const scale = new Vector2(1, 1);

        const skew = this.#createSkewVector(value);

        const boundary = path.__boundary;
        const anchor = new Vector2(boundary.width, boundary.height).mul(this.anchor).add(boundary.center);

        for (let j = 0; j < path.__originalPoints.length; j++) {
            const point = path.__originalPoints[j];

            const localPoint = point.delta(anchor);
            GeomUtils.transform(localPoint, scale, skew, localPoint);

            path.points[j].set(localPoint).add(anchor);
        }
    }

    #createSkewVector(value) {
        const skew = new Vector2();
        for (const axis of this.axles) {
            switch (axis) {
                case AnimationAxis.x:
                    skew.x = value;
                    break;
                case AnimationAxis.xInverted:
                    skew.x = -value;
                    break;

                case AnimationAxis.y:
                    skew.x = value;
                    break;
                case AnimationAxis.yInverted:
                    skew.x = -value;
                    break;
            }
        }

        return skew;
    }

    #preparePath(path) {
        if (!path.__originalPoints) {
            path.__originalPoints = path.points.map(p => p.copy());
            path.__boundary = BoundaryBox.fromPoints(path.__originalPoints);
        }
    }
}