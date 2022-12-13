import {PolygonCollider} from "./poly.js";
import {NoCollision} from "../common/collision.js";
import * as GeomUtils from "../../utils/geom.js";
import * as CollisionUtils from "../../utils/collision.js";
import {ColliderType, ColliderTypeOrder} from "./base.js";

export class LineCollider extends PolygonCollider {
    get order() {return ColliderTypeOrder.line;}
    get type() {return ColliderType.line;}

    detectCollision(body2) {
        const body1 = this.body;

        if (!GeomUtils.isBoundaryCollide(body1.boundary, body2.boundary)) {
            return NoCollision;
        }

        const points1 = body1.points;
        const points2 = body2.points;
        const normalProjection = points1[0].delta(points1[1]).normal();
        const parallelProjection = normalProjection.perpendicular();

        const hasCollision = GeomUtils.getProjectionIntersectionInfo(normalProjection, points1, points2).result
            && GeomUtils.getProjectionIntersectionInfo(parallelProjection, points1, points2).result;

        if (!hasCollision) {
            return NoCollision;
        }

        const normalAlign = CollisionUtils.alignNormal(body2, body1, normalProjection);
        const normalOrigin = CollisionUtils.getCollisionPoint(points2, normalAlign);
        const normalOverlap = normalAlign.dot(normalOrigin.delta(body1.position));

        const parallelAxisAlign = CollisionUtils.alignNormal(body2, body1, parallelProjection);
        const parallelAxisOrigin = CollisionUtils.getCollisionPoint(points2, parallelAxisAlign);
        const parallelAxisClosest = CollisionUtils.getCollisionPoint(points1, parallelAxisAlign.negated());
        const parallelAxisOverlap = parallelAxisAlign.dot(parallelAxisOrigin.delta(parallelAxisClosest));

        let normal, collisionA, overlap;
        if (normalOverlap < parallelAxisOverlap) {
            normal = normalAlign;
            collisionA = normalOrigin;
            overlap = normalOverlap;
        } else {
            normal = parallelAxisAlign;
            collisionA = parallelAxisOrigin;
            overlap = parallelAxisOverlap;
        }

        const collisionB = collisionA.delta(normal.scaled(overlap));
        return CollisionUtils.createCollision(collisionA, collisionB, overlap);
    }
}