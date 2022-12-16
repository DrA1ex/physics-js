import {List} from "../../../../misc/list.js";

export function assignColor(buffer, index, count, rgb, alpha) {
    index *= 4;
    for (let i = 0; i < count; i++) {
        for (let k = 0; k < 3; k++) {
            buffer[index + i * 4 + k] = rgb[k];
        }

        buffer[index + i * 4 + 3] = alpha;
    }
}

export function setIndexedTriangle(buffer, index, pIndex, count) {
    index *= 3;
    for (let k = 0; k < count; k++) {
        buffer[index + k * 3] = pIndex;
        buffer[index + k * 3 + 1] = pIndex + k % count + 1;
        buffer[index + k * 3 + 2] = pIndex + (k + 1) % count + 1;
    }
}

/**
 *
 * @param {Vector2[]} points
 */
export function triangulateIndexed(points) {
    if (points.length < 3) throw new Error(`To form triangle need at least 3 points, got ${points.length}`);

    const result = new Array((points.length - 2) * 3);
    const list = new List(points.map((point, i) => ({index: i, point})));

    let rIndex = 0;
    let current = list.root;
    while (list.size > 3) {
        const next = current.next ?? list.root;
        if (nodeIsEar(current)) {
            writeTriangle(result, rIndex, list.root);
            rIndex += 3;

            list.remove(current);
        }

        current = next;
    }

    writeTriangle(result, rIndex, list.root);
    return result;
}

function nodeIsEar(origin) {
    const prev = (origin.previous ? origin.previous : origin.list.last);
    const next = (origin.next ? origin.next : origin.list.root);

    if (!isInternal(origin, prev, next)) return false;

    let current = origin.next.next ?? origin.list.root;
    while (current !== prev) {
        const inside = isInternal(origin, prev, current)
            || isInternal(origin, next, current)
            || isInternal(prev, next, current);
        if (inside) return false;

        current = current.next ?? current.list.root;
    }

    return true;
}

function isInternal(current, prev, next) {
    const localPrev = prev.value.point.delta(current.value.point);
    const localNext = next.value.point.delta(current.value.point);
    const cross = localPrev.cross(localNext);

    console.log(prev.value.index, current.value.index, next.value.index, cross);
    return cross > 0;
}

function writeTriangle(array, index, node) {
    if (index + 3 >= array.length) throw new Error(`Index out of bounds: index: ${index}, length: ${array.length}`);

    let current = node;
    for (let i = 0; i < 3; i++) {
        array[index + i] = current.value.index;
        current = node.next;
    }
}