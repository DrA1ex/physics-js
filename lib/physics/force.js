import {Vector2} from "../utils/vector.js";

export class IForce {
    static EmptyImpulse = {impulse: new Vector2(), point: new Vector2()}

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

export class GlobalWind extends IForce {
    force;

    constructor(force) {
        super();

        this.force = force;
    }

    impulse(delta, body) {
        return {
            impulse: this.force.scaled(delta),
            point: body.position.copy()
        }
    }
}

export class SpotWindForce extends IForce {
    #origin;
    #normal;
    #angleRange;
    #force;
    #minDistance;

    #constraintVectors;

    /**
     * @param {Vector2} origin
     * @param {Vector2} normal
     * @param {number} angleRange
     * @param {number} force
     * @param {boolean} [dependingOnDistance=true]
     * @param {number} [minDistance=0]
     */
    constructor(origin, normal, angleRange, force, {dependingOnDistance = true, minDistance = 0} = {}) {
        super();

        this.#origin = origin;
        this.#normal = normal;
        this.#angleRange = angleRange;
        this.#force = force;

        this.dependingOnDistance = dependingOnDistance;
        this.#minDistance = minDistance;

        const leftVector = this.#normal.rotated(-this.#angleRange / 2).inlinePerpendicular().negate();
        const rightVector = this.#normal.rotated(this.#angleRange / 2).inlinePerpendicular();
        this.#constraintVectors = [leftVector, this.#normal, rightVector];
    }

    impulse(delta, body) {
        const distance = this.dependingOnDistance ? Math.max(1, this.#origin.delta(body.position).length()) : 1;
        if (this.dependingOnDistance && distance < this.#minDistance) {
            return IForce.EmptyImpulse;
        }

        for (const vector of this.#constraintVectors) {
            const check = vector.dot(this.#origin) > vector.dot(body.position);
            if (check) {
                return IForce.EmptyImpulse;
            }
        }

        const impulse = this.#normal.scaled(this.#force * delta / distance);
        return {impulse, point: body.position.copy()}
    }
}