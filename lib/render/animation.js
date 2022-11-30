import {BoundaryBox} from "../physics/body.js";
import {Vector2} from "../utils/vector.js";
import * as GeomUtils from "../utils/geom.js";
import * as CommonUtils from "../utils/common.js";

/**
 * @enum {string}
 */
export const SkewAnimationAxis = {
    x: "x",
    y: "y"
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
     * @param layer
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

        const value = initial === null ? min + Math.random() * this.#size : initial;
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
     * @param {number} delta
     * @return {number}
     */
    next(delta) {
        const current = this.#min + this.#size * this.#easing(this.#relativeValue);

        this.#relativeValue = CommonUtils.clamp(0, 1, this.#relativeValue + this.#relativeStep * delta);

        if (this.#relativeValue <= 0 || this.#relativeValue >= 1) {
            this.#relativeStep *= -1;
        }

        return current;
    }
}

export class SkewLayerAnimation extends ILayerAnimation {
    axis;
    anchor;
    parametricAnimation;

    /**
     * @param {SkewAnimationAxis} axis
     * @param {ParametricAnimation} parametricAnimation
     * @param {Vector2} [anchor=new Vector2(0, 0)]
     */
    constructor(axis, parametricAnimation, anchor = new Vector2(0, 0)) {
        super();

        this.axis = axis;
        this.parametricAnimation = parametricAnimation;
        this.anchor = anchor;
    }

    apply(layer, delta) {
        this.#prepareLayer(layer);

        const value = this.parametricAnimation.next(delta);
        const scale = new Vector2(1, 1);
        const skew = this.axis === SkewAnimationAxis.x ? new Vector2(value, 0) : new Vector2(0, value);

        for (let i = 0; i < layer.__originalPoints.length; i++) {
            const originalPoints = layer.__originalPoints[i];
            const boundary = BoundaryBox.fromPoints(originalPoints);
            const anchor = new Vector2(boundary.width, boundary.height).mul(this.anchor).add(boundary.center);

            for (let j = 0; j < originalPoints.length; j++) {
                const point = originalPoints[j];

                const localPoint = point.delta(anchor);
                GeomUtils.transform(localPoint, scale, skew, localPoint);

                layer.paths[i].points[j].set(localPoint).add(anchor);
            }
        }
    }

    #prepareLayer(layer) {
        if (!layer.__originalPoints) {
            layer.__originalPoints = [...layer.paths.map(path => path.points.map(p => p.copy()))];
        }
    }
}