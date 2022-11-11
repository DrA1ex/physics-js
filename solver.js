/**
 * @typedef {{type: ConstraintType}} ConstraintBase
 * @typedef {ConstraintBase & {box: BoundaryBox, damper: Vector2}} InsetConstraint
 *
 * @typedef {InsetConstraint} Constraint
 *
 * @typedef {function(delta: number, body: Body): Vector2} Force
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
    /** @type {Body[]} */
    rigidBodies = [];
    /** @type {Constraint[]} */
    constraints = [];
    /** @type {Force[]} */
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

    /**
     * @param {Constraint} constraint
     */
    addConstraint(constraint) {
        this.constraints.push(constraint);
    }

    /**
     * @param {Force} force
     */
    addForce(force) {
        this.forces.push(force);
    }

    /**
     * @param {number} delta
     */
    solve(delta) {
        this.debug.reset();
        this.stepInfo.delta = Math.max(0, Math.min(0.1, delta));
        this.stepInfo.impulses.clear();

        if (this.stepInfo.delta === 0) {
            return;
        }

        this.step();

        for (const body of this.rigidBodies) {
            const impulses = this.stepInfo.impulses.get(body) || [];
            for (const {type, impulse} of impulses) {
                switch (type) {
                    case ImpulseType.regular:
                        body.applyImpulse(impulse);
                        this.debug.addVector(body.position, impulse.scaled(1 / body.mass));
                        break;

                    case ImpulseType.scalar:
                        body.applyImpulse(impulse.scaled(body.mass));
                        this.debug.addVector(body.position, impulse);
                        break;

                    case ImpulseType.pseudo:
                        if (body.active) {
                            body.position.add(impulse);
                        }
                        break;
                }

            }
        }

        for (const body of this.rigidBodies) {
            if (!body.active) {
                body.velocity.zero();
                continue;
            }

            body.position.add(body.velocity.scaled(delta));
            this.debug.addVector(body.position, body.velocity, "red");
        }
    }

    step() {
        // Forces
        for (const force of this.forces) {
            for (const body of this.rigidBodies) {
                this.#storeImpulse(body, force(this.stepInfo.delta, body));
            }
        }

        // Constraints
        for (let i = 0; i < this.rigidBodies.length; i++) {
            const body1 = this.rigidBodies[i];

            for (const constraint of this.constraints) {
                this.#processConstraint(body1, constraint);
            }

            for (let j = i + 1; j < this.rigidBodies.length; j++) {
                const body2 = this.rigidBodies[j];
                this.#processCollision(body1, body2);
            }
        }
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
    #processCollision(body1, body2) {
        if (!body1.collider.detectCollision(body2)) {
            return
        }

        const collision = body1.collider.collision;
        this.debug.addCollision(collision.contact);
        this.debug.addVector(collision.contact, collision.penetration.copy().negate(), "violet");

        const velocityDelta = body1.velocity.delta(body2.velocity);
        const projectedVelocity = collision.tangent.dot(velocityDelta);
        const effectiveMass = body1.mass + body2.mass

        const velocity1 = (1 + body1.restitution) * body2.mass / effectiveMass * projectedVelocity;
        const velocity2 = (1 + body2.restitution) * body1.mass / effectiveMass * projectedVelocity;

        this.#storeImpulse(body1, collision.tangent.scaled(-velocity1), ImpulseType.scalar);
        this.#storeImpulse(body2, collision.tangent.scaled(velocity2), ImpulseType.scalar);

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
        const {x: xDamper, y: yDamper} = constraint.damper;
        const {box: cBox} = constraint;
        const box = body.boundary;


        const penetration = new Vector2();
        if (box.left < cBox.left) {
            penetration.x = box.left - cBox.left;
        } else if (box.right > cBox.right) {
            penetration.x = box.right - cBox.right;
        }

        if (box.top < cBox.top) {
            penetration.y = box.top - cBox.top;
        } else if (box.bottom > cBox.bottom) {
            penetration.y = box.bottom - cBox.bottom;
        }

        if (penetration.x === 0 && penetration.y === 0) {
            return;
        }

        const hasCollision = new Vector2(penetration.x !== 0, penetration.y !== 0);
        const impulse = new Vector2(1 + xDamper, 1 + yDamper).mul(body.velocity).mul(hasCollision).negate();

        this.#storeImpulse(body, impulse, ImpulseType.scalar);
        this.#storeImpulse(body, penetration.copy().negate(), ImpulseType.pseudo);

        const tangent = penetration.copy().normalize();
        const collision = tangent.copy().mul(new Vector2(box.width / 2, box.height / 2)).add(penetration).add(body.position);
        this.debug.addCollision(collision);
    }
}