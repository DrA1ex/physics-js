import {PolygonBody} from "../../../lib/physics/body/poly.js";
import {Collider} from "../../../lib/physics/collider/base.js";
import {CircleCollider} from "../../../lib/physics/collider/circle.js";
import {PolygonCollider} from "../../../lib/physics/collider/poly.js";
import * as GeomUtils from "../../../lib/utils/geom.js";
import {Vector2} from "../../../lib/utils/vector.js";

/**
 * @enum {number}
 */
export const SmokeState = {
    born: 0,
    active: 1,
    fade: 2,
    destroy: 3
}

/**
 * @enum {string}
 */
export const Tags = {
    snowflake: "snowflake",
    snowDrift: "snowDrift",
    smoke: "smoke",
    worldBorder: "worldBorder",
    houseFlue: "houseFlue",
    house: "house",
}

export class SnowdriftCollider extends PolygonCollider {
    #onCollideHandler;

    constructor(body, onCollideFn) {
        super(body);

        this.#onCollideHandler = onCollideFn;
    }

    onCollide(collision, body2) {
        this.#onCollideHandler(collision, this.body, body2);
    }
}

export class WorldBorderCollider extends Collider {
    #engine;
    constructor(body, engine) {
        super(body);

        this.#engine = engine;
    }

    onCollide(collision, body2) {
        if (body2.tag === Tags.snowflake) {
            this.#engine.destroyBody(body2);
        }
    }

    get order() {return super.order;}
    get type() {return super.type;}
}

export class UnionPolyBody extends PolygonBody {
    #pointIndices = [];
    #globalPoints;
    #bodies;

    constructor(x, y, bodies, mass = 1, eps = 1e-3) {
        super(x, y, []);

        this.#bodies = bodies.concat();

        let count = 0;
        for (const body of this.#bodies) {
            count += body.points.length;
        }

        let prevPoint = null;
        let index = 0;
        for (const body of this.#bodies) {
            for (const point of body.points) {
                if (prevPoint === null || Math.abs(prevPoint.x - point.x) > eps || Math.abs(prevPoint.y - point.y) > eps) {
                    this.#pointIndices.push(index);
                }

                ++index;
                prevPoint = point;
            }
        }

        this.#globalPoints = new Array(this.#pointIndices.length);
        for (let i = 0; i < this.#globalPoints.length; i++) {
            this.#globalPoints[i] = new Vector2();
        }
    }

    get points() {
        let currentPointIndex = 0;
        let nextPointIndex = this.#pointIndices[0];
        let index = 0;

        for (const body of this.#bodies) {
            for (const point of body.points) {
                if (index === nextPointIndex) {
                    const globalPoint = this.#globalPoints[currentPointIndex];
                    globalPoint.set(point);

                    if (this.scale.x !== 1 || this.scale.y !== 1 || this.skew.x !== 0 || this.skew.y !== 0) {
                        GeomUtils.transform(globalPoint.sub(this.position), this.scale, this.skew, globalPoint);
                        globalPoint.add(this.position);

                    }

                    if (++currentPointIndex === this.#pointIndices.length) {
                        return this.#globalPoints;
                    }

                    nextPointIndex = this.#pointIndices[currentPointIndex];
                }

                index += 1;
            }
        }

        return this.#globalPoints;
    }
}

export class SmokeCollider extends CircleCollider {
    static #NoCollideTags = [Tags.snowflake, Tags.smoke, Tags.houseFlue, Tags.house];

    #particle;
    noCollide = false;

    constructor(particle) {
        super(particle.body);

        this.#particle = particle;
    }

    shouldCollide(body2) {
        if (this.noCollide) return false;

        return SmokeCollider.#NoCollideTags.indexOf(body2.tag) === -1;
    }

    onCollide(collision, body2) {
        if (body2.tag === Tags.worldBorder && !this.#particle.destroyed) {
            this.#particle.setState(SmokeState.destroy);
        }
    }
}