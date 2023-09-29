import {WebglRenderer} from "../../lib/render/renderer/webgl/renderer.js";
import {m4} from "../../lib/render/renderer/webgl/utils/m4.js";
import {ParticleColoringType} from "./settings.js";
import {Vector2} from "../../lib/utils/vector.js";
import * as ColorUtils from "../../lib/utils/color.js";

export class GravityRender {
    matrix = null;
    canvasMatrix = null;
    maxSpeed = 0

    bootstrap;
    renderer;
    settings;


    /**
     * @param {HTMLCanvasElement} element
     * @param {GravityExampleSettings} settings
     */
    constructor(element, settings) {
        this.settings = settings;
        this.renderer = new WebglRenderer(element, settings.renderer);
    }

    initialize(bootstrap) {
        this.bootstrap = bootstrap;

        let projMatrix = m4.projection(this.renderer.canvasWidth, this.renderer.canvasHeight, 2);
        projMatrix = m4.translate(projMatrix, this.renderer.canvasWidth / 2, this.renderer.canvasHeight / 2, 0);
        projMatrix = m4.scale(projMatrix, 1 / this.settings.world.worldScale, 1 / this.settings.world.worldScale, 1);

        this.matrix = projMatrix;
        this.renderer.setProjectionMatrix(projMatrix)

        let canvasMatrix = m4.projection(this.renderer.canvasWidth, this.renderer.canvasHeight, 2);
        canvasMatrix = m4.scale(canvasMatrix, this.renderer.canvasWidth, -this.renderer.canvasHeight, 1);
        canvasMatrix = m4.translate(canvasMatrix, this.renderer.canvasWidth / 2, this.renderer.canvasHeight / 2, 0);
        canvasMatrix = m4.scale(canvasMatrix, 1 / this.settings.world.worldScale, 1 / this.settings.world.worldScale, 1);

        this.canvasMatrix = canvasMatrix;

        if (this.settings.render.particleBlending) {
            this.renderer.setBlending(WebGL2RenderingContext.SRC_COLOR, WebGL2RenderingContext.ONE);
        } else {
            this.renderer.setBlending(WebGL2RenderingContext.ONE, WebGL2RenderingContext.ONE_MINUS_SRC_ALPHA);
        }
    }

    reconfigure(settings) {
        this.settings = settings;
        this.initialize(this.bootstrap);
    }

    renderStep() {
        if (this.settings.render.particleColoring !== ParticleColoringType.velocity) return;

        for (let body of this.bootstrap.rigidBodies) {
            if (body.tag !== "particle") continue;

            const renderer = this.bootstrap.getRenderObject(body);

            this.maxSpeed = Math.max(Math.abs(body.velocity.x), Math.abs(body.velocity.y), this.maxSpeed);
            const color = body.velocity.scaled(1 / this.maxSpeed * 0.5).add(new Vector2(0.5, 0.5));
            renderer.color = ColorUtils.rgbToHex(color.x, 0.5, color.y);
        }

    }
}