import {PolygonBody} from "./poly.js";
import {Vector2} from "../../utils/vector.js";
import {RectCollider} from "../collider/rect.js";

/**
 * @extends Body<RectBody>
 */
export class RectBody extends PolygonBody {
    width = 0;
    height = 0;

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} [mass=1]
     */
    constructor(x, y, width, height, mass = 1) {
        const points = [
            new Vector2(-width / 2, -height / 2),
            new Vector2(width / 2, -height / 2),
            new Vector2(width / 2, height / 2),
            new Vector2(-width / 2, height / 2),
        ];

        super(x, y, points, mass);

        this.width = width;
        this.height = height;
        this.collider = new RectCollider(this);
    }

    _calcInertia(mass) {
        return (mass / 12) * (Math.pow(this.width, 2) + Math.pow(this.height, 2));
    }
}