import {Vector2} from "../utils/vector.js";
import {CircleCollider, Collider, PolygonCollider, RectCollider} from "./collider.js";
import * as Utils from "../utils/geom.js";

/** @typedef {Body|CircleBody} BodyType */

export class BoundaryBox {
    #points = null;

    width;
    height;
    center = new Vector2()

    left = 0;
    right = 0;
    top = 0;
    bottom = 0;

    /**
     * @param {number} left
     * @param {number} right
     * @param {number} top
     * @param {number} bottom
     */
    constructor(left, right, top, bottom) {
        this.update(left, right, top, bottom);
    }

    points() {
        if (this.#points === null) {
            this.#points = new Array(4);
        }

        this.#points[0] = new Vector2(this.left, this.top);
        this.#points[1] = new Vector2(this.right, this.top);
        this.#points[2] = new Vector2(this.right, this.bottom);
        this.#points[3] = new Vector2(this.left, this.bottom);

        return this.#points;
    }

    /**
     * @param {number} left
     * @param {number} right
     * @param {number} top
     * @param {number} bottom
     * @return {BoundaryBox}
     */
    update(left, right, top, bottom) {
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;

        this.width = this.right - this.left;
        this.height = this.bottom - this.top;

        this.center.x = this.left + this.width / 2
        this.center.y = this.top + this.height / 2;

        return this;
    }

    /**
     * @param {Vector2[]} points
     * @return {BoundaryBox}
     */
    updateFromPoints(points) {
        let left = points[0].x, right = points[0].x, top = points[0].y, bottom = points[0].y;
        for (let i = 1; i < points.length; i++) {
            const point = points[i];

            if (left > point.x) left = point.x;
            if (right < point.x) right = point.x;
            if (top > point.y) top = point.y;
            if (bottom < point.y) bottom = point.y;
        }

        return this.update(left, right, top, bottom);
    }

    static empty() {
        return new BoundaryBox(0, 0, 0, 0);
    }

    static fromDimensions(x, y, width = 1, height = 1) {
        return new BoundaryBox(x, x + width, y, y + height);
    }

    static fromPoints(points) {
        return BoundaryBox.empty().updateFromPoints(points);
    }
}

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

/**
 * @template {Body<PolygonBody>} T
 * @extends T
 */
export class PolygonBody extends Body {
    /** @type{Vector2[]} */
    _transformedPoints = null;
    /** @type{Vector2[]} */
    _localPoints = null;
    /** @type{Vector2[]} */
    _globalPoints = null;

    _scale = new Vector2(1, 1);
    _skew = new Vector2(0, 0);

    get skew() {return this._skew;}
    get scale() {return this._scale;}

    /**
     * @param {number} x
     * @param {number} y
     * @param {Vector2[]} points
     * @param {number} [mass=1]
     */
    constructor(x, y, points, mass = 1) {
        super(x, y, mass);
        this._localPoints = points;

        this._transformedPoints = Vector2.array(this._localPoints.length);
        this._globalPoints = Vector2.array(this._localPoints.length);

        this._updateTransformedPoints();

        this.collider = new PolygonCollider(this);
    }

    _calcInertia(mass) {
        const boundary = this.boundary;
        return (mass / 12) * (Math.pow(boundary.width, 2) + Math.pow(boundary.height, 2))
    }

    get points() {
        this.#updateGlobalPoints();
        return this._globalPoints;
    }

    get boundary() {
        return this._boundary.updateFromPoints(this.points);
    }

    /**
     * @param {Vector2} scale
     * @return {T}
     */
    setScale(scale) {
        this._scale = scale;
        this._updateTransformedPoints();
        return this;
    }

    /**
     * @param {Vector2} skew
     * @return {T}
     */
    setSkew(skew) {
        this._skew = skew;
        this._updateTransformedPoints();
        return this;
    }

    _updateTransformedPoints() {
        if (this.scale.x !== 1 || this.scale.y !== 1 || this.skew.x !== 0 || this.skew.y !== 0) {
            for (let i = 0; i < this._localPoints.length; i++) {
                Utils.transform(this._localPoints[i], this.scale, this.skew, this._transformedPoints[i]);
            }
        } else {
            for (let i = 0; i < this._localPoints.length; i++) {
                this._transformedPoints[i].set(this._localPoints[i]);
            }
        }
    }

    #updateGlobalPoints() {
        if (this.angle === 0) {
            for (let i = 0; i < this._transformedPoints.length; i++) {
                this._globalPoints[i].set(this._transformedPoints[i])
                    .add(this.position);
            }
        } else {
            for (let i = 0; i < this._transformedPoints.length; i++) {
                this._globalPoints[i].set(this._transformedPoints[i])
                    .rotate(this.angle)
                    .add(this.position);
            }
        }
    }
}

/**
 * @extends Body<LineBody>
 */
export class LineBody extends PolygonBody {

    /**
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} [mass=1]
     */
    constructor(x1, y1, x2, y2, mass = 1) {
        const {localPoints, position} = LineBody.#calculateNewPosition(x1, y1, x2, y2);
        super(position.x, position.y, localPoints, mass);
    }

    updatePoints(delta1, delta2) {
        const {localPoints, position} = LineBody.#calculateNewPosition(
            this._localPoints[0].x + delta1.x, this._localPoints[0].y + delta1.y,
            this._localPoints[1].x + delta2.x, this._localPoints[1].y + delta2.y,
        );

        for (let i = 0; i < this._localPoints.length; i++) {
            this._localPoints[i].set(localPoints[i]);
        }

        this.position.add(position);
        this._updateTransformedPoints();
    }

    static #calculateNewPosition(x1, y1, x2, y2) {
        const center = new Vector2((x2 - x1) / 2, (y2 - y1) / 2);
        const points = [new Vector2(-center.x, -center.y), new Vector2(center.x, center.y)];

        return {
            position: new Vector2(x1 + center.x, y1 + center.y),
            localPoints: points
        };
    }
}

/**
 * @extends Body<RectBody>
 */
export class RectBody extends PolygonBody {
    width = 0;
    height = 0;

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} [mass=1]
     */
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

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} radius
     * @param {number} [mass=1]
     */
    constructor(x, y, radius, mass = 1) {
        super(x, y, mass);

        this.radius = radius;

        this.collider = new CircleCollider(this);
    }

    _calcInertia(mass) {
        return this.mass * Math.pow(this.radius, 2) / 2;
    }

    get boundary() {
        return this._boundary.update(
            this.position.x - this.radius, this.position.x + this.radius,
            this.position.y - this.radius, this.position.y + this.radius
        );
    }
}
