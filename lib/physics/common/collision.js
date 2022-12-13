import {Vector2} from "../../utils/vector.js";

export class CollisionInfo {
    collision = null;
    b1Delta = new Vector2();
    b2Delta = new Vector2();
    normal = new Vector2();
    tangent = new Vector2();
    initialVelocityDelta = new Vector2();

    normalMass = 0;
    tangentMass = 0;
    friction = 0;
    restitutionBias = 0;
    bias = 0;
    normalImpulse = 0;
    tangentImpulse = 0;

}

export class Collision {
    result = false;

    /**@type{Vector2}*/
    tangent = null;
    /**@type{Vector2}*/
    aContact = null;
    /**@type{Vector2}*/
    bContact = null;

    /**@type{Body}*/
    aBody = null;
    /**@type{Body}*/
    bBody = null;

    overlap = 0;

    constructor(result) {
        this.result = result;
    }
}

export const NoCollision = new Collision(false);