import {Vector2} from "./vector.js";
import {ImpulseType} from "./enum.js";

export class IForce {
    /**
     * @param {number} delta
     * @param {Body} body
     * @return {Impulse}
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
            type: ImpulseType.regular,
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
            type: ImpulseType.scalar,
            impulse: body.velocity.scaled(k),
            point: body.position.copy()
        }
    }
}