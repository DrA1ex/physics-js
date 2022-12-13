import {EventEmitter} from "../../misc/event.js";

export class ParticleSystem extends EventEmitter {
    /** @type {Set<ParticleEmitter>} */
    #emitters = new Set();
    /** @type {Set<Particle>}  */
    #particles = new Set();

    /** @type {Event<Particle>} */
    #onParticleCreated = this.createEvent("particle_created");
    /** @type {Event<Particle>} */
    #onParticleDeleted = this.createEvent("particle_deleted");

    get onParticleCreated() {return this.#onParticleCreated;}
    get onParticleDeleted() {return this.#onParticleDeleted;}

    /**
     * @param {ParticleEmitter} emitter
     */
    addParticleEmitter(emitter) {
        emitter.onParticleCreated.subscribe(this, (sender, p) => { this.addParticle(p); });
        this.#emitters.add(emitter);
    }

    step(delta) {
        for (let emitter of this.#emitters.values()) {
            emitter.step(delta);
        }

        for (const particle of this.#particles.values()) {
            particle.step(delta);
            if (particle.destroyed) this.#destroyParticle(particle);
        }
    }

    /**
     * @param {Particle} particle
     */
    addParticle(particle) {
        this.#particles.add(particle);
        this.onParticleCreated.emit(particle);
    }

    #destroyParticle(particle) {
        if (this.#particles.has(particle)) {
            this.#particles.delete(particle);
            this.onParticleDeleted.emit(particle);
        } else {
            console.warn(`Unable to find particle ${particle}`);
        }
    }
}