import {Body} from "./base.js";
import {PolygonCollider} from "../collider/poly.js";
import * as Utils from "../../utils/geom.js";
import {Vector2} from "../../utils/vector.js";

/**
 * @template {Body<PolygonBody>} T
 * @extends T
 */
export class PolygonBody extends Body {
    /** @type{Vector2[]} */
    _transformedPoints = null;
    /** @type{Vector2[]} */
    _localPoints = null;
    /** @type{Vector2[]} */
    _globalPoints = null;

    _scale = new Vector2(1, 1);
    _skew = new Vector2(0, 0);

    get skew() {return this._skew;}
    get scale() {return this._scale;}

    /**
     * @param {number} x
     * @param {number} y
     * @param {Vector2[]} points
     * @param {number} [mass=1]
     */
    constructor(x, y, points, mass = 1) {
        super(x, y, mass);
        this._localPoints = points;

        this._transformedPoints = Vector2.array(this._localPoints.length);
        this._globalPoints = Vector2.array(this._localPoints.length);

        this._updateTransformedPoints();

        this.collider = new PolygonCollider(this);
    }

    _calcInertia(mass) {
        const boundary = this.boundary;
        return (mass / 12) * (Math.pow(boundary.width, 2) + Math.pow(boundary.height, 2))
    }

    get points() {
        this.#updateGlobalPoints();
        return this._globalPoints;
    }

    get boundary() {
        return this._boundary.updateFromPoints(this.points);
    }

    /**
     * @param {Vector2} scale
     * @return {T}
     */
    setScale(scale) {
        this._scale = scale;
        this._updateTransformedPoints();
        return this;
    }

    /**
     * @param {Vector2} skew
     * @return {T}
     */
    setSkew(skew) {
        this._skew = skew;
        this._updateTransformedPoints();
        return this;
    }

    _updateTransformedPoints() {
        if (this.scale.x !== 1 || this.scale.y !== 1 || this.skew.x !== 0 || this.skew.y !== 0) {
            for (let i = 0; i < this._localPoints.length; i++) {
                Utils.transform(this._localPoints[i], this.scale, this.skew, this._transformedPoints[i]);
            }
        } else {
            for (let i = 0; i < this._localPoints.length; i++) {
                this._transformedPoints[i].set(this._localPoints[i]);
            }
        }
    }

    #updateGlobalPoints() {
        if (this.angle === 0) {
            for (let i = 0; i < this._transformedPoints.length; i++) {
                this._globalPoints[i].set(this._transformedPoints[i])
                    .add(this.position);
            }
        } else {
            for (let i = 0; i < this._transformedPoints.length; i++) {
                this._globalPoints[i].set(this._transformedPoints[i])
                    .rotate(this.angle)
                    .add(this.position);
            }
        }
    }
}