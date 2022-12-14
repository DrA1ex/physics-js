import {KeyframeType} from "../animation/base.js";
import {ParticleAnimationHelper} from "./helper.js";

/**
 * @typedef {Particle.InitialState|Particle.DestroyState} SpecialState
 */

/**
 * @abstract
 *
 * @template TState
 */
export class Particle {
    static InitialState = "__initial";
    static DestroyState = "__destroy";
    static SpecialStates = new Set([this.InitialState, this.DestroyState]);

    /** @type {Map<TState|SpecialState, ParticleState>} */
    #states = new Map();
    /** @type {Map<TState|SpecialState, Object>} */
    #stateData = new Map();
    /** @type {Map<TState|SpecialState, TState|SpecialState>} */
    #transitions = new Map();
    #stateKey = null;

    /** @type {Body} */
    #body;
    /** @type {BodyRenderer} */
    #renderer;

    #boundApplyValueFn;
    #destroyed = false;

    get states() {return this.#states;}
    get transitions() {return this.#transitions;}

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
     * @param {TState|SpecialState} key
     * @param {ParticleState} state
     * @return {Particle}
     */
    addState(key, state) {
        this.#throwErrorIfDestroyed();

        this.states.set(key, state);
        return this;
    }

    /**
     * @param {TState|SpecialState} from
     * @param {TState|SpecialState} to
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
     * @param {Array<TState|SpecialState>} keys
     * @return {Particle}
     */
    addSequentialTransition(keys) {
        this.#throwErrorIfDestroyed();

        this.addTransition(Particle.InitialState, keys[0]);
        for (let i = 1; i < keys.length; i++) {
            this.addTransition(keys[i - 1], keys[i]);
        }

        return this;
    }

    /**
     * @param {TState|SpecialState} key
     */
    setState(key) {
        this.#throwErrorIfDestroyed();

        if (key === this.#stateKey) return;
        this.#throwIfStateInvalid(key);

        this.#stateKey = key;
        const newState = this.states.get(this.#stateKey);
        const stateData = {};
        for (const keyframe of newState.keyframes) {
            const initial = ParticleAnimationHelper.getValue(keyframe.property, this);
            stateData[keyframe.property] = {initial};
        }

        newState.reset();
        this.#stateData.set(this.#stateKey, stateData);

        this.onStateChanged(this.#stateKey);
    }

    step(delta) {
        if (this.destroyed || this.stateKey === null) return;

        const state = this.#states.get(this.stateKey);
        state.step(delta, this.#boundApplyValueFn);

        if (state.finished) {
            const nextState = this.#transitions.get(this.stateKey) ?? null;
            if (nextState === Particle.DestroyState) {
                this.destroy();
            } else if (nextState) {
                this.setState(nextState);
            }
        }
    }

    #applyValue(keyframe, value) {
        if (this.destroyed) return;

        const data = this.#stateData.get(this.stateKey);
        if (keyframe.type === KeyframeType.relative) {
            value = keyframe.getAbsoluteValue(value, data[keyframe.property].initial);
        }

        ParticleAnimationHelper.applyValue(keyframe.property, this, value);
    }

    destroy() {
        if (this.destroyed) return;

        this.#stateKey = null;
        this.#destroyed = true;

        this.onDestroyed();
    }

    /**
     * @param {*} state
     */
    onStateChanged(state) {}

    onDestroyed() {}

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