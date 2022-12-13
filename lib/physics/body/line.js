import {PolygonBody} from "./poly.js";
import {Vector2} from "../../utils/vector.js";
import {LineCollider} from "../collider/line.js";

/**
 * @extends Body<LineBody>
 */
export class LineBody extends PolygonBody {

    /**
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} [mass=1]
     */
    constructor(x1, y1, x2, y2, mass = 1) {
        const {localPoints, position} = LineBody.#calculateNewPosition(x1, y1, x2, y2);
        super(position.x, position.y, localPoints, mass);

        this.collider = new LineCollider(this);
    }

    updatePoints(delta1, delta2) {
        const {localPoints, position} = LineBody.#calculateNewPosition(
            this._localPoints[0].x + delta1.x, this._localPoints[0].y + delta1.y,
            this._localPoints[1].x + delta2.x, this._localPoints[1].y + delta2.y,
        );

        for (let i = 0; i < this._localPoints.length; i++) {
            this._localPoints[i].set(localPoints[i]);
        }

        this.position.add(position);
        this._updateTransformedPoints();
    }

    static #calculateNewPosition(x1, y1, x2, y2) {
        const center = new Vector2((x2 - x1) / 2, (y2 - y1) / 2);
        const points = [new Vector2(-center.x, -center.y), new Vector2(center.x, center.y)];

        return {
            position: new Vector2(x1 + center.x, y1 + center.y),
            localPoints: points
        };
    }
}