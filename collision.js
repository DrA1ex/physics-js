import {Vector2} from "./vector.js";
import * as Utils from "./utils.js";
import {Body, BoundaryBox, CircleBody, LineBody, PolygonBody, RectBody} from "./body.js";

export class Collision {
    result = false;

    /**@type{Vector2}*/
    tangent = null;
    /**@type{Vector2}*/
    aContact = null;
    bContact = null;

    overlap = 0;

    constructor(result = false) {
        this.result = result;
    }
}

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
    /**@type {Collision} */
    collision = null;

    constructor(body) {
        this.body = body;

        if (!Collider.#collisionDetectTypes) {
            Collider.#collisionDetectTypes = Collider.#collisionDetectTypesInitializer();
        }
    }

    /**
     * @param {Body} body2
     * @return {boolean}
     */
    detectCollision(body2) {
        const body1 = this.body

        for (const [type1, types2, detectorFn] of Collider.#collisionDetectTypes) {
            const type1Constraint = body1 instanceof type1;
            const type2Constraint = type1Constraint && types2.some(t => body2 instanceof t);

            if (type1Constraint && type2Constraint) {
                this.collision = detectorFn(body1, body2);
                break;
            }

            const reversedType1Constraint = body2 instanceof type1;
            const reversedType2Constraint = reversedType1Constraint && types2.some(t => body1 instanceof t);
            if (reversedType1Constraint && reversedType2Constraint) {
                this.collision = Collider.#flipAfterDetect(body1, body2, detectorFn);
                break;
            }
        }

        return this.collision.result;
    }

    static #flipAfterDetect(body1, body2, detectionFn) {
        const collision = detectionFn(body2, body1);
        if (collision.result) {
            [collision.aContact, collision.bContact] = [collision.bContact, collision.aContact];
            collision.overlap = -collision.overlap;
        }

        return collision;
    }

    static isBoundaryCollide(box1, box2) {
        return Utils.isRangeIntersects(box1.left, box1.right, box2.left, box2.right) &&
            Utils.isRangeIntersects(box1.top, box1.bottom, box2.top, box2.bottom);
    }

    static detectBoundaryCollision(box1, box2) {
        if (!this.isBoundaryCollide(box1, box2)) {
            return new Collision(false);
        }

        const xIntersection = Utils.rangeIntersection(box1.left, box1.right, box2.left, box2.right);
        const yIntersection = Utils.rangeIntersection(box1.top, box1.bottom, box2.top, box2.bottom);
        const overlap = Math.min(xIntersection, yIntersection);

        let normal;
        let aContact = new Vector2();
        if (xIntersection < yIntersection) {
            const box1Lefter = box1.center.x < box2.center.x;
            normal = box1Lefter ? new Vector2(-1, 0) : new Vector2(1, 0);
            aContact.x = box1Lefter ? box2.left : box2.right;
            aContact.y = box2.top + yIntersection / 2
        } else {
            const box1Higher = box1.center.y < box2.center.y;
            normal = box1Higher ? new Vector2(0, -1) : new Vector2(0, 1);
            aContact.x = box2.left + xIntersection / 2
            aContact.y = box1Higher ? box2.top : box2.bottom;
        }

        const collision = new Collision(true);
        collision.tangent = normal;
        collision.aContact = aContact;
        collision.bContact = normal.scaled(-overlap).add(aContact);
        collision.overlap = overlap;

        return collision;
    }

    /**
     * @param {PolygonBody} poly1
     * @param {PolygonBody} poly2
     * @return {{result: boolean, collision: *}}
     */
    static detectPolygonCollision(poly1, poly2) {
        const points1 = poly1.points;
        const points2 = poly2.points;

        if (points1.length === 0 || points2.length === 0) {
            throw Error("Unexpected poly: no points");
        }

        const testedNormals = new Set();
        let hasCollision = true;
        let minInterval = null;

        for (const [p1, p2, body] of [[points1, points2, poly1], [points2, points1, poly2]]) {
            const check = this.#detectPointsCollision(p1, p2, testedNormals);
            hasCollision &&= check.result;

            if (!hasCollision) {
                return {result: false, collision: null};
            }

            if (minInterval === null || check.overlap < minInterval.overlap) {
                minInterval = {...check, body};
            }
        }


        return {
            result: true,
            collision: {
                points1,
                points2,
                normal: minInterval.normal,
                origin: minInterval.origin,
                overlap: minInterval.overlap,
                body: minInterval.body
            }
        };
    }


    static detectPointWithPolygonCollision(point, polyPoints) {
        if (polyPoints.length === 0) {
            throw Error("Unexpected poly: no points");
        }

        return this.#detectPointsCollision(polyPoints, [point], new Set()).result;
    }

    static detectPolygonWithCircleCollision(origin, radius, polyPoints) {
        if (polyPoints.length === 0) {
            throw Error("Unexpected poly: no points");
        }

        return this.#detectPointsToCircleCollision(polyPoints, origin, radius);
    }

    /***
     * @param {Array<Vector2>} points1
     * @param {Array<Vector2>} points2
     * @param {Set<string>} testedNormals
     * @return {*}
     */
    static #detectPointsCollision(points1, points2, testedNormals) {
        let minInterval = {overlap: Number.POSITIVE_INFINITY};
        for (let i = 0; i < points1.length; i++) {
            const p1 = points1[i];
            const p2 = points1[(i + 1) % points1.length];
            const delta = p2.delta(p1);
            const normal = delta.normal();

            if (this.#isNormalAlreadyProcessed(normal, testedNormals)) {
                continue;
            }

            const check = Utils.getProjectionIntersectionInfo(normal, points1, points2);
            if (!check.result) {
                return {result: false};
            }

            if (minInterval.overlap > check.overlap) {
                minInterval = {...check, normal, origin: delta.scaled(0.5).add(p1)};
            }
        }

        return {result: points1.length > 0 && points2.length > 0, ...minInterval};
    }

    /**
     * @param {Vector2[]} points
     * @param {Vector2} circleOrigin
     * @param {origin} radius
     * @return {*}
     */
    static #detectPointsToCircleCollision(points, circleOrigin, radius) {
        function* getNextAxis() {
            // Polygon axis for SAT
            for (let i = 0; i < points.length; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % points.length];
                const delta = p2.delta(p1);
                const normal = delta.normal();

                yield {normal, origin: delta.scaled(0.5).add(p1)};
            }

            // Circle axis for SAT
            const closestPoint = Utils.getClosestPoint(circleOrigin, points);
            const normal = closestPoint.tangent(circleOrigin);
            yield {normal, origin: closestPoint};
        }

        const testedNormals = new Set();
        let minInterval = null;
        for (const {normal, origin} of getNextAxis()) {
            if (this.#isNormalAlreadyProcessed(normal, testedNormals)) {
                continue;
            }

            const circlePoints = [circleOrigin.copy().add(normal.scaled(-radius)), circleOrigin.copy().add(normal.scaled(radius))];
            const check = Utils.getProjectionIntersectionInfo(normal, points, circlePoints);
            if (!check.result) {
                return {result: false};
            }

            if (minInterval === null || minInterval.overlap > check.overlap) {
                minInterval = {...check, normal, origin};
            }
        }

        return {result: minInterval !== null, ...minInterval};
    }

    static #isNormalAlreadyProcessed(normal, testedNormals) {
        const normalKey = this.#getNormalKey(normal);
        if (testedNormals.has(normalKey)) {
            return true;
        }

        testedNormals.add(normalKey);
        return false;
    }

    static #getNormalKey(normal, fractionDigits = 7) {
        const clipped = normal.copy();
        if (normal.x < 0) {
            clipped.negate();
        } else if (normal.x === 0 && normal.y < 0) {
            clipped.negate();
        }

        return `${clipped.x.toFixed(fractionDigits)}_${clipped.y.toFixed(fractionDigits)}`;
    }
}

export class PolygonCollider extends Collider {
    /**
     * @param {PolygonBody} body1
     * @param {Body|PolygonBody} body2
     * @return {Collision}
     */
    static detectCollision(body1, body2) {
        if (!Collider.isBoundaryCollide(body1.boundary, body2.boundary)) {
            return new Collision(false);
        }

        const polyCollision = Collider.detectPolygonCollision(body1, body2);
        if (!polyCollision.result) {
            return new Collision(false);
        }

        const collisionInfo = polyCollision.collision;
        const [points, otherPoints] = collisionInfo.body === body1 ? [collisionInfo.points2, collisionInfo.points1] :
            [collisionInfo.points1, collisionInfo.points2];

        const centerTangent = body1.position.tangent(body2.position);
        const projectedNormal = centerTangent.dot(collisionInfo.normal);
        const flipNormal = collisionInfo.body === body1 ? projectedNormal < 0 : projectedNormal > 0;

        const normal = flipNormal ? collisionInfo.normal.negated() : collisionInfo.normal;

        let collisionA = PolygonCollider._getCollisionPoint(points, normal);
        let collisionB = collisionA.delta(normal.scaled(collisionInfo.overlap));

        const pointAContained = Utils.getProjectionIntersectionInfo(normal.perpendicular(), [collisionA], otherPoints);
        if (!pointAContained.result) {
            const alternativeCollision = PolygonCollider._getCollisionPoint(otherPoints, centerTangent.negated());
            collisionA = alternativeCollision.delta(normal.scaled(-collisionInfo.overlap));
            collisionB = alternativeCollision;
        }

        if (collisionInfo.body !== body1) {
            [collisionA, collisionB] = [collisionB, collisionA];
        }

        const collision = new Collision(true);
        collision.aContact = collisionA;
        collision.bContact = collisionB;
        collision.tangent = collision.aContact.tangent(collision.bContact);
        collision.overlap = collisionInfo.overlap;

        return collision;
    }

    static _getCollisionPoint(points, normal, eps = 1e-7) {
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

        return candidates.length === 2 ? candidates[1].delta(candidates[0]).scaled(0.5).add(candidates[0]) : candidates[0];
    }
}

export class LineCollider extends PolygonCollider {
    static detectCollision(body1, body2) {
        return Collider.detectBoundaryCollision(body1.boundary, body2.boundary);
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
        if (!Collider.isBoundaryCollide(boundary1, boundary2)) {
            return this.detectBoundaryCollision(boundary1, boundary2);
        }

        if (body2 instanceof CircleBody) {
            return this.#circleCollision(body1, body2);
        } else if (body2 instanceof RectBody && body2.angle === 0) {
            return this.#rectCollision(body1, boundary2);
        } else if (body2 instanceof PolygonBody) {
            return this.#polyCollision(body1, body2);
        }

        return this.#rectCollision(body1, boundary2);
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

        return new Collision(false);
    }

    /**
     * @param {CircleBody} body1
     * @param {PolygonBody} body2
     */
    static #polyCollision(body1, body2) {
        const points2 = body2.points;
        const collisionInfo = Collider.detectPolygonWithCircleCollision(body1.position, body1.radius, points2);
        if (!collisionInfo.result) {
            return new Collision(false);
        }

        const centerTangent = body1.position.tangent(body2.position);
        const projectedNormal = centerTangent.dot(collisionInfo.normal);
        const normal = projectedNormal > 0 ? collisionInfo.normal.negated() : collisionInfo.normal;

        const collisionB = normal.scaled(body1.radius).add(body1.position);
        const collisionA = collisionB.delta(normal.scaled(collisionInfo.overlap));

        const collision = new Collision(true);
        collision.aContact = collisionA;
        collision.bContact = collisionB;
        collision.tangent = collision.aContact.tangent(collision.bContact);
        collision.overlap = collisionInfo.overlap;

        return collision;
    }

    /**
     * @param {CircleBody} body1
     * @param {BoundaryBox} box2
     * @return {Collision}
     */
    static #rectCollision(body1, box2) {
        const delta = body1.position.delta(box2.center)
        const tangent = delta.normalized();
        const box2Contact = Utils.getBoxPoint(tangent, box2);

        const distance = delta.length();
        const centerDistance = body1.radius + box2Contact.length();
        const overlap = centerDistance - distance;

        if (overlap >= 0) {
            const collision = new Collision(true);
            collision.tangent = tangent;
            collision.aContact = box2Contact.add(box2.center);
            collision.bContact = tangent.scaled(overlap).add(collision.aContact);
            collision.overlap = overlap;

            return collision;
        }

        return new Collision(false);
    }
}