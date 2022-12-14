import {Collision} from "../physics/common/collision.js";
import {Vector2} from "./vector.js";

/**
 * @param {Body} body1
 * @param {Body} body2
 * @param {Vector2} normal
 * @return {Vector2}
 */
export function alignNormal(body1, body2, normal) {
    const delta = body1.position.delta(body2.position);
    const projectedNormal = delta.dot(normal);
    return projectedNormal > 0 ? normal.negated() : normal;
}

/**
 * @param {Vector2} collisionA
 * @param {Vector2} collisionB
 * @param {number} overlap
 * @return {Collision}
 */
export function createCollision(collisionA, collisionB, overlap) {
    const collision = new Collision(true);
    collision.aContact = collisionA;
    collision.bContact = collisionB;
    collision.tangent = collision.aContact.tangent(collision.bContact);
    collision.overlap = overlap;

    return collision;
}

/**
 * @param {Vector2[]} points
 * @param {Vector2} normal
 * @param {number} [eps=1e-7]
 * @return {Vector2|null}
 */
export function getCollisionPoint(points, normal, eps = 1e-7) {
    let candidates, maxProj = Number.NEGATIVE_INFINITY;
    for (const point of points) {
        const proj = point.dot(normal);
        if (proj > maxProj) {
            maxProj = proj;
            candidates = [point]
        } else if (Math.abs(proj - maxProj) < eps) {
            // noinspection JSUnusedAssignment
            candidates.push(point);
        }
    }

    if (candidates.length > 0) {
        return candidates.length === 2 ? candidates[1].delta(candidates[0]).scale(0.5).add(candidates[0]) : candidates[0];
    }

    return null;
}