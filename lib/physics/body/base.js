import {BoundaryBox} from "../common/boundary.js";
import {RectCollider} from "../collider/rect.js";
import {Vector2} from "../../utils/vector.js";

/**
 * @template T
 * @extends T
 */
export class Body {
    static #id = 0;

    /** @type {string|null} */
    _tag = null;

    /** @type {Collider} */
    collider;
    _active = true;
    _static = false;

    _id = 0;
    _mass = 0;
    _inertia = 0;

    _boundary = BoundaryBox.empty();

    inertiaFactor = 1;

    position = new Vector2();
    angle = 0;

    velocity = new Vector2();
    angularVelocity = 0;
    restitution = 0.5;
    friction = 0.2;

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} [mass=1]
     */
    constructor(x, y, mass = 1) {
        this._id = Body.#id++;
        this.position.x = x;
        this.position.y = y;
        this.mass = mass;

        this.collider = new RectCollider(this);
    }

    /** @return {T} */
    setTag(value) {
        this._tag = value;

        return this;
    }

    /** @return {T} */
    setActive(value) {
        this._active = value;

        this._invertedMass = Number.NaN;
        this._inertia = Number.NaN;
        this._invertedInertia = Number.NaN;

        return this;
    }

    /** @return {T} */
    setStatic(value) {
        this._static = value;

        return this;
    }

    /** @return {T} */
    setRestitution(value) {
        if (Number.isFinite(value)) this.restitution = value;
        return this;
    }

    /** @return {T} */
    setFriction(value) {
        if (Number.isFinite(value)) this.friction = value;
        return this;
    }

    /** @return {T} */
    setMass(value) {
        if (!Number.isFinite(value) || value <= 0) return this;

        this._mass = value;
        this._invertedMass = Number.NaN;
        this._inertia = Number.NaN;
        this._invertedInertia = Number.NaN;
        return this;
    }

    /** @return {T} */
    setInertiaFactor(value) {
        if (!Number.isFinite(value) || value <= 0) return this;

        this.inertiaFactor = value;
        this._inertia = Number.NaN;
        this._invertedInertia = Number.NaN;

        return this;
    }

    /** @return {T} */
    setVelocity(vector) {
        this.velocity = vector;
        return this;
    }

    /** @return {T} */
    setPosition(vector) {
        this.position.set(vector);
        return this;
    }

    /** @return {T} */
    setAngle(value) {
        if (Number.isFinite(value)) this.angle = value;
        return this;
    }

    /** @return {T} */
    setAngularVelocity(value) {
        if (Number.isFinite(value)) this.angularVelocity = value;
        return this;
    }

    get id() {return this._id;}
    get tag() {return this._tag;}
    get active() {return this._static ? false : this._active;}
    get static() {return this._static;}

    get mass() {return this.active ? this._mass : 1e12;}
    set mass(value) {this.setMass(value);}

    get invertedInertia() {
        if (Number.isNaN(this._invertedInertia)) {
            this._invertedInertia = this.active ? 1 / this.inertia : 0;
        }

        return this._invertedInertia
    }

    get invertedMass() {
        if (Number.isNaN(this._invertedMass)) {
            this._invertedMass = this.active ? 1 / this.mass : 0;
        }

        return this._invertedMass
    }

    get inertia() {
        if (Number.isNaN(this._inertia)) {
            this._inertia = this._calcInertia(this.mass) * this.inertiaFactor;
        }

        return this._inertia
    }


    /**
     * @param {number} mass
     * @return {number}
     * @protected
     */
    _calcInertia(mass) {
        return mass / 2;
    }

    /**
     * @abstract
     * @return {BoundaryBox}
     */
    get boundary() {
        return this._boundary.update(this.position.x, this.position.x, this.position.y, this.position.y);
    }


    /**
     * @return {Array<Vector2>}
     */
    get points() {
        return this.boundary.points();
    }

    /**
     * @param {Vector2} impulse
     * @param {Vector2} point
     */
    applyImpulse(impulse, point) {
        this.velocity.add(impulse.scaled(this.invertedMass));
        this.angularVelocity += point.delta(this.position).cross(impulse) * this.invertedInertia;
    }

    /**
     * @param {Vector2} impulse
     * @param {Vector2} point
     */
    applyPseudoImpulse(impulse, point) {
        if (!this.active) return;

        this.position.add(impulse);
        this.angle += point.delta(this.position).cross(impulse) * this.invertedInertia;
    }

    /**
     * @param {Vector2} velocity
     * @param {number} rotation
     */
    applyVelocity(velocity, rotation) {
        if (!this.active) return;

        this.position.add(velocity);
        this.angle += rotation;

        if (Math.abs(this.angle) >= 2 * Math.PI) {
            const scale = Math.floor(this.angle / (2 * Math.PI));
            this.angle = this.angle - 2 * Math.PI * scale;
        }
    }
}