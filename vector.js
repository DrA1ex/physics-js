export class Vector2 {
    static DIMENSIONS = ["x", "y"];

    x = 0;
    y = 0;

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    elements() {
        return this.constructor.DIMENSIONS.map(d => this[d]);
    }

    copy() {
        return new Vector2(...this.elements());
    }

    add(vector) {
        return this.#apply((value, dimension) => value + vector[dimension]);
    }

    sub(vector) {
        return this.#apply((value, dimension) => value - vector[dimension]);
    }

    mul(vector) {
        return this.#apply((value, dimension) => value * vector[dimension]);
    }

    div(vector) {
        return this.#apply((value, dimension) => value / vector[dimension]);
    }

    negate() {
        return this.#apply(value => -value);
    }

    invert() {
        return this.#apply(value => 1 / value);
    }

    zero() {
        return this.#apply(() => 0);
    }

    normalize() {
        const d = Math.sqrt(this.dot(this));
        return this.#apply(value => value / d);
    }

    scale(scalar) {
        return this.#apply(value => value * scalar);
    }

    dot(vector) {
        return this.#aggregate((acc, value, dimension) => acc + value * vector[dimension]);
    }

    length() {
        return Math.sqrt(this.dot(this));
    }

    cross(vector) {
        const reversed = vector.reverse();
        return this.#aggregate((acc, value, dimension) => acc - value * reversed[dimension]);
    }

    reversed() {
        return new Vector2(...this.constructor.DIMENSIONS.map(d => this[d]).reverse());
    }

    perpendicular() {
        return new Vector2(this.y, -this.x);
    }

    normal() {
        return this.perpendicular().normalize();
    }

    #apply(fn) {
        for (const dimension of this.constructor.DIMENSIONS) {
            this[dimension] = fn(this[dimension], dimension);
        }

        return this;
    }

    #aggregate(fn, init = 0) {
        let acc = init;
        for (const dimension of this.constructor.DIMENSIONS) {
            acc = fn(acc, this[dimension], dimension);
        }

        return acc;
    }
}