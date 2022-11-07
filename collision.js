import {Vector2} from "./vector.js";

export class Collider {
    body = null;
    collision = null;

    constructor(body) {
        this.body = body;
    }

    /**
     * @abstract
     * @param body
     * @return {boolean}
     */
    detectCollision(body) {
        this.collision = {result: false};
        return false;
    }

    /**
     * @abstract
     * @param body
     */
    collide(body) {
        this.collision = {result: false};
    }
}

export class RectCollider extends Collider {
    constructor(body) {
        super(body);
    }


    detectCollision(body) {
        const box1 = this.body.boundary;
        const box2 = body.boundary;

        const result = this.#checkRange(box1.left, box1.right, box2.left, box2.right)
            && this.#checkRange(box1.top, box1.bottom, box2.top, box2.bottom);

        this.collision = {result};
        return result;
    }

    collide(body) {
    }

    #checkRange(start1, end1, start2, end2) {
        return end1 >= start2 && start1 <= end2;
    }
}

export class CircleCollider extends RectCollider {
    constructor(body) {
        super(body);
    }

    detectCollision(body) {
        if (super.detectCollision(body)) {
            const delta = this.body.position.copy().sub(body.position);
            const centerDistance = this.body.radius + body.radius;
            const collisionSizeSq = Math.pow(centerDistance, 2);

            const distSquare = delta.dot(delta);
            let result = false;
            if (distSquare <= collisionSizeSq) {
                result = true;
            }

            this.collision = {result, distSquare, delta, centerDistance};
        }

        return this.collision.result;
    }

    collide(body) {
        if (!this.detectCollision(body))
            return;

        const {delta, distSquare, centerDistance} = this.collision;
        const velocity1 = this.#collide(delta, distSquare, this.body, body);
        const velocity2 = this.#collide(delta.copy().negate(), distSquare, body, this.body);

        this.body.velocity.add(velocity1);
        body.velocity.add(velocity2);

        window.__app.DebugInstance.addForce(this.body.position, velocity1);
        window.__app.DebugInstance.addForce(body.position, velocity2);

        const angle = Math.atan2(delta.y, delta.x);
        this.body.pseudoVelocity.add(new Vector2(Math.cos(angle), Math.sin(angle)).scale(centerDistance)).sub(delta);
    }

    #collide(delta, distSquare, b1, b2) {
        const massFactor = (2 * b2.mass) / (b1.mass + b2.mass);
        return delta.copy().scale(-massFactor * b1.velocity.copy().sub(b2.velocity).dot(delta) / distSquare);
    }
}