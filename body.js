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

    rotatedPoints(angle) {
        return [
            new Vector2(this.left, this.top),
            new Vector2(this.right, this.top),
            new Vector2(this.right, this.bottom),
            new Vector2(this.left, this.bottom)
        ].map(p => p.rotated(angle, this.center));
    }

    rotated(angle) {
        if (angle === 0) {
            return this;
        }

        const points = this.rotatedPoints(angle);

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
}

/**
 * @template T
 * @extends T
 */
export class Body {
    /** @type {Collider} */
    collider = null;
    active = true;

    _mass = 0;
    inertia = 0;

    position = new Vector2();
    angle = 0;

    velocity = new Vector2();
    angularVelocity = 0;
    restitution = 1;

    constructor(x, y, mass) {
        this.position.x = x;
        this.position.y = y;
        this._mass = mass;
        this.inertia = this.mass / 2;

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

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx) {
        const box = this.boundary;
        ctx.beginPath();
        ctx.rect(-box.width / 2, -box.width / 2, box.width, box.height);
        if (this.active) ctx.fill();
        ctx.stroke();
    }
}

/**
 * @abstract
 */
export class PolygonBody extends Body {
    /**
     * @abstract
     * @return {Array<Vector2>}
     */
    get points() {
        return [this.position];
    }
}

/**
 * @extends Body<RectBody>
 */
export class RectBody extends PolygonBody {
    width = 0;
    height = 0;

    constructor(x, y, width, height, mass) {
        super(x, y, mass);

        this.width = width;
        this.height = height;
        this.inertia = (this.mass / 12) * (this.width + Math.pow(this.height, 2));
    }

    get boundary() {
        return this.box.rotated(this.angle);
    }

    get points() {
        return this.box.rotatedPoints(this.angle);
    }

    get box() {
        return BoundaryBox.fromCenteredDimensions(this.position.x, this.position.y, this.width, this.height);
    }

    render(ctx) {
        ctx.save();

        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle);

        ctx.beginPath();
        ctx.rect(-this.width / 2, -this.width / 2, this.width, this.height);
        if (this.active) ctx.fill();
        ctx.stroke();

        ctx.restore();
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

        this.inertia = this.mass * Math.pow(this.radius, 2) / 2;
    }

    get boundary() {
        return new BoundaryBox(
            this.position.x - this.radius, this.position.x + this.radius,
            this.position.y - +this.radius, this.position.y + this.radius
        );
    }

    render(ctx) {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);

        if (this.active) ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(...Vector2.fromAngle(this.angle).scale(this.radius).add(this.position).elements());
        ctx.stroke();
    }
}
