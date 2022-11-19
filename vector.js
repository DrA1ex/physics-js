export class Vector2 {
    static DIMENSIONS = ["x", "y"];

    x = 0;
    y = 0;

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    static fromAngle(angle) {
        return new Vector2(Math.cos(angle), Math.sin(angle));
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

    delta(vector) {
        return this.copy().sub(vector);
    }

    tangent(vector) {
        return this.delta(vector).normalize();
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

    negated() {
        return this.copy().negate();
    }

    invert() {
        return this.#apply(value => 1 / value);
    }

    zero() {
        return this.#apply(() => 0);
    }

    normalize() {
        const length = this.length();
        if (length > 0) {
            return this.#apply(value => value / length);
        }

        return this.zero();
    }

    normalized() {
        return this.copy().normalize();
    }

    scale(scalar) {
        return this.#apply(value => value * scalar);
    }

    scaled(scalar) {
        return this.copy().scale(scalar);
    }

    dot(vector) {
        return this.#aggregate((acc, value, dimension) => acc + value * vector[dimension]);
    }

    length() {
        return Math.sqrt(this.dot(this));
    }

    lengthSquared() {
        return this.dot(this);
    }

    cross(vector) {
        return this.x * vector.y - this.y * vector.x;
    }

    perpendicular() {
        return new Vector2(this.y, -this.x);
    }

    normal() {
        return this.perpendicular().normalize();
    }

    rotated(angle, anchor = null) {
        anchor = anchor ?? new Vector2();

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        return new Vector2(
            cos * (this.x - anchor.x) - sin * (this.y - anchor.y) + anchor.x,
            sin * (this.x - anchor.x) + cos * (this.y - anchor.y) + anchor.y
        );
    }

    /**
     * @param {function(value: number, dimension: string )} fn
     * @return {Vector2}
     */
    #apply(fn) {
        for (const dimension of this.constructor.DIMENSIONS) {
            this[dimension] = fn(this[dimension], dimension);
        }

        return this;
    }

    /**
     *
     * @param {function(acc: number, value: number, dimension: string )} fn
     * @param {number} [init=0]
     * @return {number}
     */
    #aggregate(fn, init = 0) {
        let acc = init;
        for (const dimension of this.constructor.DIMENSIONS) {
            acc = fn(acc, this[dimension], dimension);
        }

        return acc;
    }
}