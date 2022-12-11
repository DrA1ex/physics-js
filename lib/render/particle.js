/** @enum {string} */
import {AnimationDirection, ParametricAnimation} from "./animation.js";

export const KeyframeType = {
    absolute: "absolute",
    relative: "relative",
}

/** @enum {string} */
export const AnimationProperty = {
    radius: "radius",
    opacity: "opacity",
}

export class PropertyAnimator {
    static applyValue(property, particle, value) {
        switch (property) {
            case AnimationProperty.opacity:
                particle.renderer.opacity = value;
                break;
            case AnimationProperty.radius:
                particle.body.radius = value;
                break;
        }
    }

    static getValue(property, particle) {
        switch (property) {
            case AnimationProperty.opacity:
                return particle.renderer.opacity;
            case AnimationProperty.radius:
                return particle.body.radius;
        }

        return null;
    }
}

export class StateKeyframe {
    property;
    type;

    #animation;
    #finished = false;

    get finished() {return this.#finished;}

    constructor(property, from, to, duration, type = KeyframeType.absolute) {
        this.property = property;
        this.type = type;

        duration /= 1000;

        let direction = AnimationDirection.forward;
        if (from > to) {
            [from, to] = [to, from];
            direction = AnimationDirection.backward;
        }

        this.#animation = new ParametricAnimation(from, to, (to - from) / duration)
            .setDirection(direction);
    }

    setEasing(easing) {
        this.#animation.setEasing(easing);
        return this;
    }

    next(delta) {
        if (!this.#animation.hasNextValue()) this.#finished = true;
        return this.#animation.next(delta);
    }

    reset() {
        this.#animation.reset();
        this.#finished = false;
    }
}

export class ParticleState {
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

export class Particle {
    static DestroyState = "__destroy";
    static SpecialStates = new Set([this.DestroyState]);

    #states = new Map();
    #stateData = new Map();
    #transitions = new Map();
    #stateKey = null;

    /** @type {Body} */
    #body;
    /** @type {BodyRenderer} */
    #renderer;

    #boundApplyValueFn;
    #destroyed = false;

    get states() {return this.#states;}
    get stateKey() {return this.#stateKey;}

    get body() {return this.#body;}
    get renderer() {return this.#renderer;}

    get destroyed() {return this.#destroyed;}

    /**
     * @param {Body} body
     * @param {BodyRenderer} renderer
     */
    constructor(body, renderer) {
        this.#body = body;
        this.#renderer = renderer;

        this.#boundApplyValueFn = this.#applyValue.bind(this);
    }

    /**
     * @param {*} key
     * @param {ParticleState} state
     * @return {Particle}
     */
    addState(key, state) {
        this.#throwErrorIfDestroyed();

        this.states.set(key, state);
        return this;
    }

    /**
     * @param {*} from
     * @param {*} to
     * @return {Particle}
     */
    addTransition(from, to) {
        this.#throwErrorIfDestroyed();
        this.#throwIfStateInvalid(from);
        this.#throwIfStateInvalid(to);

        this.#transitions.set(from, to);
        return this;
    }

    /**
     * @param {Array} keys
     * @return {Particle}
     */
    addSequentialTransition(keys) {
        this.#throwErrorIfDestroyed();

        for (let i = 1; i < keys.length; i++) {
            this.addTransition(keys[i - 1], keys[i]);
        }

        return this;
    }

    /**
     * @param {*} key
     */
    setState(key) {
        this.#throwErrorIfDestroyed();
        if (key === this.#stateKey) return;
        if (key !== null) this.#throwIfStateInvalid(key);

        this.#stateKey = key;
        if (key === null) return;

        const newState = this.states.get(this.#stateKey);
        const stateData = {};
        for (const keyframe of newState.keyframes) {
            const initial = PropertyAnimator.getValue(keyframe.property, this);
            stateData[keyframe.property] = {initial};
        }

        newState.reset();
        this.#stateData.set(this.#stateKey, stateData);
    }

    step(delta) {
        if (this.destroyed || this.stateKey === null) return;

        const state = this.#states.get(this.stateKey);
        state.step(delta, this.#boundApplyValueFn);

        if (state.finished) {
            const nextState = this.#transitions.get(this.stateKey);
            if (nextState === Particle.DestroyState) {
                this.destroy();
            } else {
                this.setState(nextState);
            }
        }
    }

    #applyValue(keyframe, value) {
        if (this.destroyed) return;

        const data = this.#stateData.get(this.stateKey);
        if (keyframe.type === KeyframeType.relative) {
            value *= data[keyframe.property].initial;
        }

        PropertyAnimator.applyValue(keyframe.property, this, value);
    }

    destroy() {
        if (this.destroyed) return;

        this.setState(null);
        this.#destroyed = true;
    }

    /**
     * @param {*} state
     */
    onStateChanged(state) {}

    #throwIfStateInvalid(state) {
        if (!Particle.SpecialStates.has(state) && !this.states.has(state)) {
            throw new Error(`Unknown state ${state}`);
        }
    }

    #throwErrorIfDestroyed() {
        if (this.destroyed) {
            throw new Error("Particle destroyed");
        }
    }
}