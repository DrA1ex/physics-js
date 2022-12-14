import * as ColorUtils from "../../utils/color.js";
import {ParametricBasedAnimation} from "./parametric.js";

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