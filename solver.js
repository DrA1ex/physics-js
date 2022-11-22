import {Vector2} from "./vector.js";
import {ImpulseType} from "./enum.js";
import * as Utils from "./utils.js";
import {Collision} from "./collision.js";
import {Body} from "./body.js";

/**
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
        collisions: [],
        collisionCount: 0
    }

    /** @type {Map<Constraint, Body>} */
    #constraintBodies = new Map();

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
        this.#constraintBodies.set(constraint, new Body(0, 0).setActive(false));
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
        this.stepInfo.collisions.splice(0);
        this.stepInfo.collisionCount = 0;

        if (this.stepInfo.delta === 0) {
            return;
        }

        this.#applyVelocity();

        this.#applyForces();
        this.#collectCollisions();

        for (const collision of this.stepInfo.collisions) {
            this.#processCollision(collision);
        }

        this.#applyImpulses();
    }

    #applyForces() {
        for (const force of this.forces) {
            for (const body of this.rigidBodies) {
                const {impulse, point, type} = force.impulse(this.stepInfo.delta, body);
                this.#storeImpulse(body, impulse, point, type);
            }
        }
    }

    #applyVelocity() {
        for (const body of this.rigidBodies) {
            if (body.active) {
                body.applyVelocity(body.velocity.scaled(this.stepInfo.delta), body.angularVelocity * this.stepInfo.delta);
                this.debug?.addVector(body.position, body.velocity, "red");
            } else {
                body.velocity.zero();
            }
        }
    }

    #collectCollisions() {
        for (let i = 0; i < this.rigidBodies.length; i++) {
            const body1 = this.rigidBodies[i];
            for (const constraint of this.constraints) {
                if (!body1.active) continue;
                const collision = constraint.processConstraint(body1);
                if (collision.result) {
                    this.stepInfo.collisions.push(collision);
                }
            }

            for (let j = i + 1; j < this.rigidBodies.length; j++) {
                const body2 = this.rigidBodies[j];

                if (!body1.active && !body2.active) continue;
                if (body1.collider.detectCollision(body2)) {
                    this.stepInfo.collisions.push(body1.collider.collision);
                }
            }
        }

        this.stepInfo.collisionCount = this.stepInfo.collisions.length;
    }

    #applyImpulses() {
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
     * @param {Collision} collision
     */
    #processCollision(collision) {
        this.debug?.addPoint(collision.aContact);
        this.debug?.addVector(collision.aContact, collision.tangent.scaled(-collision.overlap), "violet");

        const body1 = collision.bBody;
        const body2 = collision.aBody;
        const b1Delta = collision.bContact.delta(body1.position);
        const b2Delta = collision.aContact.delta(body2.position);
        const normal = collision.tangent;
        const tangent = normal.perpendicular();

        const {normalMass, tangentMass, velocityDelta} = this.#calcCollisionInfo(body1, body2, b1Delta, b2Delta, normal, tangent);
        const restitution = body1.restitution * body2.restitution;
        const friction = Math.sqrt(body1.friction * body2.friction);

        const normalVelocity = Math.min(0, normal.dot(velocityDelta));
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
}