export class Vector2 {
    x = 0;
    y = 0;

    /**
     * @param {number} [x=0]
     * @param {number} [y=0]
     */
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * @param {number} angle
     * @return {Vector2}
     */
    static fromAngle(angle) {
        return new Vector2(Math.cos(angle), Math.sin(angle));
    }

    /**
     * @param {Vector2} vector
     * @return {Vector2}
     */
    set(vector) {
        this.x = vector.x;
        this.y = vector.y;

        return this;
    }

    copy() {
        return new Vector2(this.x, this.y);
    }

    /**
     * @param {Vector2} vector
     * @return {Vector2}
     */
    add(vector) {
        this.x += vector.x;
        this.y += vector.y;

        return this;
    }

    /**
     * @param {Vector2} vector
     * @return {Vector2}
     */
    sub(vector) {
        this.x -= vector.x;
        this.y -= vector.y;

        return this;
    }

    /**
     * @param {Vector2} vector
     * @return {Vector2}
     */
    delta(vector) {
        return new Vector2(
            this.x - vector.x,
            this.y - vector.y
        );
    }

    /**
     * @param {Vector2} vector
     * @return {Vector2}
     */
    tangent(vector) {
        return this.delta(vector).normalize();
    }

    /**
     * @param {Vector2} vector
     * @return {number}
     */
    angle(vector) {
        return Math.atan2(vector.y, vector.x) - Math.atan2(this.y, this.x);
    }

    /**
     * @param {Vector2} vector
     * @return {Vector2}
     */
    mul(vector) {
        this.x *= vector.x;
        this.y *= vector.y;

        return this;
    }

    /**
     * @param {Vector2} vector
     * @return {Vector2}
     */
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

    /**
     * @param {number} scalar
     * @return {Vector2}
     */
    scale(scalar) {
        this.x *= scalar;
        this.y *= scalar;

        return this;
    }

    /**
     * @param {number} scalar
     * @return {Vector2}
     */
    scaled(scalar) {
        return this.copy().scale(scalar);
    }

    /**
     * @param {Vector2} vector
     * @return {number}
     */
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
     * @return {number}
     */
    cross(vector) {
        return this.x * vector.y - this.y * vector.x;
    }

    /**
     * @param {number} scalar
     * @return {Vector2}
     */
    crossScalar(scalar) {
        return new Vector2(-scalar * this.y, scalar * this.x);
    }

    perpendicular() {
        return new Vector2(this.y, -this.x);
    }

    inlinePerpendicular() {
        const xTmp = this.x;

        // noinspection JSSuspiciousNameCombination
        this.x = this.y;
        this.y = -xTmp;

        return this;
    }

    normal() {
        return this.perpendicular().normalize();
    }

    /**
     * @param {number} angle
     * @param {Vector2|null} [anchor=null]
     * @return {Vector2}
     */
    rotated(angle, anchor = null) {
        return this.copy().rotate(angle, anchor);
    }

    /**
     * @param {number} angle
     * @param {Vector2|null} [anchor=null]
     * @return {Vector2}
     */
    rotate(angle, anchor = null) {
        anchor = anchor ?? new Vector2();

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const xTmp = this.x;
        this.x = cos * (this.x - anchor.x) - sin * (this.y - anchor.y) + anchor.x;
        this.y = sin * (xTmp - anchor.x) + cos * (this.y - anchor.y) + anchor.y;

        return this;
    }

    toString() {
        return `[${this.x}, ${this.y}]`;
    }

    /**
     * @param {number} count
     * @return {Vector2[]}
     */
    static array(count) {
        const result = new Array(count);
        for (let i = 0; i < count; i++) {
            result[i] = new Vector2();
        }

        return result;
    }
}