import {Body} from "./base.js";
import {CircleCollider} from "../collider/circle.js";

/**
 * @extends Body<CircleBody>
 */
export class CircleBody extends Body {
    radius = 0;

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} radius
     * @param {number} [mass=1]
     */
    constructor(x, y, radius, mass = 1) {
        super(x, y, mass);

        this.radius = radius;
        this.collider = new CircleCollider(this);
    }

    _calcInertia(mass) {
        return this.mass * Math.pow(this.radius, 2) / 2;
    }

    get boundary() {
        return this._boundary.update(
            this.position.x - this.radius, this.position.x + this.radius,
            this.position.y - this.radius, this.position.y + this.radius
        );
    }
}