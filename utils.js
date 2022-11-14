import {Vector2} from "./vector.js";

const EPS = 1e-6;

export function clamp(min, max, value) {
    return Math.min(max, Math.max(min, value));
}

/***
 * @param {number} start1
 * @param {number} end1
 * @param {number} start2
 * @param {number} end2
 * @return {boolean}
 */
export function isRangeIntersects(start1, end1, start2, end2) {
    return end1 >= start2 && start1 <= end2;
}

/**
 * @param {Vector2} tangent
 * @param {BoundaryBox} box
 * @return {Vector2}
 */
export function getBoxPoint(tangent, box) {
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

/**
 * @param {Vector2} point
 * @param {BoundaryBox} box
 * @param {boolean} [local=false]
 * @return {Vector2}
 */
export function getSideNormal(point, box, local = false) {
    const size = new Vector2(box.width / 2, box.height / 2);

    let normalized;
    if (local) {
        normalized = point.copy().div(size);
    } else {
        normalized = point.delta(box.center).div(size);
    }

    if (Math.abs(Math.abs(normalized.x) - 1) < EPS) {
        return new Vector2(Math.sign(normalized.x), 0);
    } else {
        return new Vector2(0, Math.sign(normalized.y));
    }
}

/**
 * @param {Vector2} point
 * @param {BoundaryBox} box
 * @param {boolean} [local=false]
 * @return {Vector2}
 */
export function getNearestVertex(point, box, local = false) {
    if (local) {
        point = point.copy().add(box.center);
    }

    return new Vector2(
        point.x < box.center.x ? box.left : box.right,
        point.y < box.center.y ? box.top : box.bottom
    );
}

/**
 * @param {Vector2} side
 * @param {BoundaryBox} box
 * @param {Vector2} origin
 * @param {boolean} [local=false]
 * @return {Vector2}
 */
export function getNearestBoxVertex(side, box, origin, local = false) {
    const [candidate1, candidate2] = getSidePoints(side, box);
    const candidate1Length = origin.delta(candidate1).length();
    const candidate2Length = origin.delta(candidate2).length();

    return candidate1Length < candidate2Length ? candidate1 : candidate2;
}

/**
 * @param {Vector2} origin
 * @param {Vector2} boxPoint
 * @param {BoundaryBox} box
 * @param {Vector2|null} [side=null]
 * @param {boolean} [local=false]
 * @return {Vector2}
 */
export function getAltitude(origin, boxPoint, box, side = null, local = false) {
    if (local) {
        origin = origin.copy().add(box.center);
        boxPoint = boxPoint.copy().add(box.center);
    }

    side = side ?? getSideNormal(boxPoint, box, false);
    const result = clampInsideBox(new Vector2(
        side.x === 0 ? origin.x : boxPoint.x,
        side.y === 0 ? origin.y : boxPoint.y
    ), box, false);

    if (local) {
        return result.sub(box.center);
    }

    return result;
}

/**
 * @param {Vector2} point
 * @param {BoundaryBox} box
 * @param {boolean} [local=false]
 * @return {Vector2}
 */
export function clampInsideBox(point, box, local = false) {
    if (local) {
        point = point.copy().add(box.center);
    }

    return new Vector2(clamp(box.left, box.right, point.x), clamp(box.top, box.bottom, point.y));
}

/**
 * @param {Vector2} pointA1
 * @param {Vector2} pointA2
 * @param {Vector2} pointB1
 * @param {Vector2} pointB2
 */
export function findIntersections(pointA1, pointA2, pointB1, pointB2) {
    const {x: x1, y: y1} = pointA1;
    const {x: x2, y: y2} = pointA2;
    const {x: x3, y: y3} = pointB1;
    const {x: x4, y: y4} = pointB2;

    // Check if none of the lines are of length 0
    if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
        return null;
    }

    const denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

    // Lines are parallel
    if (denominator === 0) {
        return null;
    }

    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

    // is the intersection along the segments
    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
        return null;
    }

    // Return a object with the x and y coordinates of the intersection
    let x = x1 + ua * (x2 - x1)
    let y = y1 + ua * (y2 - y1)

    return new Vector2(x, y);
}

/**
 * @param {Vector2} collisionPointB1
 * @param {BoundaryBox} box1
 * @return {boolean}
 */
export function isInsideBox(collisionPointB1, box1) {
    return box1.left <= collisionPointB1.x && collisionPointB1.x <= box1.right &&
        box1.top <= collisionPointB1.y && collisionPointB1.y <= box1.bottom;
}

/**
 * @param {Vector2} side
 * @param {BoundaryBox} box
 * @param {boolean} [local=false]
 * @return {[Vector2, Vector2]}
 */
export function getSidePoints(side, box, local = false) {
    let localPoints;

    const halfSize = new Vector2(box.width / 2, box.height / 2);
    if (side.x === 0) {
        localPoints = [new Vector2(-halfSize.x, side.y * halfSize.y), new Vector2(halfSize.x, side.y * halfSize.x)];
    } else {
        localPoints = [new Vector2(side.x * halfSize.x, -halfSize.y), new Vector2(side.x * halfSize.x, halfSize.y)];
    }

    if (!local) {
        return localPoints.map(p => p.add(box.center));
    }

    return localPoints;
}