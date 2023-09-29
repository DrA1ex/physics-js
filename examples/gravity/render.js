import {WebglRenderer} from "../../lib/render/renderer/webgl/renderer.js";
import {m4} from "../../lib/render/renderer/webgl/utils/m4.js";

export class GravityRender {
    renderer;
    settings;

    /**
     * @param {HTMLCanvasElement} element
     * @param {GravityExampleSettings} settings
     * @param {*} options
     */
    constructor(element, settings, options) {
        this.settings = settings;
        this.renderer = new WebglRenderer(element, options);
    }

    initialize() {
        let projMatrix = m4.projection(this.renderer.canvasWidth, this.renderer.canvasHeight, 2);
        projMatrix = m4.translate(projMatrix, this.renderer.canvasWidth / 2, this.renderer.canvasHeight / 2, 0);
        projMatrix = m4.scale(projMatrix, 1 / this.settings.world.worldScale, 1 / this.settings.world.worldScale, 1);

        this.renderer.setProjectionMatrix(projMatrix)

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