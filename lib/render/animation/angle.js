import * as CommonUtils from "../../utils/common.js";
import {formatAngle} from "../../utils/common.js";
import {AngleAnimationDirection} from "./base.js";
import {NumericAnimation} from "./numeric.js";

export class AngleAnimation extends NumericAnimation {
    #unit;

    /**
     * @param {string} from
     * @param {string} to
     * @param {number} step
     * @param {AngleAnimationDirection} [direction=AngleAnimationDirection.nearest]
     */
    constructor(from, to, step, direction = AngleAnimationDirection.nearest) {
        let [fromRad, unit] = CommonUtils.parseAngle(from);
        let [toRad] = CommonUtils.parseAngle(to);

        fromRad = CommonUtils.clampPeriodic(fromRad, Math.PI * 2);
        toRad = CommonUtils.clampPeriodic(toRad, Math.PI * 2);

        [fromRad, toRad] = AngleAnimation.#prepareAngles(fromRad, toRad, direction);

        super(fromRad, toRad, step);
        this.#unit = unit;
    }

    next(delta) {
        return formatAngle(super.next(delta), this.#unit);
    }

    static #prepareAngles(fromRad, toRad, direction) {
        if (direction === AngleAnimationDirection.unset) return [fromRad, toRad];

        const pi_2 = Math.PI * 2;
        fromRad = CommonUtils.clampPeriodic(fromRad, pi_2);
        toRad = CommonUtils.clampPeriodic(toRad, pi_2);

        switch (direction) {
            case AngleAnimationDirection.clockwise:
                if (toRad < fromRad) toRad += pi_2;
                break;

            case AngleAnimationDirection.anticlockwise:
                if (fromRad < toRad) fromRad += pi_2;
                break;

            case AngleAnimationDirection.nearest:
                const directDistance = Math.abs(toRad - fromRad);
                if (directDistance > Math.PI) {
                    if (fromRad < toRad) {
                        fromRad += pi_2;
                    } else {
                        toRad += pi_2;
                    }
                }
                break;
        }

        return [fromRad, toRad];
    }
}