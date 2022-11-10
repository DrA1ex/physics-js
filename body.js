import {Vector2} from "./vector.js";
import {CircleCollider, RectCollider} from "./collision.js";

/** @typedef {Body|CirceBody} BodyType */

export class BoundaryBox {
    width;
    height;

    left = 0;
    right = 0;
    top = 0;
    bottom = 0;

    constructor(left, right, top, bottom) {
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;

        this.width = this.right - this.left;
        this.height = this.bottom - this.top;
        this.center = new Vector2(this.left + this.width / 2, this.top + this.height / 2);
    }

    static fromDimensions(x, y, width, height) {
        return new BoundaryBox(x, x + width, y, y + height);
    }
}

/**
 * @template T
 * @extends T
 */
export class Body {
    /** @type {Collider} */
    collider = null;

    active = true;
    position = new Vector2();
    velocity = new Vector2();
    _mass = 0;
    restitution = 1;

    constructor(x, y, mass) {
        this.position.x = x;
        this.position.y = y;
        this._mass = mass;

        this.collider = new RectCollider(this);
    }

    /** @return {T} */
    setActive(value) {
        this.active = value;
        return this;
    }

    /** @return {T} */
    setRestitution(value) {
        this.restitution = value;
        return this;
    }

    /** @return {T} */
    setVelocity(vector) {
        this.velocity = vector;
        return this;
    }

    /** @return {T} */
    setPosition(vector) {
        this.position = vector;
        return this;
    }

    get mass() {
        return this.active ? this._mass : Number.MAX_SAFE_INTEGER;
    }

    set mass(value) {
        this._mass = value;
    }

    /**
     * @abstract
     * @return {BoundaryBox}
     */
    get boundary() {
        return new BoundaryBox(this.position.x, this.position.x, this.position.y, this.position.y);
    }

    /**
     * @param {Vector2} impulse
     */
    applyImpulse(impulse) {
        const scaledImpulse = impulse.copy().scale(1 / this.mass);
        this.velocity.add(scaledImpulse);
    }
}

/**
 * @extends Body<RectBody>
 */
export class RectBody extends Body {
    width = 0;
    height = 0;

    constructor(x, y, width, height, mass) {
        super(x, y, mass);

        this.width = width;
        this.height = height;
    }

    get boundary() {
        return new BoundaryBox(
            this.position.x - this.width / 2, this.position.x + this.width / 2,
            this.position.y - this.height / 2, this.position.y + this.height / 2
        );
    }
}

/**
 * @extends Body<CirceBody>
 */
export class CirceBody extends Body {
    radius = 0;

    constructor(x, y, radius, mass) {
        super(x, y, mass);

        this.radius = radius;
        this.collider = new CircleCollider(this);
    }

    get boundary() {
        return new BoundaryBox(
            this.position.x - this.radius, this.position.x + this.radius,
            this.position.y - +this.radius, this.position.y + this.radius
        );
    }
}
