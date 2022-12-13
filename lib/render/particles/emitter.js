import {EventEmitter} from "../../misc/event.js";
import {Particle} from "./particle.js";

export class ParticleEmitter extends EventEmitter {
    #positionProvider;
    #rateProvider;
    #particleType;
    #notUsedRate = 0;

    #particleArgs = [];

    /** @type {Event<Particle>} */
    #onParticleCreated = this.createEvent("particle_created")

    get onParticleCreated() {return this.#onParticleCreated;}

    /**
     * @param {typeof Particle} particleType
     * @param {VectorValueProvider} positionProvider
     * @param {NumericValueProvider} rateProvider
     */
    constructor(particleType, positionProvider, rateProvider) {
        super();

        this.#particleType = particleType;
        this.#positionProvider = positionProvider;
        this.#rateProvider = rateProvider;
    }

    /***
     * @param {*} args
     * @return {ParticleEmitter}
     */
    setParticleArguments(...args) {
        this.#particleArgs = args;

        return this;
    }

    step(delta) {
        const rate = this.#rateProvider.next(delta);
        const count = Math.floor(rate + this.#notUsedRate);
        this.#notUsedRate += rate - count;

        for (let i = 0; i < count; i++) {
            const position = this.#positionProvider.next(delta);
            const particle = new this.#particleType(position.x, position.y, ...this.#particleArgs);

            this.#particleCreated(particle);
        }
    }

    #particleCreated(particle) {
        const initialState = particle.transitions.get(Particle.InitialState);
        if (initialState !== undefined) {
            particle.setState(initialState);
        }

        this.onParticleCreated.emit(particle);
    }
}