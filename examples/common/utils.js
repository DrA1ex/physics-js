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