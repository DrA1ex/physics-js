import {WebglRenderer} from "../../lib/render/renderer/webgl/renderer.js";
import {m4} from "../../lib/render/renderer/webgl/utils/m4.js";

export class GravityRender {
    matrix = null;
    canvasMatrix = null;

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

    initialize() {
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
        this.initialize();
    }
}