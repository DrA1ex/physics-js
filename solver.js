import {Vector2} from "./vector.js";
import {ConstraintType, ImpulseType} from "./enum.js";
import * as Utils from "./utils.js";

/**
 * @typedef {{type: ConstraintType}} ConstraintBase
 * @typedef {ConstraintBase & {box: BoundaryBox, damper: Vector2}} InsetConstraint
 *
 * @typedef {InsetConstraint} Constraint
 *
 * @typedef {{velocity: Vector2, position: Vector2, angularVelocity: number, angle: number}} AccumulatedParameters
 */

export class ImpulseBasedSolver {
    /** @type {Body[]} */
    rigidBodies = [];
    /** @type {Constraint[]} */
    constraints = [];
    /** @type {IForce[]} */
    forces = [];

    stepInfo = {
        delta: 0,
        /** @type {Map<Body, AccumulatedParameters>}*/
        accumulatedInfo: new Map(),
        collisionCount: 0
    }

    constructor() {
        this.debug = window.__app?.DebugInstance;
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
     * @param {IForce} force
     */
    addForce(force) {
        this.forces.push(force);
    }

    /**
     * @param {number} delta
     */
    solve(delta) {
        this.debug?.reset();
        this.stepInfo.delta = Math.max(0, Math.min(0.1, delta));
        this.stepInfo.accumulatedInfo.clear();
        this.stepInfo.collisionCount = 0;

        if (this.stepInfo.delta === 0) {
            return;
        }

        for (const body of this.rigidBodies) {
            if (!body.active) {
                body.velocity.zero();
                continue;
            }

            body.applyVelocity(body.velocity.scaled(this.stepInfo.delta), body.angularVelocity * this.stepInfo.delta);
            //TODO: implement friction
            body.angularVelocity *= 0.99;

            this.debug?.addVector(body.position, body.velocity, "red");
        }

        // Forces
        for (const force of this.forces) {
            for (const body of this.rigidBodies) {
                const {impulse, point, type} = force.impulse(this.stepInfo.delta, body);
                this.#storeImpulse(body, impulse, point, type);
            }
        }

        this.step();

        for (const body of this.rigidBodies) {
            if (this.stepInfo.accumulatedInfo.has(body)) {
                const {velocity, position, angularVelocity, angle} = this.stepInfo.accumulatedInfo.get(body);
                body.velocity.add(velocity);
                body.position.add(position);
                body.angularVelocity += angularVelocity;
                body.angle += angle;

                this.debug?.addVector(body.position, velocity);
            }
        }
    }

    step() {
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
     * @param {Vector2} point
     * @param {ImpulseType} [type=ImpulseType.regular]
     */
    #storeImpulse(body, impulse, point, type = ImpulseType.regular) {
        if (!body.active) {
            return;
        }

        if (!this.stepInfo.accumulatedInfo.has(body)) {
            this.stepInfo.accumulatedInfo.set(body, {velocity: new Vector2(), position: new Vector2(), angularVelocity: 0, angle: 0});
        }

        const info = this.stepInfo.accumulatedInfo.get(body);
        const angularImpulse = point.delta(body.position).cross(impulse);

        switch (type) {
            case ImpulseType.regular:
                info.velocity.add(impulse.scaled(body.invertedMass));
                info.angularVelocity += angularImpulse * body.invertedInertia;
                break;

            case ImpulseType.scalar:
                info.velocity.add(impulse);
                info.angularVelocity += angularImpulse;
                break;

            case ImpulseType.pseudo:
                info.position.add(impulse);
                info.angle += angularImpulse * body.invertedInertia;
                break;
        }
    }

    /**
     * @param {Body} body1
     * @param {Body} body2
     */
    #processCollision(body1, body2) {
        if (!body1.active && !body2.active) return;
        if (!body1.collider.detectCollision(body2)) return;

        const collision = body1.collider.collision;
        this.stepInfo.collisionCount += 1;
        this.debug?.addPoint(collision.aContact);
        this.debug?.addVector(collision.aContact, collision.tangent.scaled(-collision.overlap), "violet");

        const b1Delta = collision.bContact.delta(body1.position);
        const b2Delta = collision.aContact.delta(body2.position);
        const normal = collision.tangent;
        const tangent = normal.perpendicular();

        const {normalMass, tangentMass, velocityDelta} = this.#calcCollisionInfo(body1, body2, b1Delta, b2Delta, normal, tangent);
        const restitution = body1.restitution * body2.restitution;
        const friction = Math.sqrt(body1.friction * body2.friction);

        const normalVelocity = normal.dot(velocityDelta);
        const normalImpulse = normal.scaled((1 + restitution) * normalVelocity / normalMass);
        this.#storeImpulse(body1, normalImpulse.negated(), collision.bContact);
        this.#storeImpulse(body2, normalImpulse, collision.aContact);

        const maxFriction = Math.abs(normalVelocity) * friction;
        const tangentVelocity = Utils.clamp(-maxFriction, maxFriction, tangent.dot(velocityDelta));
        const tangentImpulse = tangent.scaled(tangentVelocity / tangentMass);
        this.#storeImpulse(body1, tangentImpulse.negated(), collision.bContact);
        this.#storeImpulse(body2, tangentImpulse, collision.aContact);

        if (body1.active && body2.active) {
            const totalMass = (body1.mass + body2.mass);
            this.#storeImpulse(body1, collision.tangent.scaled(collision.overlap * body2.mass / totalMass), collision.bContact, ImpulseType.pseudo);
            this.#storeImpulse(body2, collision.tangent.scaled(-collision.overlap * body1.mass / totalMass), collision.aContact, ImpulseType.pseudo);
        } else if (body1.active) {
            this.#storeImpulse(body1, collision.tangent.scaled(collision.overlap), collision.bContact, ImpulseType.pseudo);
        } else {
            this.#storeImpulse(body2, collision.tangent.scaled(-collision.overlap), collision.aContact, ImpulseType.pseudo);
        }
    }

    #calcCollisionInfo(body1, body2, b1Delta, b2Delta, normal, tangent) {
        return {
            normalMass: this.#calcEffectiveMass(b1Delta, b2Delta, normal, body1, body2),
            tangentMass: this.#calcEffectiveMass(b1Delta, b2Delta, tangent, body1, body2),
            velocityDelta: this.#calcVelocityDelta(b1Delta, b2Delta, body1, body2)
        }
    }

    #calcEffectiveMass(b1Delta, b2Delta, tangent, body1, body2) {
        const b1Moment = b1Delta.cross(tangent);
        const b2Moment = b2Delta.cross(tangent);

        return body1.invertedMass + body2.invertedMass +
            Math.pow(b1Moment, 2) * body1.invertedInertia +
            Math.pow(b2Moment, 2) * body2.invertedInertia;
    }

    #calcVelocityDelta(b1Delta, b2Delta, body1, body2) {
        const b1TotalVelocity = b1Delta.crossScalar(body1.angularVelocity).add(body1.velocity);
        const b2TotalVelocity = b2Delta.crossScalar(body2.angularVelocity).add(body2.velocity);
        return b1TotalVelocity.delta(b2TotalVelocity);
    }

    /**
     * @param {Body} body
     * @param {Constraint} constraint
     */
    #processConstraint(body, constraint) {
        if (!body.active) {
            return;
        }

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

        const tangent = penetration.normalized();
        const collision = tangent.copy().mul(new Vector2(box.width / 2, box.height / 2)).add(penetration).add(body.position);

        this.#storeImpulse(body, impulse, collision, ImpulseType.scalar);
        this.#storeImpulse(body, penetration.negated(), body.position, ImpulseType.pseudo);

        this.debug?.addPoint(collision);
    }
}