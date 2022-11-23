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

    set(vector) {
        this.x = vector.x;
        this.y = vector.y;

        return this;
    }

    elements() {
        return this.constructor.DIMENSIONS.map(d => this[d]);
    }

    copy() {
        return new Vector2(this.x, this.y);
    }

    add(vector) {
        this.x += vector.x;
        this.y += vector.y;

        return this;
    }

    sub(vector) {
        this.x -= vector.x;
        this.y -= vector.y;

        return this;
    }

    delta(vector) {
        return new Vector2(
            this.x - vector.x,
            this.y - vector.y
        );
    }

    tangent(vector) {
        return this.delta(vector).normalize();
    }

    mul(vector) {
        this.x *= vector.x;
        this.y *= vector.y;

        return this;
    }

    div(vector) {
        this.x /= vector.x;
        this.y /= vector.y;

        return this;
    }

    negate() {
        this.x = -this.x;
        this.y = -this.y;

        return this;
    }

    negated() {
        return this.copy().negate();
    }

    invert() {
        this.x = 1 / this.x;
        this.y = 1 / this.y;

        return this;
    }

    zero() {
        this.x = 0;
        this.y = 0;

        return this;
    }

    normalize() {
        const length = this.length();
        if (length > 0) {
            this.x /= length;
            this.y /= length;

            return this;
        }

        return this.zero();
    }

    normalized() {
        return this.copy().normalize();
    }

    scale(scalar) {
        this.x *= scalar;
        this.y *= scalar;

        return this;
    }

    scaled(scalar) {
        return this.copy().scale(scalar);
    }

    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }

    length() {
        return Math.sqrt(this.dot(this));
    }

    lengthSquared() {
        return this.dot(this);
    }

    /**
     * @param {Vector2} vector
     */
    cross(vector) {
        return this.x * vector.y - this.y * vector.x;
    }

    /**
     * @param {number} scalar
     */
    crossScalar(scalar) {
        return new Vector2(-scalar * this.y, scalar * this.x);
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
}