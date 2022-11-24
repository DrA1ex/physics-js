import {Vector2} from "../utils/vector.js";
import {CircleCollider, PolygonCollider, RectCollider} from "./collision.js";
import * as Utils from "../utils/geom.js";

/** @typedef {Body|CircleBody} BodyType */

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

    points() {
        return [
            new Vector2(this.left, this.top),
            new Vector2(this.right, this.top),
            new Vector2(this.right, this.bottom),
            new Vector2(this.left, this.bottom)
        ]
    }

    rotatedPoints(angle) {
        return this.points().map(p => p.rotated(angle, this.center));
    }

    rotated(angle) {
        if (angle === 0) {
            return this;
        }

        return BoundaryBox.fromPoints(this.rotatedPoints(angle));
    }

    rotatedOrigin(angle, origin) {
        if (angle === 0) {
            return this;
        }

        const newCenter = this.center.rotated(angle, origin);
        return BoundaryBox.fromCenteredDimensions(newCenter.x, newCenter.y, this.width, this.height);
    }

    static fromDimensions(x, y, width = 1, height = 1) {
        return new BoundaryBox(x, x + width, y, y + height);
    }

    static fromCenteredDimensions(x, y, width, height) {
        return BoundaryBox.fromDimensions(x - width / 2, y - height / 2, width, height);
    }

    static fromPoints(points) {
        let left = points[0].x, right = points[0].x, top = points[0].y, bottom = points[0].y;
        for (let i = 1; i < points.length; i++) {
            const point = points[i];

            if (left > point.x) left = point.x;
            if (right < point.x) right = point.x;
            if (top > point.y) top = point.y;
            if (bottom < point.y) bottom = point.y;
        }

        return new BoundaryBox(left, right, top, bottom);
    }
}

/**
 * @template T
 * @extends T
 */
export class Body {
    /** @type {Collider} */
    collider;
    _active = true;

    _mass = 0;
    _inertia = 0;

    position = new Vector2();
    angle = 0;

    velocity = new Vector2();
    angularVelocity = 0;
    restitution = 0.5;
    friction = 0.2;

    constructor(x, y, mass = 1) {
        this.position.x = x;
        this.position.y = y;
        this.mass = mass;

        this.collider = new RectCollider(this);
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
        if (!Number.isFinite(value) || value <= 0)
            return this;

        this._mass = value;
        this._invertedMass = Number.NaN;
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
        this.position = vector;
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

    get active() {return this._active;}

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
            this._inertia = this._calcInertia(this.mass);
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
        return new BoundaryBox(this.position.x, this.position.x, this.position.y, this.position.y);
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

/**
 * @template {Body<PolygonBody>} T
 * @extends T
 */
export class PolygonBody extends Body {
    /** @type{Vector2[]} */
    _transformedPoints = null;

    _scale = new Vector2(1, 1);
    _skew = new Vector2(0, 0);

    get skew() {return this._skew;}
    get scale() {return this._scale;}

    constructor(x, y, points, mass = 1) {
        super(x, y, mass);
        this._points = points;

        this.collider = new PolygonCollider(this);
    }

    _calcInertia(mass) {
        const boundary = this.boundary;
        return (mass / 12) * (Math.pow(boundary.width, 2) + Math.pow(boundary.height, 2))
    }

    get points() {
        if (!this._transformedPoints) {
            this._transformedPoints = this._points.map(p => Utils.transform(p, this.scale, this.skew));
        }

        if (this.angle === 0) {
            return this._transformedPoints.map(p => p.copy().add(this.position));
        }

        return this._transformedPoints.map(p => p.rotated(this.angle).add(this.position));
    }

    get boundary() {
        return BoundaryBox.fromPoints(this.points);
    }

    /**
     * @param {Vector2} scale
     * @return {T}
     */
    setScale(scale) {
        this._scale = scale;
        this._transformedPoints = null;
        return this;
    }

    /**
     * @param {Vector2} skew
     * @return {T}
     */
    setSkew(skew) {
        this._skew = skew;
        this._transformedPoints = null;
        return this;
    }
}

/**
 * @extends Body<LineBody>
 */
export class LineBody extends PolygonBody {
    constructor(x1, y1, x2, y2, mass = 1) {
        const center = new Vector2((x2 - x1) / 2, (y2 - y1) / 2);
        const points = [new Vector2(-center.x, -center.y), new Vector2(center.x, center.y)];

        super(x1 + center.x, y1 + center.y, points, mass);
    }
}

/**
 * @extends Body<RectBody>
 */
export class RectBody extends PolygonBody {
    width = 0;
    height = 0;

    constructor(x, y, width, height, mass = 1) {
        const points = [
            new Vector2(-width / 2, -height / 2),
            new Vector2(width / 2, -height / 2),
            new Vector2(width / 2, height / 2),
            new Vector2(-width / 2, height / 2),
        ];

        super(x, y, points, mass);

        this.width = width;
        this.height = height;
    }

    _calcInertia(mass) {
        return (mass / 12) * (Math.pow(this.width, 2) + Math.pow(this.height, 2));
    }
}

/**
 * @extends Body<CircleBody>
 */
export class CircleBody extends Body {
    radius = 0;

    constructor(x, y, radius, mass = 1) {
        super(x, y, mass);

        this.radius = radius;

        this.collider = new CircleCollider(this);
    }

    _calcInertia(mass) {
        return this.mass * Math.pow(this.radius, 2) / 2;
    }

    get boundary() {
        return new BoundaryBox(
            this.position.x - this.radius, this.position.x + this.radius,
            this.position.y - +this.radius, this.position.y + this.radius
        );
    }
}
