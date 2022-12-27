import {List} from "../misc/list.js";

/**
 * @typedef {{point: Vector2, index: number}} IndexedPoint
 */

/**
 * @param {Vector2[]} points
 * @return {Array<[number, number, number]> | null}
 */
export function earClipping(points) {
    if (points.length < 3) return null;

    const indexedPoints = points.map((v, i) => ({point: v, index: i}));
    if (isClockwise(points)) indexedPoints.reverse();

    /** @type {List<IndexedPoint>} */
    const list = new List(indexedPoints);
    const result = new Array((points.length - 2) * 3);
    let outIndex = 0;

    let current = list.first;
    let lastAfterCut = list.first;
    while (list.size > 3) {
        const next = list.next(current);
        if (isEar(list, current)) {
            writeTriangle(result, outIndex, list, current)
            outIndex += 3;

            list.remove(current);
            lastAfterCut = next;
        } else if (next === lastAfterCut) {
            // If we made a full loop, then algorithm doesn't work for this kind of polygon
            return null;
        }

        current = next;
    }

    writeTriangle(result, outIndex, list, list.first);
    return result;
}

/**
 * @param {Vector2[]} points
 * @return {boolean}
 */
export function isClockwise(points) {
    let bottomRight = points[0];
    let bottomRightIndex = 0;

    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const check = point.y !== bottomRight.y ? point.y < bottomRight.y : point.x > bottomRight.x;
        if (check) {
            bottomRight = point;
            bottomRightIndex = i;
        }
    }

    const prev = points[(points.length + bottomRightIndex - 1) % points.length];
    const next = points[(bottomRightIndex + 1) % points.length];

    return !isInternal(bottomRight, prev, next);
}

/**
 * @param {List<IndexedPoint>} list
 * @param {ListNode<IndexedPoint>} origin
 * @return {boolean}
 */
function isEar(list, origin) {
    const prev = list.previous(origin);
    const next = list.next(origin);

    const internal = isNodeInternal(origin, prev, next);
    if (!internal) return false;

    let current = next.next ?? list.last;
    while (current !== prev) {
        const checkSum = isNodeInternal(origin, prev, current) +
            isNodeInternal(prev, next, current) +
            isNodeInternal(next, origin, current);

        // Point contained by a triangle if all check return same result
        const inside = checkSum === 0 || checkSum === 3;
        if (inside) return false;

        current = list.next(current);
    }

    return true;
}

/**
 * @param {ListNode<IndexedPoint>} origin
 * @param {ListNode<IndexedPoint>} prev
 * @param {ListNode<IndexedPoint>} next
 * @return {boolean}
 */
function isNodeInternal(origin, prev, next) {
    return isInternal(origin.value.point, prev.value.point, next.value.point);
}

/**
 *
 * @param {Vector2} origin
 * @param {Vector2} prev
 * @param {Vector2} next
 * @return {boolean}
 */
function isInternal(origin, prev, next) {
    const localPrev = prev.delta(origin);
    const localNext = next.delta(origin);
    const cross = localNext.cross(localPrev);

    return cross > 0;
}

/**
 * @param {number[]} array
 * @param {number} index
 * @param {List<IndexedPoint>} list
 * @param {ListNode<IndexedPoint>} origin
 */
function writeTriangle(array, index, list, origin) {
    if (index + 3 > array.length) throw new Error(`Index out of bounds: index: ${index}, length: ${array.length}`);

    const prev = list.previous(origin);
    const next = list.next(origin);

    array[index] = prev.value.index;
    array[index + 1] = origin.value.index;
    array[index + 2] = next.value.index;
}