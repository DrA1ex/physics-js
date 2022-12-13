import {Collider, ColliderType, ColliderTypeOrder} from "./base.js";
import {PolygonCollider} from "./poly.js";

export class RectCollider extends PolygonCollider {
    get order() {return ColliderTypeOrder.rect;}
    get type() {return ColliderType.rect;}

    detectCollision(body2) {
        const body1 = this.body;

        if (body2.collider.type === ColliderType.rect && body1.angle === 0 && body2.angle === 0) {
            return Collider.detectBoundaryCollision(body1.boundary, body2.boundary);
        }

        return super.detectCollision(body2);
    }
}