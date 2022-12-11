import {AngleAnimation, ColorAnimation, NumericAnimation, PercentAnimation} from "./animation.js";
import * as ColorUtils from "../utils/color.js";
import * as CommonUtils from "../utils/common.js";

/** @enum {string} */
export const KeyframeType = {
    absolute: "absolute",
    relative: "relative",
}

/** @enum {string} */
export const AnimationProperty = {
    radius: "radius",
    opacity: "opacity",
    fillStyle: "fillStyle",
    strokeStyle: "strokeStyle"
}

/** @enum {string} */
export const AnimationPropertyType = {
    number: "number",
    color: "color",
    percent: "percent",
    angle: "angle"
}

/**
 * @type {{[key: AnimationProperty]: AnimationPropertyType}}
 */
export const AnimationPropertyTypeMapping = {
    [AnimationProperty.radius]: AnimationPropertyType.number,
    [AnimationProperty.opacity]: AnimationPropertyType.number,
    [AnimationProperty.fillStyle]: AnimationPropertyType.color,
    [AnimationProperty.strokeStyle]: AnimationPropertyType.color,
}

export class ParticleAnimationHelper {
    static applyValue(property, particle, value) {
        switch (property) {
            case AnimationProperty.opacity:
                particle.renderer.opacity = value;
                break;
            case AnimationProperty.radius:
                particle.body.radius = value;
                break;
            case AnimationProperty.fillStyle:
                particle.renderer.fillStyle = value;
                break;
            case AnimationProperty.strokeStyle:
                particle.renderer.strokeStyle = value;
                break;
            default:
                throw  new Error(`Unsupported property ${property}`);
        }
    }

    static getValue(property, particle) {
        switch (property) {
            case AnimationProperty.opacity:
                return particle.renderer.opacity;
            case AnimationProperty.radius:
                return particle.body.radius;
            case AnimationProperty.fillStyle:
                return particle.renderer.fillStyle;
            case AnimationProperty.strokeStyle:
                return particle.renderer.strokeStyle;
            default:
                throw  new Error(`Unsupported property ${property}`);
        }
    }
    /**
     * @param {AnimationProperty} property
     * @return {typeof IParametricAnimation}
     */
    static getParametricAnimationType(property) {
        const type = AnimationPropertyTypeMapping[property];
        if (!type) {
            throw new Error(`Unsupported property: "${property}"`);
        }

        switch (type) {
            case AnimationPropertyType.number:
                return NumericAnimation;
            case AnimationPropertyType.color:
                return ColorAnimation;
            case AnimationPropertyType.percent:
                return PercentAnimation;
            case AnimationPropertyType.angle:
                return AngleAnimation;
            default:
                throw  new Error(`Unsupported type ${type}`);
        }
    }
    static getAbsoluteValue(property, factor, initial, start, end) {
        const type = AnimationPropertyTypeMapping[property];
        switch (type) {
            case AnimationPropertyType.number: {
                const from = start * initial;
                const to = end * initial;
                return from + (to - from) * factor;
            }

            case AnimationPropertyType.color: {
                return ColorUtils.colorBetween(start ?? initial, end ?? initial, factor);
            }

            case AnimationPropertyType.percent: {
                const from = Number.parseFloat(start ?? initial);
                const to = Number.parseFloat(end ?? initial);
                return `${from + (to - from) * factor}%`;
            }

            case AnimationPropertyType.angle: {
                const from = start ?? initial;
                const to = end ?? initial;

                const [fromAngle, unit] = CommonUtils.parseAngle(from);
                const [toAngle,] = CommonUtils.parseAngle(to);

                const result = fromAngle + (toAngle - fromAngle) * factor;
                return CommonUtils.formatAngle(result, unit);
            }

            default:
                throw new Error(`Unable to get absolute value for property ${property}}. Relative values for type ${type} not supported`);
        }
    }
}

export class StateKeyframe {
    property;
    type;

    #from;
    #to;

    #animation;
    #finished = false;

    get animation() {return this.#animation;}
    get finished() {return this.#finished;}

    constructor(property, from, to, duration, type = KeyframeType.absolute) {
        this.property = property;
        this.type = type;

        this.#from = from;
        this.#to = to;

        if (type === KeyframeType.absolute) {
            const animationType = ParticleAnimationHelper.getParametricAnimationType(property);
            this.#animation = new animationType(from, to, 1000 / duration);
        } else {
            this.#animation = new NumericAnimation(0, 1, 1000 / duration);
        }
    }

    next(delta) {
        if (!this.#animation.hasNextValue()) this.#finished = true;
        return this.#animation.next(delta);
    }

    reset() {
        this.#animation.reset();
        this.#finished = false;
    }

    getAbsoluteValue(value, initial) {
        return ParticleAnimationHelper.getAbsoluteValue(this.property, value, initial, this.#from, this.#to);
    }
}

export class ParticleState {
    /**
     * @type {StateKeyframe[]}
     */
    #keyframes = []
    #finished = false;

    get keyframes() {return this.#keyframes;}
    get finished() {return this.#finished;}


    addKeyframe(keyframe) {
        this.keyframes.push(keyframe);

        return this;
    }

    reset() {
        for (const keyframe of this.keyframes) {
            keyframe.reset();
        }

        this.#finished = false;
    }

    step(delta, applyValueCallback) {
        let sequenceFinished = true;
        for (const keyframe of this.keyframes) {
            const finished = keyframe.finished;
            sequenceFinished &&= finished;

            if (!finished) {
                applyValueCallback(keyframe, keyframe.next(delta));
            }
        }

        this.#finished = sequenceFinished;
    }
}