import {Vector2} from "../../utils/vector.js";
import * as GeomUtils from "../../utils/geom.js";
import {Collision, NoCollision} from "../common/collision.js";

/** @enum {number} */
export const ColliderType = {
    boundary: 0,
    poly: 1,
    rect: 2,
    line: 3,
    circle: 4,
    custom: 5,
}

/** @enum {number} */
export const ColliderTypeOrder = {
    custom: 1000,
    circle: 2000,
    line: 4000,
    rect: 3000,
    poly: 5000,
    boundary: 6000,
}


/**
 * @abstract
 */
export class Collider {
    /**@type {Body} */
    body = null;

    constructor(body) {
        this.body = body;
    }

    /**
     * @abstract
     * @return {number}
     */
    get order() {return ColliderTypeOrder.boundary;}

    /**
     * @abstract
     * @return {ColliderType}
     */
    get type() {return ColliderType.boundary;}

    detectCollision(body2) {
        return Collider.detectBoundaryCollision(this.body.boundary, body2.boundary);
    }

    /**
     * @param {Collision} collision
     * @param {Body} body2
     */
    onCollide(collision, body2) {}

    /**
     * @param {Body} body2
     * @return {boolean}
     */
    shouldCollide(body2) {return true;}

    /**
     * @param {Body} body1
     * @param {Body} body2
     * @return {Collision}
     */
    static detectCollision(body1, body2) {
        let collision = NoCollision;

        if (!body1.collider.shouldCollide(body2) || !body2.collider.shouldCollide(body1)) {
            return collision;
        }

        if (body1.collider.order <= body2.collider.order) {
            collision = body1.collider.detectCollision(body2);
            if (collision.result) {
                collision.aBody = body2;
                collision.bBody = body1;
            }
        } else {
            collision = body2.collider.detectCollision(body1);
            if (collision.result) {
                collision.aBody = body1;
                collision.bBody = body2;
            }
        }

        return collision;
    }

    static detectBoundaryCollision(box1, box2) {
        if (!GeomUtils.isBoundaryCollide(box1, box2)) {
            return NoCollision;
        }

        const xIntersection = GeomUtils.rangeIntersection(box1.left, box1.right, box2.left, box2.right);
        const yIntersection = GeomUtils.rangeIntersection(box1.top, box1.bottom, box2.top, box2.bottom);
        const overlap = Math.min(xIntersection, yIntersection);

        let normal;
        let aContact = new Vector2();
        if (xIntersection < yIntersection) {
            const box1Lefter = box1.center.x < box2.center.x;
            normal = box1Lefter ? new Vector2(-1, 0) : new Vector2(1, 0);
            aContact.x = box1Lefter ? box2.left : box2.right;
            aContact.y = Math.max(box1.top, box2.top) + yIntersection / 2
        } else {
            const box2Higher = box1.center.y < box2.center.y;
            normal = box2Higher ? new Vector2(0, -1) : new Vector2(0, 1);
            aContact.x = Math.max(box1.left, box2.left) + xIntersection / 2
            aContact.y = box2Higher ? box2.top : box2.bottom;
        }

        const collision = new Collision(true);
        collision.tangent = normal;
        collision.aContact = aContact;
        collision.bContact = normal.scaled(-overlap).add(aContact);
        collision.overlap = overlap;

        return collision;
    }
}