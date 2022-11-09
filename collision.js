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
     * @abstract
     * @param body
     * @return {boolean}
     */
    detectCollision(body) {
        this.collision = new Collision(false);
        return false;
    }
}

export class RectCollider extends Collider {
    constructor(body) {
        super(body);
    }

    detectCollision(body) {
        const box1 = this.body.boundary;
        const box2 = body.boundary;

        const xResult = this.#checkRange(box1.left, box1.right, box2.left, box2.right)
        const yResult = this.#checkRange(box1.top, box1.bottom, box2.top, box2.bottom);
        const result = xResult && yResult;

        if (result) {
            const delta = this.body.position.copy().sub(body.position);
            const angle = Math.atan2(delta.y, delta.x);

            this.collision = new Collision(true);
            this.collision.delta = delta;
            this.collision.tangent = new Vector2(Math.cos(angle), Math.sin(angle));
            this.collision.distance = Math.sqrt(delta.dot(delta));

            const contact1 = RectCollider.#getContactPoint(this.collision.tangent, box1, box2);
            const contact2 = RectCollider.#getContactPoint(this.collision.tangent.copy().scale(-1), box2, box1);
            this.collision.contact = contact1;
            this.collision.penetration = contact1.copy().sub(contact2);
        } else {
            this.collision = new Collision(false);
        }
        return result;
    }

    #checkRange(start1, end1, start2, end2) {
        return end1 >= start2 && start1 <= end2;
    }

    static #getContactPoint(tangent, box1, box2) {
        const contact = tangent.copy().scale(Math.max(box2.width, box2.height) * 10);
        contact.x = clamp(-box2.width, box2.width, contact.x)
        contact.y = clamp(-box2.height, box2.height, contact.y);
        contact.scale(0.5);
        return contact.add(box2.center);
    }
}

export class CircleCollider extends RectCollider {
    constructor(body) {
        super(body);
    }

    detectCollision(body) {
        if (!(body instanceof CirceBody)) {
            return body.detectCollision(this);
        }

        if (super.detectCollision(body)) {
            const boxCollision = this.collision;

            const delta = boxCollision.delta;
            const centerDistance = this.body.radius + body.radius;
            const distance = Math.sqrt(delta.dot(delta));
            const result = distance <= centerDistance;

            if (result) {
                this.collision = new Collision(true);
                this.collision.delta = delta;
                this.collision.distance = distance;
                this.collision.tangent = boxCollision.tangent;
                this.collision.contact = this.collision.tangent.copy().scale(body.radius).add(body.position);
                this.collision.penetration = this.collision.tangent.copy().scale(centerDistance).sub(delta);
            } else {
                this.collision = new Collision(false);
            }
        }

        return this.collision.result;
    }
}