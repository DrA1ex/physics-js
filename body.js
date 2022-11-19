import {Vector2} from "./vector.js";
import {CircleCollider, PolygonCollider, RectCollider} from "./collision.js";
import {BodyRenderer, CircleBodyRenderer, PolygonBodyRenderer, RectBodyRenderer} from "./render.js";

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

    static fromDimensions(x, y, width, height) {
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
    /*** @type {BodyRenderer} */
    renderer
    active = true;

    _mass = 0;
    inertia = 0;

    position = new Vector2();
    angle = 0;

    velocity = new Vector2();
    angularVelocity = 0;
    restitution = 1;

    constructor(x, y, mass = 1) {
        this.position.x = x;
        this.position.y = y;
        this._mass = mass;
        this.inertia = this.mass / 2;

        this.collider = new RectCollider(this);
        this.renderer = new BodyRenderer(this);
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
    setMass(value) {
        this.mass = value;
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
        this.angle = value;
        return this;
    }

    /** @return {T} */
    setAngularVelocity(value) {
        this.angularVelocity = value;
        return this;
    }

    get mass() {
        return this.active ? this._mass : 10e9;
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
     * @param {Vector2} point
     */
    applyImpulse(impulse, point) {
        const scaledImpulse = impulse.scaled(1 / this.mass);
        this.velocity.add(scaledImpulse);
        this.angularVelocity += point.delta(this.position).cross(impulse) / this.inertia;
    }

    /**
     * @param {Vector2} velocity
     * @param {number} rotation
     */
    applyVelocity(velocity, rotation) {
        this.position.add(velocity);
        this.angle += rotation;

        if (Math.abs(this.angle) >= 2 * Math.PI) {
            const scale = Math.floor(this.angle / (2 * Math.PI));
            this.angle = this.angle - 2 * Math.PI * scale;
        }
    }
}

export class PolygonBody extends Body {
    constructor(x, y, points, mass = 1) {
        super(x, y, mass);
        this._points = points;

        const boundary = this.boundary;
        this.inertia = (this.mass / 12) * (boundary.width + Math.pow(boundary.height, 2));

        this.collider = new PolygonCollider(this);
        this.renderer = new PolygonBodyRenderer(this);
    }

    /**
     * @return {Array<Vector2>}
     */
    get points() {
        if (this.angle === 0) {
            return this._points.map(p => p.copy().add(this.position));
        }

        return this._points.map(p => p.rotated(this.angle).add(this.position));
    }

    get boundary() {
        return BoundaryBox.fromPoints(this.points);
    }
}

/**
 * @extends Body<LineBody>
 */
export class LineBody extends PolygonBody {
    constructor(x1, y1, x2, y2, mass = 1) {
        const center = new Vector2((x2 - x1) / 2, (y2 - y1) / 2);
        const points = [new Vector2(x1 - center.x, y1 - center.y), new Vector2(x1 + center.x, y1 + center.y)];

        super(center.x, center.y, points, mass);
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
        this.inertia = (this.mass / 12) * (this.width + Math.pow(this.height, 2));

        this.renderer = new RectBodyRenderer(this);
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
        this.inertia = this.mass * Math.pow(this.radius, 2) / 2;

        this.collider = new CircleCollider(this);
        this.renderer = new CircleBodyRenderer(this);
    }

    get boundary() {
        return new BoundaryBox(
            this.position.x - this.radius, this.position.x + this.radius,
            this.position.y - +this.radius, this.position.y + this.radius
        );
    }
}
