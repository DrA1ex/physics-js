import {Body, CircleBody, LineBody, PolygonBody, RectBody} from "./body.js";
import {Vector2} from "../utils/vector.js";
import * as GeomUtils from "../utils/geom.js";

export class Collision {
    result = false;

    /**@type{Vector2}*/
    tangent = null;
    /**@type{Vector2}*/
    aContact = null;
    /**@type{Vector2}*/
    bContact = null;

    /**@type{Body}*/
    aBody = null;
    /**@type{Body}*/
    bBody = null;

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
                this.collision.aBody = body2;
                this.collision.bBody = body1;
                break;
            }

            const reversedType1Constraint = body2 instanceof type1;
            const reversedType2Constraint = reversedType1Constraint && types2.some(t => body1 instanceof t);
            if (reversedType1Constraint && reversedType2Constraint) {
                this.collision = detectorFn(body2, body1);
                this.collision.aBody = body1;
                this.collision.bBody = body2;
                break;
            }
        }

        return this.collision.result;
    }

    static isBoundaryCollide(box1, box2) {
        return GeomUtils.isRangeIntersects(box1.left, box1.right, box2.left, box2.right) &&
            GeomUtils.isRangeIntersects(box1.top, box1.bottom, box2.top, box2.bottom);
    }

    static detectBoundaryCollision(box1, box2) {
        if (!this.isBoundaryCollide(box1, box2)) {
            return new Collision(false);
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
     * @param {Body|PolygonBody} body1
     * @param {Body|PolygonBody} body2
     * @return {{result: boolean, collision: *}}
     */
    static detectPolygonCollision(body1, body2) {
        const points1 = body1.points;
        const points2 = body2.points;

        if (points1.length === 0 || points2.length === 0) {
            throw Error("Unexpected poly: no points");
        }

        let hasCollision = true;
        let minInterval = null;

        for (const [p1, p2, body] of [[points1, points2, body1], [points2, points1, body2]]) {
            const check = this.#detectPointsCollision(p1, p2);
            hasCollision &&= check.result;

            if (!hasCollision) {
                return {result: false, collision: null};
            }

            if (minInterval === null || check.overlap < minInterval.overlap) {
                minInterval = {check, body};
            }
        }


        return {
            result: true,
            collision: {
                points1,
                points2,
                normal: minInterval.check.normal,
                origin: minInterval.check.origin,
                overlap: minInterval.check.overlap,
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

    static detectLineWithCircleCollision(origin, radius, linePoints) {
        if (linePoints.length !== 2) {
            throw Error("Unexpected line: expected 2 points");
        }

        return this.#detectLineToCircleCollision(linePoints, origin, radius);
    }

    /***
     * @param {Array<Vector2>} points1
     * @param {Array<Vector2>} points2
     * @return {*}
     */
    static #detectPointsCollision(points1, points2) {
        let minInterval = {check: {overlap: Number.POSITIVE_INFINITY}};
        for (let i = 0; i < points1.length; i++) {
            const p1 = points1[i];
            const p2 = points1[(i + 1) % points1.length];
            const delta = p2.delta(p1);
            const normal = delta.normal();

            const check = GeomUtils.getProjectionIntersectionInfo(normal, points1, points2);
            if (!check.result) {
                return {result: false};
            }

            if (minInterval.check.overlap > check.overlap) {
                minInterval = {check, normal, origin: delta.scaled(0.5).add(p1)};
            }
        }

        return {
            result: points1.length > 0 && points2.length > 0,
            normal: minInterval.normal,
            origin: minInterval.origin,
            overlap: minInterval.check.overlap,
        };
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
            const closestPoint = GeomUtils.getClosestPoint(circleOrigin, points);
            const normal = closestPoint.tangent(circleOrigin);
            yield {normal, origin: closestPoint};
        }

        let minInterval = null;
        for (const {normal, origin} of getNextAxis()) {
            const circlePoints = [circleOrigin.copy().add(normal.scaled(-radius)), circleOrigin.copy().add(normal.scaled(radius))];
            const check = GeomUtils.getProjectionIntersectionInfo(normal, points, circlePoints);
            if (!check.result) {
                return {result: false};
            }

            if (minInterval === null || minInterval.overlap > check.overlap) {
                minInterval = {...check, normal, origin};
            }
        }

        return {result: minInterval !== null, ...minInterval};
    }

    static #detectLineToCircleCollision(points, circleOrigin, radius) {
        function* getNextAxis() {
            // Line normal axis for SAT
            const delta = points[1].delta(points[0]);
            const lineNormal = delta.normal();
            yield {normal: lineNormal, origin: delta.scaled(0.5).add(points[0]), axis: "normal"};

            // Circle axis for SAT
            const closestPoint = GeomUtils.getClosestPoint(circleOrigin, points);
            const normal = closestPoint.tangent(circleOrigin);
            yield {normal, origin: closestPoint, axis: "closest"};

            yield {normal: delta.normalized(), origin: closestPoint, axis: "parallel"};
        }

        const checks = {};
        for (const {normal, origin, axis} of getNextAxis()) {
            const circlePoints = [circleOrigin.copy().add(normal.scaled(-radius)), circleOrigin.copy().add(normal.scaled(radius))];
            const check = GeomUtils.getProjectionIntersectionInfo(normal, points, circlePoints);

            if (!check.result) {
                return {result: false};
            }

            checks[axis] = {...check, normal, origin};
        }

        return {result: true, checks};
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

        const normal = collisionInfo.body === body2 ?
            this._alignNormal(body1, body2, collisionInfo.normal) :
            this._alignNormal(body2, body1, collisionInfo.normal);

        let collisionA = PolygonCollider._getCollisionPoint(points, normal);
        let collisionB = collisionA.delta(normal.scaled(collisionInfo.overlap));

        const pointAContained = GeomUtils.getProjectionIntersectionInfo(normal.perpendicular(), [collisionA], otherPoints);
        if (!pointAContained.result) {
            const centralTangent = body2.position.tangent(body1.position);
            const alternativeCollision = PolygonCollider._getCollisionPoint(otherPoints, centralTangent);
            collisionA = alternativeCollision.delta(normal.scaled(-collisionInfo.overlap));
            collisionB = alternativeCollision;
        }

        if (collisionInfo.body !== body1) {
            [collisionA, collisionB] = [collisionB, collisionA];
        }

        return this._createCollision(collisionA, collisionB, collisionInfo.overlap);
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

    static _createCollision(collisionA, collisionB, overlap) {
        const collision = new Collision(true);
        collision.aContact = collisionA;
        collision.bContact = collisionB;
        collision.tangent = collision.aContact.tangent(collision.bContact);
        collision.overlap = overlap;

        return collision;
    }

    static _alignNormal(body1, body2, normal) {
        const delta = body1.position.delta(body2.position);
        const projectedNormal = delta.dot(normal);
        return projectedNormal > 0 ? normal.negated() : normal;
    }
}

export class LineCollider extends PolygonCollider {
    static detectCollision(body1, body2) {
        if (!Collider.isBoundaryCollide(body1.boundary, body2.boundary)) {
            return new Collision(false);
        }

        const points1 = body1.points;
        const points2 = body2.points;
        const normalProjection = points1[0].delta(points1[1]).normal();
        const parallelProjection = normalProjection.perpendicular();

        const hasCollision = GeomUtils.getProjectionIntersectionInfo(normalProjection, points1, points2).result
            && GeomUtils.getProjectionIntersectionInfo(parallelProjection, points1, points2).result;

        if (!hasCollision) {
            return new Collision(false);
        }

        const normalAlign = PolygonCollider._alignNormal(body2, body1, normalProjection);
        const normalOrigin = PolygonCollider._getCollisionPoint(points2, normalAlign);
        const normalOverlap = normalAlign.dot(normalOrigin.delta(body1.position));

        const parallelAxisAlign = PolygonCollider._alignNormal(body2, body1, parallelProjection);
        const parallelAxisOrigin = PolygonCollider._getCollisionPoint(points2, parallelAxisAlign);
        const parallelAxisClosest = PolygonCollider._getCollisionPoint(points1, parallelAxisAlign.negated());
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
        return PolygonCollider._createCollision(collisionA, collisionB, overlap);
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

        return new Collision(false);
    }

    /**
     * @param {CircleBody} body1
     * @param {PolygonBody|Body} body2
     */
    static #polyCollision(body1, body2) {
        const points2 = body2.points;
        const collisionInfo = Collider.detectPolygonWithCircleCollision(body1.position, body1.radius, points2);
        if (!collisionInfo.result) {
            return new Collision(false);
        }

        const normal = PolygonCollider._alignNormal(body1, body2, collisionInfo.normal);
        const collisionB = normal.scaled(body1.radius).add(body1.position);
        const collisionA = collisionB.delta(normal.scaled(collisionInfo.overlap));

        return PolygonCollider._createCollision(collisionA, collisionB, collisionInfo.overlap);
    }

    /**
     * @param {CircleBody} body1
     * @param {PolygonBody} body2
     */
    static #lineCollision(body1, body2) {
        const points2 = body2.points;
        const collisionInfo = Collider.detectLineWithCircleCollision(body1.position, body1.radius, points2);
        if (!collisionInfo.result) {
            return new Collision(false);
        }

        const normalAxisCheck = collisionInfo.checks["normal"];
        const normalAlign = PolygonCollider._alignNormal(body1, body2, normalAxisCheck.normal);
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

        return PolygonCollider._createCollision(collisionA, collisionB, overlap);
    }
}