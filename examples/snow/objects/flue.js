import {RectBody} from "../../../lib/physics/body/rect.js";
import {SpotWindForce} from "../../../lib/physics/force.js";
import {LinearRateProvider, NumericValueProvider, VectorValueProvider} from "../../../lib/render/misc/provider.js";
import {SpriteSeries} from "../../../lib/render/renderer/canvas/misc/sprite_series.js";
import {ParticleEmitter} from "../../../lib/render/particles/emitter.js";
import {Vector2} from "../../../lib/utils/vector.js";
import Settings from "../settings.js";
import {SmokeParticle} from "./body.js";
import {SmokeState, Tags} from "./misc.js";

const SmokeSpriteUrl = new URL("../sprites/smoke_animation.png", import.meta.url)

export class HouseFlue {
    #engine;
    #houseFlue;
    #smokeSprite;

    /** @type {ParticleEmitter<SmokeState>} */
    #smokeEmitter;

    get smokeSprite() {return this.#smokeSprite;}
    get houseFlue() {return this.#houseFlue;}


    constructor(engine, x, y, width, height) {
        this.#engine = engine;
        this.#smokeSprite = new SpriteSeries(SmokeSpriteUrl, 8, 8, 128, 128);

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
        this.#smokeEmitter = new ParticleEmitter(
            SmokeParticle,
            new VectorValueProvider(
                new NumericValueProvider(this.#houseFlue.body.position.x),
                new NumericValueProvider(this.#houseFlue.body.position.y - this.#houseFlue.body.height / 2),
            ),
            new LinearRateProvider(1000 / Settings.Smoke.Interval)
        ).setParticleArguments(this.#smokeSprite);

        this.#engine.addParticleEmitter(this.#smokeEmitter);
    }
}