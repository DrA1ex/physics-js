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

/***
 * @param {number} start1
 * @param {number} end1
 * @param {number} start2
 * @param {number} end2
 * @return {number}
 */
export function rangeIntersection(start1, end1, start2, end2) {
    return Math.min(end1, end2) - Math.max(start1, start2)
}

/**
 * @param {Vector2} projection
 * @param {Vector2[]} points1
 * @param {Vector2[]} points2
 * @return {{result: boolean, overlap: number, i1: {min, max}, i2: {min, max}}}
 */
export function getProjectionIntersectionInfo(projection, points1, points2) {
    const i1 = this.getProjectedInterval(projection, points1);
    const i2 = this.getProjectedInterval(projection, points2);

    return {
        result: isRangeIntersects(i1.min, i1.max, i2.min, i2.max),
        overlap: rangeIntersection(i1.min, i1.max, i2.min, i2.max),
        i1, i2
    };
}

/**
 *
 * @param {Vector2} projection
 * @param {Vector2[]} points
 * @return {{min: number, max: number}}
 */
export function getProjectedInterval(projection, points) {
    let min = Number.POSITIVE_INFINITY, max = Number.NEGATIVE_INFINITY;
    for (const point of points) {
        const projected = projection.dot(point);

        if (projected < min) {
            min = projected;
        }

        if (projected > max) {
            max = projected;
        }
    }

    return {min, max};
}

/***
 * @param {Vector2} origin
 * @param {Vector2[]} points
 * @return {Vector2|null}
 */
export function getClosestPoint(origin, points) {
    let minDist = Number.POSITIVE_INFINITY;
    let closestPoint = null;
    for (const point of points) {
        const dist = point.delta(origin).lengthSquared()
        if (dist < minDist) {
            minDist = dist;
            closestPoint = point;
        }
    }

    return closestPoint;
}