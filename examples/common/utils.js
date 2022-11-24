import {Vector2} from "../../lib/utils/vector.js";
import {PolygonBody, RectBody} from "../../lib/physics/body.js";

/**
 * @param {Vector2} position
 * @param {number} vertexCount
 * @param {number} size
 * @return {PolygonBody}
 */
export function createRegularPoly(position, vertexCount, size) {
    if (vertexCount === 4) {
        return new RectBody(position.x, position.y, size, size);
    }

    const angleStep = Math.PI * 2 / Math.max(2, vertexCount);
    const points = new Array(vertexCount);
    for (let i = 0; i < vertexCount; i++) {
        points[i] = Vector2.fromAngle(i * angleStep).scale(size / 2);
    }

    return new PolygonBody(position.x, position.y, points);
}

/**
 * @param {TouchEvent | MouseEvent} e
 * @return {Vector2}
 */
export function getMousePos(e) {
    const point = (e.touches && e.touches[0] || e.changedTouches && e.changedTouches[0]) ?? e;
    const bcr = e.target.getBoundingClientRect();

    return new Vector2(point.clientX - bcr.x, point.clientY - bcr.y);
}