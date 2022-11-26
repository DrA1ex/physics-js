import {Vector2} from "../utils/vector.js";
import {Collision} from "./collision.js";
import {Body} from "./body.js";

/**
 * @readonly
 * @enum {number}
 */
export const ConstraintType = {
    inset: 0,
}

/**
 * @abstract
 */
export class Constraint {
    /** @type{ConstraintType} **/
    type;
    /** @type{Body} */
    constraintBody;

    constructor(type) {
        this.type = type;
        this.constraintBody = new Body(0, 0).setActive(false)
    }

    /**
     * @abstract
     * @param {Body} body
     * @return {Collision}
     */
    processConstraint(body) {}
}

export class InsetConstraint extends Constraint {
    /** @type{BoundaryBox} */
    box;

    /**
     * @param {BoundaryBox} box
     * @param {number} [friction=0.2]
     * @param {number} [restitution=0.5]
     */
    constructor(box, friction = 0.2, restitution = 0.5) {
        super(ConstraintType.inset);

        this.box = box;
        this.constraintBody.setFriction(friction);
        this.constraintBody.setRestitution(restitution);
    }

    processConstraint(body) {
        const cBox = this.box;
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
            return new Collision(false);
        }

        const tangent = penetration.normalized();
        const contact = tangent.copy().mul(new Vector2(box.width / 2, box.height / 2)).add(penetration).add(body.position);

        const result = new Collision(true);
        result.tangent = tangent;
        result.aContact = contact;
        result.bContact = contact;
        result.aBody = body;
        result.bBody = this.constraintBody;
        result.overlap = penetration.dot(tangent);

        return result;
    }
}