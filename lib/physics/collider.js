import {Body, CircleBody, LineBody, PolygonBody, RectBody} from "./body.js";
import {Vector2} from "../utils/vector.js";
import * as CollisionUtils from "../utils/collision.js";
import {Collision, NoCollision} from "../utils/collision.js";
import * as GeomUtils from "../utils/geom.js";
import * as SatUtils from "../utils/sat.js";

export class Collider {
    static #collisionDetectTypes = null
    static #collisionDetectTypesInitializer = () => [
        [CircleBody, [Body], CircleCollider.detectCollision.bind(CircleCollider)],
        [LineBody, [Body], LineCollider.detectCollision.bind(LineCollider)],
        [RectBody, [Body], RectCollider.detectCollision.bind(RectCollider)],
        [PolygonBody, [Body], PolygonCollider.detectCollision.bind(PolygonCollider)],

        [Body, [Body], (b1, b2) => Collider.detectBoundaryCollision(b1.boundary, b2.boundary)],
    ];

    /**@type {BodyType} */
    body = null;

    constructor(body) {
        this.body = body;

        if (!Collider.#collisionDetectTypes) {
            Collider.#collisionDetectTypes = Collider.#collisionDetectTypesInitializer();
        }
    }

    /**
     * @param {Body} body2
     * @return {Collision}
     */
    detectCollision(body2) {
        const body1 = this.body
        let collision = NoCollision;

        if (!body1.collider.shouldCollide(body2) || !body2.collider.shouldCollide(body1)) {
            return collision;
        }

        for (const [type1, types2, detectorFn] of Collider.#collisionDetectTypes) {
            const type1Constraint = body1 instanceof type1;
            const type2Constraint = type1Constraint && types2.some(t => body2 instanceof t);

            if (type1Constraint && type2Constraint) {
                collision = detectorFn(body1, body2);
                if (collision.result) {
                    collision.aBody = body2;
                    collision.bBody = body1;
                }
                break;
            }

            const reversedType1Constraint = body2 instanceof type1;
            const reversedType2Constraint = reversedType1Constraint && types2.some(t => body1 instanceof t);
            if (reversedType1Constraint && reversedType2Constraint) {
                collision = detectorFn(body2, body1);
                if (collision.result) {
                    collision.aBody = body1;
                    collision.bBody = body2;
                }
                break;
            }
        }

        return collision;
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

export class PolygonCollider extends Collider {
    /**
     * @param {PolygonBody} body1
     * @param {Body|PolygonBody} body2
     * @return {Collision}
     */
    static detectCollision(body1, body2) {
        if (!GeomUtils.isBoundaryCollide(body1.boundary, body2.boundary)) {
            return NoCollision;
        }

        const polyCollision = SatUtils.detectPolygonCollision(body1, body2);
        if (!polyCollision.result) {
            return NoCollision;
        }

        const collisionInfo = polyCollision.collision;

        let points1, points2;
        if (collisionInfo.body === body1) {
            points1 = collisionInfo.points2;
            points2 = collisionInfo.points1;
        } else {
            points1 = collisionInfo.points1;
            points2 = collisionInfo.points2;
        }

        const normal = collisionInfo.body === body2 ?
            CollisionUtils.alignNormal(body1, body2, collisionInfo.normal) :
            CollisionUtils.alignNormal(body2, body1, collisionInfo.normal);

        let collisionA = CollisionUtils.getCollisionPoint(points1, normal);
        let collisionB = collisionA.delta(normal.scaled(collisionInfo.overlap));

        const pointAContained = GeomUtils.getProjectionIntersectionInfo(normal.perpendicular(), [collisionA], points2);
        if (!pointAContained.result) {
            const centralTangent = body2.position.tangent(body1.position);
            const alternativeCollision = CollisionUtils.getCollisionPoint(points2, centralTangent);
            collisionA = alternativeCollision.delta(normal.scaled(-collisionInfo.overlap));
            collisionB = alternativeCollision;
        }

        if (collisionInfo.body !== body1) {
            [collisionA, collisionB] = [collisionB, collisionA];
        }

        return CollisionUtils.createCollision(collisionA, collisionB, collisionInfo.overlap);
    }
}

export class LineCollider extends PolygonCollider {
    static detectCollision(body1, body2) {
        if (!GeomUtils.isBoundaryCollide(body1.boundary, body2.boundary)) {
            return NoCollision;
        }

        const points1 = body1.points;
        const points2 = body2.points;
        const normalProjection = points1[0].delta(points1[1]).normal();
        const parallelProjection = normalProjection.perpendicular();

        const hasCollision = GeomUtils.getProjectionIntersectionInfo(normalProjection, points1, points2).result
            && GeomUtils.getProjectionIntersectionInfo(parallelProjection, points1, points2).result;

        if (!hasCollision) {
            return NoCollision;
        }

        const normalAlign = CollisionUtils.alignNormal(body2, body1, normalProjection);
        const normalOrigin = CollisionUtils.getCollisionPoint(points2, normalAlign);
        const normalOverlap = normalAlign.dot(normalOrigin.delta(body1.position));

        const parallelAxisAlign = CollisionUtils.alignNormal(body2, body1, parallelProjection);
        const parallelAxisOrigin = CollisionUtils.getCollisionPoint(points2, parallelAxisAlign);
        const parallelAxisClosest = CollisionUtils.getCollisionPoint(points1, parallelAxisAlign.negated());
        const parallelAxisOverlap = parallelAxisAlign.dot(parallelAxisOrigin.delta(parallelAxisClosest));

        let normal, collisionA, overlap;
        if (normalOverlap < parallelAxisOverlap) {
            normal = normalAlign;
            collisionA = normalOrigin;
            overlap = normalOverlap;
        } else {
            normal = parallelAxisAlign;
            collisionA = parallelAxisOrigin;
            overlap = parallelAxisOverlap;
        }

        const collisionB = collisionA.delta(normal.scaled(overlap));
        return CollisionUtils.createCollision(collisionA, collisionB, overlap);
    }
}

export class RectCollider extends PolygonCollider {
    static detectCollision(body1, body2) {
        if (body1 instanceof RectBody && body2 instanceof RectBody && body1.angle === 0 && body2.angle === 0) {
            return Collider.detectBoundaryCollision(body1.boundary, body2.boundary);
        }

        return super.detectCollision(body1, body2);
    }
}

export class CircleCollider extends Collider {
    /**
     * @param {CircleBody} body1
     * @param {Body} body2
     * @return {Collision}
     */
    static detectCollision(body1, body2) {
        const boundary1 = body1.boundary, boundary2 = body2.boundary;
        if (!GeomUtils.isBoundaryCollide(boundary1, boundary2)) {
            return this.detectBoundaryCollision(boundary1, boundary2);
        }

        if (body2 instanceof CircleBody) {
            return this.#circleCollision(body1, body2);
        } else if (body2 instanceof LineBody) {
            return this.#lineCollision(body1, body2);
        }

        return this.#polyCollision(body1, body2);
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