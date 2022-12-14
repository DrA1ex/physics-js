import {KeyframeType} from "../animation/base.js";
import {NumericAnimation} from "../animation/numeric.js";
import {ParticleAnimationHelper} from "./helper.js";

export class StateKeyframe {
    property;
    type;

    #from;
    #to;

    /** @type {IParametricAnimation} */
    #animation;
    #finished = false;

    get animation() {return this.#animation;}
    get finished() {return this.#finished;}

    /**
     * @template TProp
     *
     * @param {AnimationProperty} property
     * @param {TProp|null} from
     * @param {TProp|null} to
     * @param {number} duration
     * @param {KeyframeType} [type=KeyframeType.absolute]
     */
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

    /***
     * @param {EasingFunction} easing
     * @return {StateKeyframe}
     */
    setEasing(easing) {
        this.animation.setEasing(easing);

        return this;
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