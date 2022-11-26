import * as GeomUtils from "./geom.js";

/**
 * @typedef {{normal: Vector2, origin: Vector2, overlap: Number}} CollisionCheckData
 * @typedef {{normal: Vector2, origin: Vector2, overlap: Number, body: Body, points1: Vector2[], points2: Vector2[]}} CollisionCheckDataExtended
 * @typedef {{result: boolean} | {result: boolean} & CollisionCheckData} CollisionCheckResult
 */

/**
 * @param {Body|PolygonBody} body1
 * @param {Body|PolygonBody} body2
 * @return {{result: boolean, collision?: CollisionCheckDataExtended}}
 */
export function detectPolygonCollision(body1, body2) {
    const points1 = body1.points;
    const points2 = body2.points;

    if (points1.length === 0 || points2.length === 0) {
        throw Error("Unexpected poly: no points");
    }

    let hasCollision = true;
    let minInterval = null;

    for (const [p1, p2, body] of [[points1, points2, body1], [points2, points1, body2]]) {
        const check = _detectPointsCollision(p1, p2);
        hasCollision &&= check.result;

        if (!hasCollision) {
            return {result: false};
        }

        if (minInterval === null || check.overlap < minInterval.check.overlap) {
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

/**
 * @param {Vector2} origin
 * @param {number} radius
 * @param {Vector2[]} polyPoints
 * @return {CollisionCheckResult}
 */
export function detectPolygonWithCircleCollision(origin, radius, polyPoints) {
    if (polyPoints.length === 0) {
        throw Error("Unexpected poly: no points");
    }

    return _detectPointsToCircleCollision(polyPoints, origin, radius);
}

/**
 * @param {Vector2} origin
 * @param {number} radius
 * @param {Vector2[]} linePoints
 * @return {{result: boolean, checks?: {[string]: CollisionCheckData}}}
 */
export function detectLineWithCircleCollision(origin, radius, linePoints) {
    if (linePoints.length !== 2) {
        throw Error("Unexpected line: expected 2 points");
    }

    return _detectLineToCircleCollision(linePoints, origin, radius);
}

/***
 * @param {Array<Vector2>} points1
 * @param {Array<Vector2>} points2
 * @return {CollisionCheckResult}
 */
function _detectPointsCollision(points1, points2) {
    let minInterval = null;
    for (let i = 0; i < points1.length; i++) {
        const p1 = points1[i];
        const p2 = points1[(i + 1) % points1.length];
        const delta = p2.delta(p1);
        const normal = delta.normal();

        const check = GeomUtils.getProjectionIntersectionInfo(normal, points1, points2);
        if (!check.result) {
            return {result: false};
        }

        if (minInterval === null || minInterval.check.overlap > check.overlap) {
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
 * @param {number} radius
 * @return {CollisionCheckResult}
 */
function _detectPointsToCircleCollision(points, circleOrigin, radius) {
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

        if (minInterval === null || minInterval.check.overlap > check.overlap) {
            minInterval = {check, normal, origin};
        }
    }

    return {
        result: minInterval !== null,
        normal: minInterval.normal,
        origin: minInterval.origin,
        overlap: minInterval.check.overlap,
    };
}

/**
 * @param {Vector2[]} points
 * @param {Vector2} circleOrigin
 * @param {number} radius
 * @return {{result: boolean, checks?: {[string]: CollisionCheckData}}}
 */
function _detectLineToCircleCollision(points, circleOrigin, radius) {
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