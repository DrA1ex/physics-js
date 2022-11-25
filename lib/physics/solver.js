import {Vector2} from "../utils/vector.js";
import * as Utils from "../utils/common.js";
import {Collision} from "./collision.js";
import {Body} from "./body.js";

/**
 * @typedef {{velocity: Vector2, position: Vector2, angularVelocity: number, angle: number}} AccumulatedParameters
 *
 * @typedef {{collision: Collision, b1Delta: Vector2, b2Delta: Vector2,normal: Vector2,
 *           tangent: Vector2, normalMass: number, tangentMass: number, friction: number,
 *           normalImpulse: number, tangentImpulse: number, bias: number, restitutionBias: number}} CollisionInfo
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
        /** @type {Collision[]} */
        collisions: [],
        collisionCount: 0
    }

    /** @type {Map<Constraint, Body>} */
    #constraintBodies = new Map();
    /** @type {CollisionInfo[]} */
    #collisionInfos = [];
    /** @type {Map<string, CollisionInfo>} */
    #prevCollisionInfo = new Map();

    steps = 6;
    warming = true;
    velocityBiasFactor = 0.2;
    positionCorrectionBeta = 0.5;
    allowedOverlap = 1;

    velocityPositionCorrection = true;
    positionCorrection = true;

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
        this.#collisionInfos.splice(0);
        this.stepInfo.collisionCount = 0;

        if (this.stepInfo.delta === 0) {
            return;
        }

        this.#applyVelocity();
        this.#applyForces();
        this.#collectCollisions();

        if (this.positionCorrection && this.positionCorrectionBeta > 0) {
            for (const info of this.#collisionInfos) {
                this.#correctPosition(info);
            }
        }

        if (this.warming) {
            for (const collisionInfo of this.#collisionInfos) {
                const {normalImpulse, tangentImpulse, normal, tangent, collision} = collisionInfo;
                const body2 = collision.aBody;
                const body1 = collision.bBody;

                const impulse = normal.scaled(normalImpulse).add(tangent.scaled(tangentImpulse));
                body1.applyImpulse(impulse.negated(), collision.bContact);
                body2.applyImpulse(impulse, collision.aContact);

                if (this.debug?.showWarmVector) {
                    this.debug.addVector(collision.bContact, impulse.negated().scale(collision.bBody.invertedMass), "chartreuse");
                    this.debug.addVector(collision.aContact, impulse.scaled(collision.aBody.invertedMass), "chartreuse");
                }
            }
        }

        for (let i = 0; i < this.steps; i++) {
            for (const info of this.#collisionInfos) {
                this.#processCollision(info);
            }
        }

        if (this.warming) {
            this.#prevCollisionInfo.clear();
            for (const collisionInfo of this.#collisionInfos) {
                this.#prevCollisionInfo.set(this.#calcCollisionId(collisionInfo.collision), collisionInfo);
            }
        }

        if (this.debug) {
            for (const info of this.#collisionInfos) {
                if (this.debug.showNormalVector) {
                    const normalVector = info.normal.scaled(info.normalImpulse);
                    this.debug.addVector(info.collision.aContact, normalVector.scaled(info.collision.aBody.invertedMass), "blue");
                    this.debug.addVector(info.collision.bContact, normalVector.negated().scale(info.collision.bBody.invertedMass), "blue");
                }

                if (this.debug.showTangentVector) {
                    const tangentVector = info.tangent.scaled(info.tangentImpulse);
                    this.debug.addVector(info.collision.aContact, tangentVector.scaled(info.collision.aBody.invertedMass), "orange");
                    this.debug.addVector(info.collision.bContact, tangentVector.negated().scale(info.collision.bBody.invertedMass), "orange");
                }
            }
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

                if (this.debug?.showVelocityVector) {
                    this.debug.addVector(body.position, body.velocity, "red");
                }
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
                if (collision.result) this.stepInfo.collisions.push(collision);
            }

            for (let j = i + 1; j < this.rigidBodies.length; j++) {
                const body2 = this.rigidBodies[j];

                if (!body1.active && !body2.active) continue;
                if (body1.collider.detectCollision(body2)) {
                    this.stepInfo.collisions.push(body1.collider.collision);
                }
            }
        }

        for (const collision of this.stepInfo.collisions) {
            this.#collisionInfos.push(this.#prepareCollisionInfo(collision));
        }

        this.stepInfo.collisionCount = this.stepInfo.collisions.length;
    }

    /**
     * @param {Collision} collision
     * @return {CollisionInfo}
     */
    #prepareCollisionInfo(collision) {
        const body1 = collision.bBody;
        const body2 = collision.aBody;
        const b1Delta = collision.bContact.delta(body1.position);
        const b2Delta = collision.aContact.delta(body2.position);
        const normal = collision.tangent;
        const tangent = normal.perpendicular();

        const {normalMass, tangentMass} = this.#calcMasses(body1, body2, b1Delta, b2Delta, normal, tangent);

        const friction = Math.sqrt(body1.friction * body2.friction);

        let bias = 0;
        if (this.velocityPositionCorrection && this.velocityBiasFactor > 0) {
            bias = this.velocityBiasFactor * Math.max(0, collision.overlap - this.allowedOverlap) / this.stepInfo.delta
        }

        const velocityDelta = this.#calcVelocityDelta(b1Delta, b2Delta, body1, body2);
        const restitution = body1.restitution * body2.restitution;
        const restitutionBias = restitution * normal.dot(velocityDelta)

        let normalImpulse = 0, tangentImpulse = 0;
        if (this.warming) {
            const prevCollisionInfo = this.#prevCollisionInfo.get(this.#calcCollisionId(collision))
            if (prevCollisionInfo) {
                normalImpulse = prevCollisionInfo.normalImpulse;
                tangentImpulse = prevCollisionInfo.tangentImpulse;
            }
        }

        return {
            collision,
            b1Delta, b2Delta,
            normal, tangent,
            normalMass, tangentMass, friction,
            restitutionBias, bias, normalImpulse, tangentImpulse,
            initialVelocityDelta: velocityDelta
        };
    }

    /**
     * @param {CollisionInfo} collisionInfo
     */
    #processCollision(collisionInfo) {
        const {collision} = collisionInfo;

        this.debug?.addPoint(collision.aContact);
        if (this.debug?.showContactVector) {
            this.debug?.addVector(collision.aContact, collision.tangent.scaled(-collision.overlap), "violet");
        }

        this.#applyNormalImpulse(collisionInfo);
        this.#applyTangentImpulse(collisionInfo);
    }

    /**
     * @param {CollisionInfo} collisionInfo
     */
    #applyNormalImpulse(collisionInfo) {
        const {b1Delta, b2Delta, normal, normalMass, bias, collision, restitutionBias} = collisionInfo;
        const body2 = collision.aBody;
        const body1 = collision.bBody;

        const velocityDelta = this.#calcVelocityDelta(b1Delta, b2Delta, body1, body2);
        const impulseDelta = (normal.dot(velocityDelta) - bias + restitutionBias) / normalMass;
        const normalImpulse = this.#calcNormalImpulse(collisionInfo, impulseDelta);

        body1.applyImpulse(normalImpulse.negated(), collision.bContact);
        body2.applyImpulse(normalImpulse, collision.aContact);
    }

    /**
     * @param {CollisionInfo} collisionInfo
     */
    #applyTangentImpulse(collisionInfo) {
        const {b1Delta, b2Delta, tangent, tangentMass, collision,} = collisionInfo;
        const body2 = collision.aBody;
        const body1 = collision.bBody;


        const velocityDelta = this.#calcVelocityDelta(b1Delta, b2Delta, body1, body2);
        let impulseDelta = tangent.dot(velocityDelta) / tangentMass;
        const tangentImpulse = this.#calcTangentImpulse(collisionInfo, impulseDelta);

        body1.applyImpulse(tangentImpulse.negated(), collision.bContact);
        body2.applyImpulse(tangentImpulse, collision.aContact);
    }

    #calcNormalImpulse(collisionInfo, impulseDelta) {
        const lastImpulse = collisionInfo.normalImpulse;
        collisionInfo.normalImpulse = Math.min(0, lastImpulse + impulseDelta);
        impulseDelta = collisionInfo.normalImpulse - lastImpulse;

        return collisionInfo.normal.scaled(impulseDelta);
    }

    #calcTangentImpulse(collisionInfo, impulseDelta) {
        const maxFriction = -collisionInfo.normalImpulse * collisionInfo.friction;
        const lastImpulse = collisionInfo.tangentImpulse;
        collisionInfo.tangentImpulse = Utils.clamp(-maxFriction, maxFriction, impulseDelta + collisionInfo.tangentImpulse);
        impulseDelta = collisionInfo.tangentImpulse - lastImpulse;

        return collisionInfo.tangent.scaled(impulseDelta);
    }

    /**
     * @param {CollisionInfo} collisionInfo
     */
    #correctPosition(collisionInfo) {
        const {normal, collision} = collisionInfo;
        const body2 = collision.aBody;
        const body1 = collision.bBody;

        const correction = Math.max(0, collision.overlap * this.positionCorrectionBeta - this.allowedOverlap);
        if (body1.active && body2.active) {
            const totalMass = (body1.mass + body2.mass);
            body1.applyPseudoImpulse(normal.scaled(correction * body2.mass / totalMass), collision.bContact);
            body2.applyPseudoImpulse(normal.scaled(-correction * body1.mass / totalMass), collision.aContact);
        } else if (body1.active) {
            body1.applyPseudoImpulse(normal.scaled(correction), collision.bContact);
        } else {
            body2.applyPseudoImpulse(normal.scaled(-correction), collision.aContact);
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

    /**
     * @param {Collision} collision
     * @return {string}
     */
    #calcCollisionId(collision) {
        const {aBody, bBody} = collision;
        if (aBody.id < bBody.id) {
            return `${aBody.id}_${bBody.id}`;
        }

        return `${bBody.id}_${aBody.id}`;
    }
}