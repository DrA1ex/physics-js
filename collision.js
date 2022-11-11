import {Vector2} from "./vector.js";
import {CirceBody} from "./body.js";

function clamp(min, max, value) {
    return Math.min(max, Math.max(min, value));
}

export class Collision {
    result = false;
    distance = 0;

    /**@type{Vector2}*/
    delta = null;
    /**@type{Vector2}*/
    contact = null;
    /**@type{Vector2}*/
    tangent = null;
    /**@type{Vector2}*/
    penetration = null;

    constructor(result = false) {
        this.result = result;
    }
}

export class Collider {
    /**@type {BodyType} */
    body = null;
    /**@type {Collision} */
    collision = null;

    constructor(body) {
        this.body = body;
    }

    /**
     * @param {Body} body2
     * @return {boolean}
     */
    detectCollision(body2) {
        const body1 = this.body
        if (body1 instanceof CirceBody && body2 instanceof CirceBody) {
            this.collision = CircleCollider.detectCollision(body1, body2);
        } else if (body1 instanceof CirceBody) {
            this.collision = CircleCollider.detectCollision(body1, body2);
        } else if (body2 instanceof CirceBody) {
            this.collision = CircleCollider.detectCollision(body2, body1);
            this.collision.penetration?.negate();
        } else {
            this.collision = RectCollider.detectCollision(body1, body2);
        }

        return this.collision.result;
    }

    static _getBoxPoint(tangent, box) {
        const xRad = box.width / 2;
        const yRad = box.height / 2;
        const tan = tangent.y / tangent.x;

        let point;
        const y = xRad * tan;
        if (Math.abs(y) <= yRad) {
            if (tangent.x >= 0) {
                point = new Vector2(xRad, y);
            } else {
                point = new Vector2(-xRad, -y);
            }
        } else {
            const x = yRad / tan;
            if (tangent.y >= 0) {
                point = new Vector2(x, yRad);
            } else {
                point = new Vector2(-x, -yRad);
            }
        }

        return point;
    }
}

export class RectCollider extends Collider {
    constructor(body) {
        super(body);
    }

    /**
     * @param {Body} body1
     * @param {Body} body2
     * @return {Collision}
     */
    static detectCollision(body1, body2) {
        const box1 = body1.boundary;
        const box2 = body2.boundary;

        const result = this.#checkRange(box1.left, box1.right, box2.left, box2.right) &&
            this.#checkRange(box1.top, box1.bottom, box2.top, box2.bottom);

        if (result) {
            const delta = body1.position.delta(body2.position);

            const collision = new Collision(true);
            collision.delta = delta;
            collision.distance = delta.length();

            const contact1 = this._getBoxPoint(delta.normalized(), box2).add(box2.center);
            const contact2 = this._getBoxPoint(delta.normalized().negated(), box1).add(box1.center);
            collision.contact = contact1;
            collision.penetration = contact1.delta(contact2);
            collision.tangent = this.#getSideByPoint(contact1, box2);

            return collision;
        }

        return new Collision(false);
    }

    static #checkRange(start1, end1, start2, end2) {
        return end1 >= start2 && start1 <= end2;
    }

    static #getSideByPoint(point, box) {
        const normalized = point.delta(box.center).div(new Vector2(box.width / 2, box.height / 2));
        if (Math.abs(normalized.x) === 1) {
            return new Vector2(Math.sign(normalized.x), 0);
        } else {
            return new Vector2(0, Math.sign(normalized.y));
        }
    }
}

export class CircleCollider extends Collider {
    constructor(body) {
        super(body);
    }

    /**
     * @param {CirceBody} body1
     * @param {Body} body2
     * @return {Collision}
     */
    static detectCollision(body1, body2) {
        const boxCollision = RectCollider.detectCollision(body1, body2);
        if (boxCollision.result) {
            if (body2 instanceof CirceBody) {
                return this.#circleCollision(boxCollision, body1, body2);
            }

            return this.#rectCollision(boxCollision, body1, body2);
        }

        return boxCollision;
    }

    /**
     * @param {Collision} boxCollision
     * @param {CirceBody} body1
     * @param {CirceBody} body2
     */
    static #circleCollision(boxCollision, body1, body2) {
        const delta = boxCollision.delta;
        const distance = boxCollision.distance;
        const centerDistance = body1.radius + body2.radius;
        const result = distance <= centerDistance;

        if (result) {
            const collision = new Collision(true);
            collision.delta = delta;
            collision.distance = distance;
            collision.tangent = delta.normalized();
            collision.contact = collision.tangent.scaled(body2.radius).add(body2.position);
            collision.penetration = collision.tangent.scaled(centerDistance).sub(delta);

            return collision;
        }

        return new Collision(false);
    }

    /**
     * @param {Collision} boxCollision
     * @param {CirceBody} body1
     * @param {Body} body2
     */
    static #rectCollision(boxCollision, body1, body2) {
        const box2 = body2.boundary;

        const delta = boxCollision.delta;
        const distance = boxCollision.distance;
        const tangent = delta.normalized();
        const box2Contact = this._getBoxPoint(tangent, box2);
        const centerDistance = body1.radius + box2Contact.length();
        const result = distance <= centerDistance;

        if (result) {
            const collision = new Collision(true);
            collision.delta = delta;
            collision.distance = distance;
            collision.tangent = delta.normalized();
            collision.contact = box2Contact.add(body2.position);
            collision.penetration = collision.tangent.scaled(centerDistance).sub(delta);

            return collision;
        }

        return new Collision(false);
    }
}