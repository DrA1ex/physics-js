import {Vector2} from "./vector.js";
import * as Utils from "./utils.js";
import {Body, BoundaryBox, CirceBody, RectBody} from "./body.js";

export class Collision {
    result = false;
    distance = 0;

    /**@type{Vector2}*/
    delta = null;
    /**@type{Vector2}*/
    aContact = null;
    bContact = null;
    /**@type{Vector2}*/
    tangent = null;
    /**@type{Vector2}*/
    penetration = null;

    constructor(result = false) {
        this.result = result;
    }
}

export class Collider {
    /**@type {BodyType} */
    body = null;
    /**@type {Collision} */
    collision = null;

    constructor(body) {
        this.body = body;
    }

    /**
     * @param {Body} body2
     * @return {boolean}
     */
    detectCollision(body2) {
        const body1 = this.body
        if (body1 instanceof CirceBody && body2 instanceof CirceBody) {
            this.collision = CircleCollider.detectCollision(body1, body2);
        } else if (body1 instanceof CirceBody) {
            this.collision = CircleCollider.detectCollision(body1, body2);
        } else if (body2 instanceof CirceBody) {
            this.collision = CircleCollider.detectCollision(body2, body1);
            this.collision.penetration?.negate();
        } else if (body1 instanceof RectBody) {
            this.collision = RectCollider.detectCollision(body1, body2);
        } else if (body2 instanceof RectBody) {
            this.collision = RectCollider.detectCollision(body2, body1);
            this.collision.penetration?.negate();
        } else {
            this.collision = Collider.detectBoundaryCollision(body1.boundary, body2.boundary);
        }

        return this.collision.result;
    }

    static detectBoundaryCollision(box1, box2) {
        const result = Utils.isRangeIntersects(box1.left, box1.right, box2.left, box2.right) &&
            Utils.isRangeIntersects(box1.top, box1.bottom, box2.top, box2.bottom);

        if (result) {
            const collision = new Collision(true);

            const delta = box1.center.delta(box2.center);
            const tangent = delta.normalized();
            const contact1 = Utils.getBoxPoint(tangent, box2).add(box2.center);
            const contact2 = Utils.getBoxPoint(tangent.negated(), box1).add(box1.center);

            collision.delta = delta;
            collision.distance = delta.length();
            collision.tangent = Utils.getSideNormal(contact1, box2);

            collision.aContact = contact1;
            collision.bContact = contact2;
            collision.penetration = contact1.delta(contact2);

            return collision;
        }

        return new Collision(false);
    }

    /**
     * @param {PolygonBody} poly1
     * @param {PolygonBody} poly2
     * @return {{result: boolean, collision: *}}
     */
    static detectPolygonCollision(poly1, poly2) {
        const points1 = poly1.points;
        const points2 = poly2.points;

        const testedNormals = new Set();
        let result = false;
        let minInterval = null;

        for (const [p1, p2, body] of [[points1, points2, poly1], [points2, points1, poly2]]) {
            const check = this.#detectPointsCollision(p1, p2, testedNormals);
            result ||= check.result;

            if (!result) {
                return {result: false, collision: null};
            }

            if (minInterval === null || check.overlap < minInterval.overlap) {
                minInterval = {...check, body};
            }
        }

        return {
            result: true,
            collision: {
                points1,
                points2,
                normal: minInterval.normal,
                origin: minInterval.origin,
                overlap: minInterval.overlap,
                body: minInterval.body
            }
        };
    }


    static detectPointWithPolygonCollision(point, polyPoints) {
        return this.#detectPointsCollision(polyPoints, [point], new Set()).result;
    }

    /***
     * @param {Array<Vector2>} points1
     * @param {Array<Vector2>} points2
     * @param {Set<string>} testedNormals
     * @return {*}
     */
    static #detectPointsCollision(points1, points2, testedNormals) {
        let minInterval = null;
        for (let i = 0; i < points1.length; i++) {
            const p1 = points1[i];
            const p2 = points1[(i + 1) % points1.length];
            const delta = p2.delta(p1);
            const normal = delta.normal();

            if (this.#isNormalAlreadyProcessed(normal, testedNormals)) {
                continue;
            }

            const check = this.#detectNormalCollision(normal, points1, points2);
            if (!check.result) {
                return {result: false};
            }

            if (minInterval === null || minInterval.overlap > check.overlap) {
                minInterval = {...check, normal, origin: delta.scaled(0.5).add(p1)};
            }
        }

        return {result: minInterval !== null, ...minInterval};
    }

    static #isNormalAlreadyProcessed(normal, testedNormals) {
        const normalKey = this.#getNormalKey(normal);
        if (testedNormals.has(normalKey)) {
            return true;
        }

        testedNormals.add(normalKey);
        return false;
    }

    static #getNormalKey(normal, fractionDigits = 7) {
        const clipped = normal.copy();
        if (normal.x !== 0) {
            clipped.x = Math.abs(clipped.x);
        } else {
            clipped.y = Math.abs(clipped.y);
        }

        return `${Math.abs(clipped.x).toFixed(fractionDigits)}_${Math.abs(clipped.y).toFixed(fractionDigits)}`;
    }

    static #detectNormalCollision(normal, points1, points2) {
        const i1 = this.#getProjectedInterval(normal, points1);
        const i2 = this.#getProjectedInterval(normal, points2);

        return {
            result: Utils.isRangeIntersects(i1.min, i1.max, i2.min, i2.max),
            overlap: Math.min(i1.max, i2.max) - Math.max(i1.min, i2.min)
        };
    }

    static #getProjectedInterval(normal, points) {
        let min = Number.POSITIVE_INFINITY, max = Number.NEGATIVE_INFINITY;
        for (const point of points) {
            const projected = normal.dot(point);

            if (projected < min) {
                min = projected;
            }

            if (projected > max) {
                max = projected;
            }
        }

        return {min, max};
    }
}

export class PolygonCollider extends Collider {
    /**
     * @param {PolygonBody} body1
     * @param {Body|PolygonBody} body2
     * @return {Collision}
     */
    static detectCollision(body1, body2) {
        const boundaryCollision = Collider.detectBoundaryCollision(body1.boundary, body2.boundary);
        if (!boundaryCollision.result) {
            return new Collision(false);
        }

        const polyCollision = Collider.detectPolygonCollision(body1, body2);
        if (!polyCollision.result) {
            return new Collision(false);
        }

        const collisionInfo = polyCollision.collision;

        const originTangent = collisionInfo.origin.delta(collisionInfo.body.position).normalized();
        const projectedOrigin = boundaryCollision.tangent.dot(originTangent);
        const projectedNormal = boundaryCollision.tangent.dot(collisionInfo.normal);

        const points = collisionInfo.body === body1 ? collisionInfo.points2 : collisionInfo.points1;
        const flipOrigin = collisionInfo.body === body1 ? projectedOrigin > 0 : projectedOrigin < 0;
        const flipNormal = collisionInfo.body === body1 ? projectedNormal < 0 : projectedOrigin > 0;
        const origin = flipOrigin ? collisionInfo.origin.rotated(Math.PI, collisionInfo.body.position) : collisionInfo.origin;
        const normal = flipNormal ? collisionInfo.normal.negated() : collisionInfo.normal;

        const candidates = PolygonCollider.#filterCollisionsCandidates(points, origin, normal)
        let collisionA = candidates.length === 2 ? candidates[1].delta(candidates[0]).scaled(0.5).add(candidates[0]) : candidates[0];
        let collisionB = collisionA.delta(normal.scaled(collisionInfo.overlap));

        const collision = new Collision(true);
        collision.delta = boundaryCollision.delta;
        collision.distance = boundaryCollision.distance;

        collision.aContact = collisionInfo.body === body1 ? collisionA : collisionB;
        collision.bContact = collisionInfo.body === body1 ? collisionB : collisionA;
        collision.tangent = collision.aContact.tangent(collision.bContact);
        collision.penetration = collision.tangent.scaled(collisionInfo.overlap);

        return collision;
    }

    static #filterCollisionsCandidates(points, origin, normal) {
        const originProjection = origin.dot(normal);
        let candidates, maxProj = Number.NEGATIVE_INFINITY;
        for (const point of points) {
            const proj = point.dot(normal);
            if (proj >= originProjection && proj > maxProj) {
                maxProj = proj;
                candidates = [point]
            } else if (proj === maxProj) {
                // noinspection JSUnusedAssignment
                candidates.push(point);
            }
        }

        return candidates;
    }
}

export class RectCollider extends PolygonCollider {
    constructor(body) {
        super(body);
    }

    static detectCollision(body1, body2) {
        if (body1 instanceof RectBody && body2 instanceof RectBody && body1.angle === 0 && body2.angle === 0) {
            return Collider.detectBoundaryCollision(body1.box, body2.box);
        }

        return super.detectCollision(body1, body2);
    }
}

export class CircleCollider extends Collider {
    constructor(body) {
        super(body);
    }

    /**
     * @param {CirceBody} body1
     * @param {Body} body2
     * @return {Collision}
     */
    static detectCollision(body1, body2) {
        const boundaryCollision = Collider.detectBoundaryCollision(body1.boundary, body2.boundary);

        if (boundaryCollision.result) {
            if (body2 instanceof CirceBody) {
                return this.#circleCollision(boundaryCollision, body1, body2);
            } else if (body2 instanceof RectBody) {
                return this.#rectCollision(boundaryCollision, body1, body2, body2.box);
            }

            return this.#rectCollision(boundaryCollision, body1, body2, body2.boundary);
        }

        return boundaryCollision;
    }

    /**
     * @param {Collision} boxCollision
     * @param {CirceBody} body1
     * @param {CirceBody} body2
     */
    static #circleCollision(boxCollision, body1, body2) {
        const delta = boxCollision.delta;
        const distance = boxCollision.distance;
        const centerDistance = body1.radius + body2.radius;
        const result = distance <= centerDistance;

        if (result) {
            const collision = new Collision(true);
            collision.delta = delta;
            collision.distance = distance;
            collision.tangent = delta.normalized();
            collision.aContact = collision.tangent.scaled(body2.radius).add(body2.position);
            collision.bContact = collision.tangent.negated().scale(body1.radius).add(body1.position);
            collision.penetration = collision.tangent.scaled(centerDistance).sub(delta);

            return collision;
        }

        return new Collision(false);
    }

    /**
     * @param {Collision} boundaryCollision
     * @param {CirceBody} body1
     * @param {Body} body2
     * @param {BoundaryBox} box2
     */
    static #rectCollision(boundaryCollision, body1, body2, box2) {
        const angle2 = body2.angle;

        const delta = boundaryCollision.delta;
        const rotatedDelta = delta.rotated(-angle2);
        const box2Contact = Utils.getAltitude(rotatedDelta, Utils.getBoxPoint(rotatedDelta, box2), box2, null, true);

        const centerDistance = body1.radius + box2Contact.length();
        const distance = boundaryCollision.distance;
        const result = distance <= centerDistance;

        if (result) {
            const aContact = box2Contact.rotated(angle2).add(box2.center);
            const tangent = body1.position.tangent(aContact);

            const collision = new Collision(true);
            collision.delta = delta;
            collision.distance = distance;
            collision.tangent = tangent;
            collision.aContact = aContact;
            collision.bContact = tangent.negated().scale(body1.radius).add(body1.position);
            collision.penetration = collision.aContact.delta(collision.bContact);

            return collision;
        }

        return new Collision(false);
    }
}