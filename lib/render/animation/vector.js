import {ParametricBasedAnimation} from "./parametric.js";

/**
 * @extends {ParametricBasedAnimation<VectorAnimation, Vector2>}
 */
export class VectorAnimation extends ParametricBasedAnimation {
    #from;
    #to;
    #delta;

    get from() {return this.#from;}
    get to() {return this.#to;}
    get delta() {return this.#delta;}

    /**
     * @param {Vector2} from
     * @param {Vector2} to
     * @param {number} step
     */
    constructor(from, to, step) {
        super(0, 1, step);

        this.#from = from.copy();
        this.#to = to.copy();
        this.#delta = this.#to.delta(this.#from);
    }

    next(delta) {
        const value = this.parametricAnimation.next(delta);
        return this.#delta.scaled(value).add(this.#from);
    };
}