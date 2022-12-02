import {CircleBody, RectBody} from "../../lib/physics/body.js";
import {SpotWindForce} from "../../lib/physics/force.js";
import {Vector2} from "../../lib/utils/vector.js";
import {CircleCollider} from "../../lib/physics/collider.js";
import {Tags} from "./snow.js";
import {State} from "../common/bootstrap.js";
import {AnimatedSpriteRenderer, SpriteSeries} from "../../lib/render/sprite.js";

const SmokeState = {
    born: 0,
    active: 1,
    fade: 2,
    destroy: 3
}

class SmokeCollider extends CircleCollider {
    static #NoCollideTags = [Tags.snowflake, Tags.smoke, Tags.snowDrift, Tags.houseFlue, Tags.house];
    static #KeyFrames = [{
        opacity: {from: 0, to: 1, duration: 500},
    }, {
        radius: {from: 1, to: 5, duration: 5000},
        opacity: {from: 1, to: 0.5, duration: 10000},
    }, {
        opacity: {from: 1, to: 0, duration: 5000},
    }, {
        opacity: {from: 1, to: 0, duration: 1000},
    }]

    #engine;
    #renderer;
    #state = -1;
    #stateData = {};

    #animationInterval = null;
    #destroyed = false;

    constructor(engine, body) {
        super(body);

        this.#engine = engine;
    }

    shouldCollide(body2) {
        return SmokeCollider.#NoCollideTags.indexOf(body2.tag) === -1;
    }

    onCollide(collision, body2) {
        if (body2.tag === Tags.worldBorder) {
            this.setState(SmokeState.destroy);
        }
    }

    startAnimation() {
        this.#renderer = this.#engine.getRenderer(this.body);
        this.setState(SmokeState.born);

        const interval = 1000 / 24;
        setInterval(() => this.#animate(interval), interval);
    }

    #animate(delta) {
        let complete = true;
        for (const [key, data] of Object.entries(this.#stateData)) {
            const value = data.current;
            this.#setParameterValue(key, value);

            let nextValue = data.current + data.step * delta
            if (data.from < data.to) {
                nextValue = Math.min(nextValue, data.to);
            } else {
                nextValue = Math.max(nextValue, data.to);
            }

            data.current = nextValue;
            complete &&= data.current === data.to;
        }

        if (complete) {
            this.setState(this.#state + 1);
        }
    }

    setState(state) {
        if (this.#state >= state) {
            return;
        }

        const params = SmokeCollider.#KeyFrames[state];
        if (!params) {
            this.#destroy();
            return;
        }

        this.#state = state;
        this.#stateData = {};
        for (const [key, config] of Object.entries(params)) {
            const current = this.#getParameterValue(key);
            const from = config.from * current;
            const to = config.to * current;

            this.#setParameterValue(key, from);

            this.#stateData[key] = {
                current: from,
                from, to,
                step: (to - from) / config.duration,
                timeLeft: config.duration
            };
        }
    }

    #getParameterValue(parameter) {
        switch (parameter) {
            case "opacity":
                return this.#renderer.opacity;
            case "radius":
                return this.body.radius;
        }

        return null;
    }

    #setParameterValue(parameter, value) {
        switch (parameter) {
            case "opacity":
                this.#renderer.opacity = value;
                break;
            case "radius":
                this.body.radius = value;
                break;
        }
    }

    #destroy() {
        if (this.#destroyed) return;
        if (this.#animationInterval) clearInterval(this.#animationInterval);

        this.#engine.destroyBody(this.body);
        this.#engine = null;
        this.#destroyed = true;
    }
}

export class HouseFlue {
    #engine;
    #houseFlue;
    #smokeSprite;

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
        this.#houseFlue.renderer.fillStyle = "#38626d";
        this.#houseFlue.renderer.strokeStyle = "#568794";

        engine.addForce(new SpotWindForce(
            new Vector2(x, y),
            Vector2.fromAngle(-Math.PI / 2), Math.PI / 2, 40
        ));
    }

    async init() {
        return this.#smokeSprite.wait()
    }

    run() {
        setInterval(this.#emitSmoke.bind(this), 1000 / 10);
    }

    #emitSmoke() {
        if (this.#engine.state !== State.play) {
            return;
        }

        const smokeRadius = 5 + Math.random() * 20;
        const mass = 0.045 - Math.random() * 0.01;
        const smokeBody = new CircleBody(
            this.#houseFlue.body.position.x,
            this.#houseFlue.body.position.y - this.#houseFlue.body.height / 2,
            smokeRadius, mass
        ).setTag(Tags.smoke).setAngle(Math.random() * Math.PI * 2).setRestitution(0);

        const smokeCollider = new SmokeCollider(this.#engine, smokeBody);
        smokeBody.collider = smokeCollider;

        const renderer = new AnimatedSpriteRenderer(smokeBody, this.#smokeSprite, 3, Math.floor(Math.random() * this.#smokeSprite.count));
        renderer.opacity = 0.05 + Math.random() * 0.25;

        this.#engine.addRigidBody(smokeBody, renderer);
        smokeCollider.startAnimation();
    }
}