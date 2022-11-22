import {Vector2} from "../utils/vector.js";

export class IForce {
    /**
     * @param {number} delta
     * @param {Body} body
     * @return {{impulse: Vector2, point: Vector2}}
     *
     * @abstract
     */
    impulse(delta, body) {
    }
}

export class GravityForce extends IForce {
    gravity = 0;

    constructor(gravity) {
        super();

        this.gravity = gravity;
    }

    impulse(delta, body) {
        return {
            impulse: new Vector2(0, this.gravity * body.mass * delta),
            point: body.position.copy()
        };
    }
}

export class ResistanceForce extends IForce {
    resistance = 0;

    constructor(resistance) {
        super();

        this.resistance = Math.max(0, Math.min(1, resistance));
    }

    impulse(delta, body) {
        const k = -(1 - this.resistance);

        return {
            impulse: body.velocity.scaled(body.mass * k * delta * 60),
            point: body.position.copy()
        }
    }
}