import {Collider, ColliderType, ColliderTypeOrder} from "./base.js";
import {NoCollision} from "../common/collision.js";
import * as GeomUtils from "../../utils/geom.js";
import * as CollisionUtils from "../../utils/collision.js";
import * as SatUtils from "../../utils/sat.js";

export class PolygonCollider extends Collider {
    get order() {return ColliderTypeOrder.poly;}
    get type() {return ColliderType.poly;}

    /**
     * @param {Body|PolygonBody} body2
     * @return {Collision}
     */
    detectCollision(body2) {
        const body1 = this.body;

        if (!GeomUtils.isBoundaryCollide(body1.boundary, body2.boundary)) {
            return NoCollision;
        }

        const polyCollision = SatUtils.detectPolygonCollision(body1, body2);
        if (!polyCollision.result) {
            return NoCollision;
        }

        const collisionInfo = polyCollision.collision;

        let points1, points2;
        if (collisionInfo.body === body1) {
            points1 = collisionInfo.points2;
            points2 = collisionInfo.points1;
        } else {
            points1 = collisionInfo.points1;
            points2 = collisionInfo.points2;
        }

        const normal = collisionInfo.body === body2 ?
            CollisionUtils.alignNormal(body1, body2, collisionInfo.normal) :
            CollisionUtils.alignNormal(body2, body1, collisionInfo.normal);

        let collisionA = CollisionUtils.getCollisionPoint(points1, normal);
        let collisionB = collisionA.delta(normal.scaled(collisionInfo.overlap));

        const pointAContained = GeomUtils.getProjectionIntersectionInfo(normal.perpendicular(), [collisionA], points2);
        if (!pointAContained.result) {
            const centralTangent = body2.position.tangent(body1.position);
            const alternativeCollision = CollisionUtils.getCollisionPoint(points2, centralTangent);
            collisionA = alternativeCollision.delta(normal.scaled(-collisionInfo.overlap));
            collisionB = alternativeCollision;
        }

        if (collisionInfo.body !== body1) {
            [collisionA, collisionB] = [collisionB, collisionA];
        }

        return CollisionUtils.createCollision(collisionA, collisionB, collisionInfo.overlap);
    }
}