import {AnimationDirection} from "./base.js";
import {ParametricBasedAnimation} from "./parametric.js";

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