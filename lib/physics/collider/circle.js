import * as CollisionUtils from "../../utils/collision.js";
import * as GeomUtils from "../../utils/geom.js";
import * as SatUtils from "../../utils/sat.js";
import {Collision, NoCollision} from "../common/collision.js";
import {Collider, ColliderType, ColliderTypeOrder} from "./base.js";

export class CircleCollider extends Collider {
    get order() {return ColliderTypeOrder.circle;}
    get type() {return ColliderType.circle;}

    /**
     * @param {Body} body2
     * @return {Collision}
     */
    detectCollision(body2) {
        const body1 = this.body;

        const boundary1 = body1.boundary, boundary2 = body2.boundary;
        if (!GeomUtils.isBoundaryCollide(boundary1, boundary2)) {
            return Collider.detectBoundaryCollision(boundary1, boundary2);
        }

        const colliderType = body2.collider.type;
        if (colliderType === ColliderType.circle) {
            return CircleCollider.#circleCollision(body1, body2);
        } else if (colliderType === ColliderType.line) {
            return CircleCollider.#lineCollision(body1, body2);
        }

        return CircleCollider.#polyCollision(body1, body2);
    }

    /**
     * @param {CircleBody} body1
     * @param {CircleBody} body2
     * @return {Collision}
     */
    static #circleCollision(body1, body2) {
        const delta = body1.position.delta(body2.position);
        const distance = delta.length();

        const centerDistance = body1.radius + body2.radius;
        const overlap = centerDistance - distance;

        if (overlap >= 0) {
            const collision = new Collision(true);
            collision.tangent = delta.normalized();
            collision.aContact = collision.tangent.scaled(body2.radius).add(body2.position);
            collision.bContact = collision.tangent.negated().scale(body1.radius).add(body1.position);
            collision.overlap = overlap;

            return collision;
        }

        return NoCollision;
    }

    /**
     * @param {CircleBody} body1
     * @param {PolygonBody|Body} body2
     */
    static #polyCollision(body1, body2) {
        const points2 = body2.points;
        const collisionInfo = SatUtils.detectPolygonWithCircleCollision(body1.position, body1.radius, points2);
        if (!collisionInfo.result) {
            return NoCollision;
        }

        const normal = CollisionUtils.alignNormal(body1, body2, collisionInfo.normal);
        const collisionB = normal.scaled(body1.radius).add(body1.position);
        const collisionA = collisionB.delta(normal.scaled(collisionInfo.overlap));

        return CollisionUtils.createCollision(collisionA, collisionB, collisionInfo.overlap);
    }

    /**
     * @param {CircleBody} body1
     * @param {PolygonBody} body2
     */
    static #lineCollision(body1, body2) {
        const points2 = body2.points;
        const collisionInfo = SatUtils.detectLineWithCircleCollision(body1.position, body1.radius, points2);
        if (!collisionInfo.result) {
            return NoCollision;
        }

        const normalAxisCheck = collisionInfo.checks["normal"];
        const normalAlign = CollisionUtils.alignNormal(body1, body2, normalAxisCheck.normal);
        const normalOrigin = normalAlign.scaled(body1.radius).add(body1.position);
        const normalOverlap = normalAlign.dot(normalOrigin.delta(body2.position));

        const parallelAxisCheck = collisionInfo.checks["parallel"];

        let normal, collisionB, overlap;
        if (normalOverlap < parallelAxisCheck.overlap) {
            normal = normalAlign;
            collisionB = normalOrigin;
            overlap = normalOverlap;
        } else {
            normal = parallelAxisCheck.normal;
            collisionB = parallelAxisCheck.origin;
            overlap = parallelAxisCheck.overlap;
        }

        const collisionA = collisionB.delta(normal.scaled(overlap));

        return CollisionUtils.createCollision(collisionA, collisionB, overlap);
    }
}