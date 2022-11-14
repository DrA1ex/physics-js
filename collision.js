import {Vector2} from "./vector.js";
import * as Utils from "./utils.js";
import {Body, BoundaryBox, CirceBody, RectBody} from "./body.js";

export class Collision {
    result = false;
    distance = 0;

    /**@type{Vector2}*/
    delta = null;
    /**@type{Vector2}*/
    aContact = null;
    bContact = null;
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
        } else if (body1 instanceof RectBody) {
            this.collision = RectCollider.detectCollision(body1, body2);
        } else if (body2 instanceof RectBody) {
            this.collision = RectCollider.detectCollision(body2, body1);
            this.collision.penetration?.negate();
        } else {
            this.collision = Collider.detectBoundaryCollision(body1.boundary, body2.boundary);
        }

        return this.collision.result;
    }

    static detectBoundaryCollision(box1, box2) {
        const result = Utils.isRangeIntersects(box1.left, box1.right, box2.left, box2.right) &&
            Utils.isRangeIntersects(box1.top, box1.bottom, box2.top, box2.bottom);

        if (result) {
            const collision = new Collision(true);

            const delta = box1.center.delta(box2.center);
            const tangent = delta.normalized();
            const contact1 = Utils.getBoxPoint(tangent, box2).add(box2.center);
            const contact2 = Utils.getBoxPoint(tangent.negated(), box1).add(box1.center);

            collision.delta = delta;
            collision.distance = delta.length();
            collision.tangent = Utils.getSideNormal(contact1, box2);

            collision.aContact = contact1;
            collision.bContact = contact2;
            collision.penetration = contact1.delta(contact2);

            return collision;
        }

        return new Collision(false);
    }
}

export class RectCollider extends Collider {
    constructor(body) {
        super(body);
    }

    /**
     * @param {RectBody} body1
     * @param {Body|RectBody} body2
     * @return {Collision}
     */
    static detectCollision(body1, body2) {
        const boundaryCollision = Collider.detectBoundaryCollision(body1.boundary, body2.boundary);
        if (!boundaryCollision.result) {
            return new Collision(false);
        }

        const angle1 = body1.angle;
        const box1 = body1.box;

        let angle2, box2;
        if (body2 instanceof RectBody) {
            angle2 = body2.angle;
            box2 = body2.box;
        } else {
            angle2 = 0;
            box2 = body2.boundary;
        }

        const rotatedBox2 = box2.rotatedOrigin(-angle1, box1.center);
        const rotatedBox2Angle = angle2 - angle1;

        const collision = this.#detectBoxCollision(box1, rotatedBox2, rotatedBox2Angle);
        if (collision.result && angle1 !== 0) {
            collision.delta = collision.delta.rotated(angle1);
            collision.distance = collision.delta.length();
            collision.tangent = collision.tangent.rotated(angle1);

            collision.aContact = collision.aContact.rotated(angle1, box1.center);
            collision.bContact = collision.bContact.rotated(angle1, box1.center);
            collision.penetration = collision.penetration.rotated(angle1);
        }

        return collision;
    }

    static #detectBoxCollision(box1, box2, angle2) {
        const centerDelta = box1.center.delta(box2.center);
        const centerTangent = centerDelta.normalized();

        const contactB1 = Utils.getBoxPoint(centerTangent.negated(), box1).add(box1.center);
        const contactB2 = Utils.getBoxPoint(centerTangent.rotated(-angle2), box2).rotated(angle2).add(box2.center);

        const contactB2Side = Utils.getSideNormal(contactB2.rotated(-angle2, box2.center), box2);
        const nearestB1 = Utils.getNearestVertex(contactB1, box1);
        const nearestB2 = Utils.getNearestBoxVertex(contactB2Side, box2, nearestB1.rotated(-angle2, box2.center)).rotated(angle2, box2.center);

        const collisionPointB1 = Utils.getAltitude(nearestB2, nearestB1, box1, Utils.getSideNormal(contactB1, box1));
        const collisionPointB2 = Utils.findIntersections(
            contactB2, nearestB2,
            collisionPointB1, collisionPointB1.copy().add(centerDelta)
        ) ?? contactB2;

        if (!Utils.isInsideBox(collisionPointB2, box1)) {
            return new Collision(false);
        }

        const collision = new Collision(true);
        const collisionDelta = collisionPointB2.delta(collisionPointB1);

        collision.delta = centerDelta;
        collision.distance = centerDelta.length();
        collision.tangent = collisionDelta.normalized();
        collision.aContact = collisionPointB2;
        collision.bContact = collisionPointB1;
        collision.penetration = collisionDelta;

        return collision;
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
        const boundaryCollision = Collider.detectBoundaryCollision(body1.boundary, body2.boundary);

        if (boundaryCollision.result) {
            if (body2 instanceof CirceBody) {
                return this.#circleCollision(boundaryCollision, body1, body2);
            } else if (body2 instanceof RectBody) {
                return this.#rectCollision(boundaryCollision, body1, body2, body2.box);
            }

            return this.#rectCollision(boundaryCollision, body1, body2, body2.boundary);
        }

        return boundaryCollision;
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
            collision.aContact = collision.tangent.scaled(body2.radius).add(body2.position);
            collision.bContact = collision.tangent.negated().scale(body1.radius).add(body1.position);
            collision.penetration = collision.tangent.scaled(centerDistance).sub(delta);

            return collision;
        }

        return new Collision(false);
    }

    /**
     * @param {Collision} boundaryCollision
     * @param {CirceBody} body1
     * @param {Body} body2
     * @param {BoundaryBox} box2
     */
    static #rectCollision(boundaryCollision, body1, body2, box2) {
        const angle2 = body2.angle;

        const delta = boundaryCollision.delta;
        const rotatedDelta = delta.rotated(-angle2);
        const box2Contact = Utils.getAltitude(rotatedDelta, Utils.getBoxPoint(rotatedDelta, box2), box2, null, true);

        const centerDistance = body1.radius + box2Contact.length();
        const distance = boundaryCollision.distance;
        const result = distance <= centerDistance;

        if (result) {
            const aContact = box2Contact.rotated(angle2).add(box2.center);
            const tangent = body1.position.tangent(aContact);

            const collision = new Collision(true);
            collision.delta = delta;
            collision.distance = distance;
            collision.tangent = tangent;
            collision.aContact = aContact;
            collision.bContact = tangent.negated().scale(body1.radius).add(body1.position);
            collision.penetration = collision.aContact.delta(collision.bContact);

            return collision;
        }

        return new Collision(false);
    }
}