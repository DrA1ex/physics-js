export class Vector2 {
    static DIMENSIONS = ["x", "y"];

    x = 0;
    y = 0;

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    copy() {
        return new Vector2(...this.constructor.DIMENSIONS.map(d => this[d]));
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

    scale(scalar) {
        return this.#apply(value => value * scalar);
    }

    dot(vector) {
        return this.#aggregate((acc, value, dimension) => acc + value * vector[dimension]);
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