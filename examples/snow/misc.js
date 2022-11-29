import {Collider, LineCollider} from "../../lib/physics/collider.js";
import {PolygonBody} from "../../lib/physics/body.js";
import {Vector2} from "../../lib/utils/vector.js";
import * as GeomUtils from "../../lib/utils/geom.js";
import {Tags} from "./snow.js";

export class SnowdriftCollider extends LineCollider {
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
}

export class UnionPolyBody extends PolygonBody {
    #globalPoints;
    #bodies;

    constructor(x, y, bodies, mass = 1) {
        super(x, y, []);

        this.#bodies = bodies;

        let count = 0;
        for (const body of this.#bodies) {
            count += body.points.length;
        }

        this.#globalPoints = new Array(count);
        for (let i = 0; i < this.#globalPoints.length; i++) {
            this.#globalPoints[i] = new Vector2();
        }
    }

    get points() {
        let pos = 0;

        for (const body of this.#bodies) {
            for (const point of body.points) {
                this.#globalPoints[pos].set(point);
                if (this.scale.x !== 1 || this.scale.y !== 1 || this.skew.x !== 0 || this.skew.y !== 0) {
                    GeomUtils.transform(this.#globalPoints[pos].sub(this.position), this.scale, this.skew, this.#globalPoints[pos]);
                    this.#globalPoints[pos].add(this.position);
                }

                pos++;
            }
        }

        return this.#globalPoints;
    }
}