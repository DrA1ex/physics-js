import {Vector2} from "../utils/vector.js";
import * as Utils from "../utils/common.js";
import {Collision} from "./collision.js";
import {Body} from "./body.js";

/**
 * @typedef {{velocity: Vector2, position: Vector2, angularVelocity: number, angle: number}} AccumulatedParameters
 *
 * @typedef {{collision: Collision, b1Delta: Vector2, b2Delta: Vector2,normal: Vector2,
 *           tangent: Vector2, normalMass: number, tangentMass: number,
 *           normalImpulse: number, tangentImpulse: number}} CollisionInfo
 */

export class ImpulseBasedSolver {
    /** @type {Debug} */
    debug;
    /** @type {Body[]} */
    rigidBodies = [];
    /** @type {Constraint[]} */
    constraints = [];
    /** @type {IForce[]} */
    forces = [];

    stepInfo = {
        delta: 0,
        collisions: [],
        collisionCount: 0
    }

    /** @type {Map<Constraint, Body>} */
    #constraintBodies = new Map();

    velocitySteps = 6;
    allowedOverlap = 1;

    /**
     * @param {Debug} debug
     */
    setDebugger(debug) {
        this.debug = debug;
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
        this.stepInfo.collisions.splice(0);
        this.stepInfo.collisionCount = 0;

        if (this.stepInfo.delta === 0) {
            return;
        }

        this.#applyVelocity();
        this.#applyForces();
        this.#collectCollisions();

        for (let i = 0; i < this.velocitySteps; i++) {
            for (const collision of this.stepInfo.collisions) {
                this.#processCollision(collision);
            }
        }

        for (const collision of this.stepInfo.collisions) {
            this.#solvePosition(collision);
        }
    }

    #applyForces() {
        for (const force of this.forces) {
            for (const body of this.rigidBodies) {
                const {impulse, point} = force.impulse(this.stepInfo.delta, body);
                body.applyImpulse(impulse, point);
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
                    this.stepInfo.collisions.push(this.#prepareCollisionInfo(collision));
                }
            }

            for (let j = i + 1; j < this.rigidBodies.length; j++) {
                const body2 = this.rigidBodies[j];

                if (!body1.active && !body2.active) continue;
                if (body1.collider.detectCollision(body2)) {
                    this.stepInfo.collisions.push(this.#prepareCollisionInfo(body1.collider.collision));
                }
            }
        }

        this.stepInfo.collisionCount = this.stepInfo.collisions.length;
    }

    /**
     * @param {Collision} collision
     */
    #prepareCollisionInfo(collision) {
        const body1 = collision.bBody;
        const body2 = collision.aBody;
        const b1Delta = collision.bContact.delta(body1.position);
        const b2Delta = collision.aContact.delta(body2.position);
        const normal = collision.tangent;
        const tangent = normal.perpendicular();

        const {normalMass, tangentMass} = this.#calcMasses(body1, body2, b1Delta, b2Delta, normal, tangent);

        return {
            collision,
            b1Delta, b2Delta,
            normal, tangent,
            normalMass, tangentMass,
            normalImpulse: 0, tangentImpulse: 0
        };
    }

    /**
     * @param {CollisionInfo} collisionInfo
     */
    #processCollision(collisionInfo) {
        const {collision} = collisionInfo;

        this.debug?.addPoint(collision.aContact);
        this.debug?.addVector(collision.aContact, collision.tangent.scaled(-collision.overlap), "violet");

        this.#applyNormalImpulse(collisionInfo);
        this.#applyTangentImpulse(collisionInfo);
    }

    /**
     * @param {CollisionInfo} collisionInfo
     */
    #applyNormalImpulse(collisionInfo) {
        const {
            b1Delta, b2Delta,
            normal, normalMass,
            collision,
        } = collisionInfo;

        const body2 = collision.aBody;
        const body1 = collision.bBody;
        const restitution = body1.restitution * body2.restitution;
        const velocityDelta = this.#calcVelocityDelta(b1Delta, b2Delta, body1, body2);

        const normalVelocity = Math.min(0, normal.dot(velocityDelta));
        let impulseDelta = (1 + restitution) * normalVelocity / normalMass;

        const newImpulse = impulseDelta + collisionInfo.normalImpulse;
        impulseDelta = newImpulse - collisionInfo.normalImpulse;
        collisionInfo.normalImpulse = newImpulse;

        const normalImpulse = normal.scaled(impulseDelta);
        body1.applyImpulse(normalImpulse.negated(), collision.bContact);
        body2.applyImpulse(normalImpulse, collision.aContact);
    }

    /**
     * @param {CollisionInfo} collisionInfo
     */
    #applyTangentImpulse(collisionInfo) {
        const {
            b1Delta, b2Delta,
            tangent, tangentMass,
            collision,
        } = collisionInfo;

        const body2 = collision.aBody;
        const body1 = collision.bBody;
        const friction = Math.sqrt(body1.friction * body2.friction);
        const velocityDelta = this.#calcVelocityDelta(b1Delta, b2Delta, body1, body2);

        const tangentVelocity = tangent.dot(velocityDelta);
        let impulseDelta = tangentVelocity / tangentMass;

        const maxFriction = -collisionInfo.normalImpulse * friction;
        const newImpulse = Utils.clamp(-maxFriction, maxFriction, impulseDelta + collisionInfo.tangentImpulse);
        impulseDelta = newImpulse - collisionInfo.tangentImpulse;
        collisionInfo.tangentImpulse = newImpulse;

        const tangentImpulse = tangent.scaled(impulseDelta);
        body1.applyImpulse(tangentImpulse.negated(), collision.bContact);
        body2.applyImpulse(tangentImpulse, collision.aContact);
    }

    /**
     * @param {CollisionInfo} collisionInfo
     */
    #solvePosition(collisionInfo) {
        const {collision} = collisionInfo;
        const body2 = collision.aBody;
        const body1 = collision.bBody;

        const overlap = Math.max(0, collision.overlap - this.allowedOverlap);
        if (body1.active && body2.active) {
            const totalMass = (body1.mass + body2.mass);
            body1.applyPseudoImpulse(collision.tangent.scaled(overlap * body2.mass / totalMass), collision.bContact);
            body2.applyPseudoImpulse(collision.tangent.scaled(-overlap * body1.mass / totalMass), collision.aContact);
        } else if (body1.active) {
            body1.applyPseudoImpulse(collision.tangent.scaled(overlap), collision.bContact);
        } else {
            body2.applyPseudoImpulse(collision.tangent.scaled(-overlap), collision.aContact);
        }
    }

    #calcMasses(body1, body2, b1Delta, b2Delta, normal, tangent) {
        return {
            normalMass: this.#calcEffectiveMass(b1Delta, b2Delta, normal, body1, body2),
            tangentMass: this.#calcEffectiveMass(b1Delta, b2Delta, tangent, body1, body2),
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