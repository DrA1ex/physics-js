import {CircleBody, RectBody} from "../../../lib/physics/body.js";
import {SpotWindForce} from "../../../lib/physics/force.js";
import {Vector2} from "../../../lib/utils/vector.js";
import {State} from "../../common/bootstrap.js";
import {AnimatedSpriteRenderer, SpriteSeries} from "../../../lib/render/sprite.js";
import {AnimationProperty, KeyframeType, Particle, ParticleState, StateKeyframe} from "../../../lib/render/particle.js";
import {SmokeCollider, SmokeState, Tags} from "./misc.js";
import Settings from "../settings.js";

class SmokeParticle extends Particle {

    /**
     * @param {number} x
     * @param {number} y
     * @param {SpriteSeries} smokeSprite
     */
    constructor(x, y, smokeSprite) {
        const smokeRadius = 5 + Math.random() * 15;
        const mass = 0.045 - Math.random() * 0.01;
        const smokeBody = new CircleBody(x, y, smokeRadius, mass)
            .setTag(Tags.smoke)
            .setAngle(Math.random() * Math.PI * 2)
            .setInertiaFactor(1000)
            .setRestitution(0)
            .setFriction(0);

        const renderer = new AnimatedSpriteRenderer(smokeBody, smokeSprite, Settings.Smoke.Framerate, Math.floor(Math.random() * smokeSprite.count));
        renderer.opacity = 0.05 + Math.random() * 0.25;

        super(smokeBody, renderer);

        smokeBody.collider = new SmokeCollider(this);

        this.addState(SmokeState.born, new ParticleState()
            .addKeyframe(new StateKeyframe(AnimationProperty.opacity, 0, 1, 500, KeyframeType.relative)));

        this.addState(SmokeState.active, new ParticleState()
            .addKeyframe(new StateKeyframe(AnimationProperty.radius, 1, 7, 7000, KeyframeType.relative))
            .addKeyframe(new StateKeyframe(AnimationProperty.opacity, 1, 0.2, 15000, KeyframeType.relative)));

        this.addState(SmokeState.fade, new ParticleState()
            .addKeyframe(new StateKeyframe(AnimationProperty.radius, 1, 7, 7000, KeyframeType.relative))
            .addKeyframe(new StateKeyframe(AnimationProperty.opacity, 1, 0.2, 15000, KeyframeType.relative)));

        this.addState(SmokeState.destroy, new ParticleState()
            .addKeyframe(new StateKeyframe(AnimationProperty.opacity, 1, 0, 1000, KeyframeType.relative)));

        this.addSequentialTransition([SmokeState.born, SmokeState.active, SmokeState.fade, SmokeState.destroy, Particle.DestroyState]);
        this.setState(SmokeState.born);
    }

    onStateChanged(state) {
        if (state) {
            this.body.collider.noCollide = true;
        }
    }
}

export class HouseFlue {
    #engine;
    #houseFlue;
    #smokeSprite;

    get smokeSprite() {return this.#smokeSprite;}
    get houseFlue() {return this.#houseFlue;}


    constructor(engine, x, y, width, height) {
        this.#engine = engine;
        this.#smokeSprite = new SpriteSeries("./sprites/smoke_animation.png", 8, 8, 128, 128);

        this.#houseFlue = engine.addRigidBody(
            new RectBody(x, y, width, height)
                .setTag(Tags.houseFlue)
                .setStatic(true)
        );

        this.#houseFlue.renderer.z = 1;
        this.#houseFlue.renderer.renderDirection = false;
        this.#houseFlue.renderer.fill = true;

        engine.addForce(new SpotWindForce(
            new Vector2(x, y),
            Vector2.fromAngle(-Math.PI / 2), Math.PI / 2, 30
        ));
    }

    async init() {
        await this.#smokeSprite.wait();
        this.#smokeSprite.setupPreRendering(1024, 1024);
    }

    run() {
        setInterval(this.#emitSmoke.bind(this), Settings.Smoke.Interval);
    }

    #emitSmoke() {
        if (this.#engine.state !== State.play) {
            return;
        }

        const x = this.#houseFlue.body.position.x;
        const y = this.#houseFlue.body.position.y - this.#houseFlue.body.height / 2;

        this.#engine.addParticle(new SmokeParticle(x, y, this.#smokeSprite));
    }
}