import {BoundaryBox} from "../../physics/common/boundary.js";
import * as GeomUtils from "../../utils/geom.js";
import {Vector2} from "../../utils/vector.js";
import {AnimationAxis, IPathAnimation} from "./base.js";

export class SkewPathAnimation extends IPathAnimation {
    /**
     * @typedef {{__originalPoints: Vector2[], __boundary: BoundaryBox}} PathExtension
     */

    axles;
    anchor;
    parametricAnimation;

    /**
     * @param {AnimationAxis[]} axles
     * @param {ParametricAnimation} parametricAnimation
     * @param {Vector2} [anchor=new Vector2(0, 0)]
     */
    constructor(axles, parametricAnimation, anchor = new Vector2(0, 0)) {
        super();

        this.axles = axles;
        this.parametricAnimation = parametricAnimation;
        this.anchor = anchor;
    }

    /**
     * @param {Path&PathExtension} path
     * @param {number} delta
     */
    apply(path, delta) {
        this.#preparePath(path);

        const value = this.parametricAnimation.next(delta);
        const scale = new Vector2(1, 1);

        const skew = this.#createSkewVector(value);

        const boundary = path.__boundary;
        const anchor = new Vector2(boundary.width, boundary.height).mul(this.anchor).add(boundary.center);

        for (let j = 0; j < path.__originalPoints.length; j++) {
            const point = path.__originalPoints[j];

            const localPoint = point.delta(anchor);
            GeomUtils.transform(localPoint, scale, skew, localPoint);

            path.points[j].set(localPoint).add(anchor);
        }
    }

    #createSkewVector(value) {
        const skew = new Vector2();
        for (const axis of this.axles) {
            switch (axis) {
                case AnimationAxis.x:
                    skew.x = value;
                    break;
                case AnimationAxis.xInverted:
                    skew.x = -value;
                    break;

                case AnimationAxis.y:
                    skew.x = value;
                    break;
                case AnimationAxis.yInverted:
                    skew.x = -value;
                    break;
            }
        }

        return skew;
    }

    #preparePath(path) {
        if (!path.__originalPoints) {
            path.__originalPoints = path.points.map(p => p.copy());
            path.__boundary = BoundaryBox.fromPoints(path.__originalPoints);
        }
    }
}