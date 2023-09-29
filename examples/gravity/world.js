import {Vector2} from "../../lib/utils/vector.js";
import * as Utils from "../common/utils.js";
import {CircleBody} from "../../lib/physics/body/circle.js";
import {SpriteObject} from "../../lib/render/renderer/webgl/objects/sprite.js";
import {BoundaryBox} from "../../lib/physics/common/boundary.js";
import {ImageTexture} from "../../lib/render/renderer/webgl/misc/texture.js";

export class GravityWorld {
    bootstrap;
    settings;
    worldRect;

    particleTexture;


    /**
     * @param {Bootstrap} bootstrap
     * @param {GravityExampleSettings} settings
     * @param options
     */
    constructor(bootstrap, settings, options) {
        this.bootstrap = bootstrap;
        this.settings = settings;
        this.options = options;

        this.worldRect = new BoundaryBox(
            -settings.world.worldScale * bootstrap.renderer.canvasWidth / 2,
            settings.world.worldScale * bootstrap.renderer.canvasWidth / 2,
            -settings.world.worldScale * bootstrap.renderer.canvasHeight / 2,
            settings.world.worldScale * bootstrap.renderer.canvasHeight / 2
        );
    }

    async initialize() {
        this.particleTexture = new ImageTexture(this.settings.render.particleTextureUrl);
        this.particleTexture.glWrapS = WebGL2RenderingContext.CLAMP_TO_EDGE;
        this.particleTexture.glWrapT = WebGL2RenderingContext.CLAMP_TO_EDGE;
        this.particleTexture.glMin = WebGL2RenderingContext.LINEAR_MIPMAP_LINEAR;

        await this.particleTexture.wait();

        this.#initParticles();
    }

    async reconfigure(settings, {
        affected: {sizing = false, look = false},
        broken: {world = false, sprite = false, particles = false}
    }) {
        this.settings = settings;

        if (sprite) {
            await this.#updateTexture();
        }

        if (world) {
            this.worldRect.update(
                -settings.world.worldScale * this.bootstrap.renderer.canvasWidth / 2,
                settings.world.worldScale * this.bootstrap.renderer.canvasWidth / 2,
                -settings.world.worldScale * this.bootstrap.renderer.canvasHeight / 2,
                settings.world.worldScale * this.bootstrap.renderer.canvasHeight / 2
            );
        }

        if (particles) {
            for (const rigidBody of this.bootstrap.rigidBodies.slice()) {
                if (rigidBody.tag !== "particle") continue;
                this.bootstrap.destroyBody(rigidBody);
            }

            this.#initParticles();
        } else {
            this.#reconfigureImpl(sizing, look, sprite);
        }
    }

    async #updateTexture() {
        this.particleTexture.updateSource(this.settings.render.particleTextureUrl);
        await this.particleTexture.wait();
    }

    #initParticles() {
        const minRadius = Math.min(this.worldRect.width, this.worldRect.height) / 2 * 0.6
        const maxRadius = Math.min(this.worldRect.width, this.worldRect.height) / 2 * 0.8;

        for (let i = 0; i < this.settings.particle.count; i++) {
            const angle = Math.random() * Math.PI * 2;

            const radius = minRadius + Math.random() * (maxRadius - minRadius);
            const position = Vector2.fromAngle(angle)
                .scale(radius)
                .add(this.worldRect.center);

            const body = new CircleBody(position.x, position.y, 1)
                .setVelocity(Vector2.fromAngle(Math.random() * Math.PI * 2).scale(this.settings.simulation.gravity))
                .setFriction(this.options.friction)
                .setRestitution(this.options.restitution)
                .setTag("particle");

            const renderer = new SpriteObject(body);
            renderer.texture = this.particleTexture;

            this.bootstrap.addRigidBody(body, renderer);
        }

        this.#reconfigureImpl(true, true, false);
    }

    #reconfigureImpl(updateSizing, updateLook, updateSprite) {
        const maxSize = Math.max(0, this.settings.particle.maxSize - this.settings.particle.minSize);
        for (const particle of this.bootstrap.rigidBodies) {
            if (particle.tag !== "particle") continue;

            if (updateSizing) {
                const size = this.settings.particle.minSize + Math.random() * maxSize;
                particle.radius = size;
                particle.setMass(size);
            }

            const renderer = this.bootstrap.getRenderObject(particle);
            if (updateLook) {
                if (this.settings.render.particleColoring) {
                    renderer.color = Utils.randomColor(170, 255);
                } else {
                    renderer.color = "#ffffff";
                }

                renderer.opacity = this.settings.render.particleOpacity;
                renderer.scale = this.settings.render.particleScale;
            }

            if (updateSprite) {
                renderer.texture = this.particleTexture;
            }
        }
    }
}