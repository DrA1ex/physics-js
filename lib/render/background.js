import {IRenderer} from "./renderer.js";

export class LayeredRenderer extends IRenderer {
    #staticLayers = [];
    #dynamicLayers = [];

    #needToDrawStatic = false;

    get staticLayers() {return this.#staticLayers;}
    get dynamicLayers() {return this.#dynamicLayers;}

    /**
     * @param {Layer} layer
     */
    addStaticLayer(layer) {
        this.#staticLayers.push(layer);
        this.#needToDrawStatic = true;
    }

    /**
     * @param {Layer} layer
     */
    addDynamicLayer(layer) {
        this.#dynamicLayers.push(layer);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} delta
     */
    render(ctx, delta) {
        if (this.#needToDrawStatic) {
            this.#drawStaticContent();
            this.#needToDrawStatic = false;
        }

        this.#drawDynamicContent(delta);
    }

    #drawStaticContent() {
        for (const layer of this.#staticLayers) {
            layer.render(0);
        }
    }

    #drawDynamicContent(delta) {
        if (delta <= 0) return;

        for (const layer of this.#dynamicLayers) {
            layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
            layer.render(delta)
        }
    }
}