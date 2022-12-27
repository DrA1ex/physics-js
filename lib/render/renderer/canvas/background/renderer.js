import {ICanvasRender} from "../objects/base.js";

export class LayeredRenderer extends ICanvasRender {
    #staticLayers = [];
    #dynamicLayers = [];
    #needToDrawStatic = false;

    z = -1;

    get staticLayers() {return this.#staticLayers;}
    get dynamicLayers() {return this.#dynamicLayers;}

    /**
     * @param {Layer} layer
     */
    addStaticLayer(layer) {
        this.#staticLayers.push(layer);
        this.invalidateContent();
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

    invalidateContent() {
        this.#needToDrawStatic = true;
    }

    #drawStaticContent() {
        for (const layer of this.#staticLayers) {
            this.#drawLayer(layer, 0);
        }
    }

    #drawDynamicContent(delta) {
        if (delta <= 0) return;

        for (const layer of this.#dynamicLayers) {
            this.#drawLayer(layer, delta);
        }
    }

    #drawLayer(layer, delta) {
        for (const path of layer.paths) {
            const b = path.boundary;
            layer.ctx.clearRect(b.left, b.top, b.width, b.height);
        }

        layer.render(delta);
    }
}