/**
 * @typedef {{type: ConstraintType}} ConstraintBase
 * @typedef {ConstraintBase & {box: BoundaryBox}} InsetConstraint
 *
 * @typedef {InsetConstraint} Constraint
 */

import {Vector2} from "./vector.js";

/**
 * @enum{number}
 */
export const ConstraintType = {
    inset: 0,
}

/**
 * @enum{number}
 */
const ImpulseType = {
    regular: 0,
    scalar: 1,
    pseudo: 2,
}

export class ImpulseBasedSolver {
    rigidBodies = [];
    constraints = [];
    forces = [];

    stepInfo = {
        delta: 0,
        impulses: new Map(),
    }

    constructor() {
        this.debug = window.__app.DebugInstance;
    }

    /**
     * @param {Body} body
     */
    addRigidBody(body) {
        this.rigidBodies.push(body);
    }

    addConstraint(constraint) {
        this.constraints.push(constraint);
    }

    addForce(force) {
        this.forces.push(force);
    }

    step(delta) {
        this.debug.reset();
        this.stepInfo.delta = delta;
        this.stepInfo.impulses.clear();

        if (delta <= 0) {
            return;
        }

        for (const force of this.forces) {
            for (const body of this.rigidBodies) {
                this.#storeImpulse(body, force(this.stepInfo.delta, body));
            }
        }

        for (let i = 0; i < this.rigidBodies.length; i++) {
            const body1 = this.rigidBodies[i];

            for (const constraint of this.constraints) {
                this.#processConstraint(body1, constraint);
            }

            for (let j = i + 1; j < this.rigidBodies.length; j++) {
                const body2 = this.rigidBodies[j];
                this.#processNonPenetrationConstraint(body1, body2);
            }
        }

        for (const body of this.rigidBodies) {
            const impulses = this.stepInfo.impulses.get(body) || [];
            for (const {type, impulse} of impulses) {
                switch (type) {
                    case ImpulseType.regular:
                        this.#applyImpulse(body, impulse);
                        break;

                    case ImpulseType.scalar:
                        this.#applyImpulse(body, impulse, true);
                        break;

                    case ImpulseType.pseudo:
                        this.#applyPseudoImpulse(body, impulse);
                        break;
                }

            }
        }

        for (const body of this.rigidBodies) {
            this.#applyPseudoImpulse(body, body.velocity.copy().scale(delta));
            this.debug.addImpulse(body.position, body.velocity, "red");
        }
    }

    /**
     * @param {Body} body
     * @param {Vector2} impulse
     * @param {boolean} [scalar=false]
     */
    #applyImpulse(body, impulse, scalar = false) {
        const scaledImpulse = scalar ? impulse : impulse.copy().scale(1 / body.mass);
        body.velocity.add(scaledImpulse);
        this.debug.addImpulse(body.position, scaledImpulse);
    }

    /**
     * @param {Body} body
     * @param {Vector2} impulse
     */
    #applyPseudoImpulse(body, impulse) {
        if (!body.active) {
            return;
        }

        body.position.add(impulse);
        this.debug.addImpulse(body.position, impulse, "blue");
    }

    /**
     * @param {Body} body
     * @param {Vector2} impulse
     * @param {ImpulseType} [type=ImpulseType.regular]
     */
    #storeImpulse(body, impulse, type = ImpulseType.regular) {
        if (!this.stepInfo.impulses.has(body)) {
            this.stepInfo.impulses.set(body, []);
        }

        this.stepInfo.impulses.get(body).push({type, impulse});
    }

    /**
     * @param {Body} body1
     * @param {Body} body2
     */
    #processNonPenetrationConstraint(body1, body2) {
        if (!body1.collider.detectCollision(body2)) {
            return
        }

        function _collide(delta, distSquare, b1, b2) {
            const massFactor = (2 * b2.mass) / (b1.mass + b2.mass);
            return delta.copy().scale(-massFactor * b1.velocity.copy().sub(b2.velocity).dot(delta) / distSquare);
        }

        const collision = body1.collider.collision;
        const delta = body1.position.copy().sub(body2.position);
        const distSquare = Math.pow(collision.distance, 2);

        const velocity1 = _collide(delta, distSquare, body1, body2);
        const velocity2 = _collide(delta.copy().negate(), distSquare, body2, body1);

        this.#storeImpulse(body1, velocity1, ImpulseType.scalar);
        this.#storeImpulse(body2, velocity2, ImpulseType.scalar);

        this.#storeImpulse(body1, collision.penetration, ImpulseType.pseudo);
    }

    /**
     * @param {Body} body
     * @param {Constraint} constraint
     */
    #processConstraint(body, constraint) {
        switch (constraint.type) {
            case ConstraintType.inset:
                this.#processInsetConstraint(body, constraint);
                break;
        }
    }

    /**
     *
     * @param {Body} body
     * @param {InsetConstraint} constraint
     */
    #processInsetConstraint(body, constraint) {
        const xDamper = 0.3, yDamper = 0.1;
        const {box: cBox} = constraint;
        const box = body.boundary;

        if (box.left < cBox.left) {
            this.#storeImpulse(body, new Vector2(-body.velocity.x - body.velocity.x * xDamper, 0), ImpulseType.scalar);
            this.#storeImpulse(body, new Vector2(cBox.left - box.left, 0), ImpulseType.pseudo);
        } else if (box.right > cBox.right) {
            this.#storeImpulse(body, new Vector2(-body.velocity.x - body.velocity.x * xDamper, 0), ImpulseType.scalar);
            this.#storeImpulse(body, new Vector2(cBox.right - box.right, 0), ImpulseType.pseudo);
        }

        if (box.top < cBox.top) {
            this.#storeImpulse(body, new Vector2(0, -body.velocity.y - body.velocity.y * yDamper), ImpulseType.scalar);
            this.#storeImpulse(body, new Vector2(0, cBox.top - box.top), ImpulseType.pseudo);
        } else if (box.bottom > cBox.bottom) {
            this.#storeImpulse(body, new Vector2(0, -body.velocity.y - body.velocity.y * yDamper), ImpulseType.scalar);
            this.#storeImpulse(body, new Vector2(0, cBox.bottom - box.bottom), ImpulseType.pseudo);
        }
    }
}