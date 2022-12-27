import {Body} from "../../../physics/body/base.js";
import {IRenderer} from "../base.js";
import {RendererMapping} from "./mapping.js";

/**
 * @extends IRenderer<ICanvasRender>
 */
export class CanvasRenderer extends IRenderer {
    #objects = [];

    #ctx;

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {{useDpr?: boolean}} options
     */
    constructor(canvas, options = {}) {
        super(canvas, options);
    }

    init() {
        super.init();

        this.#ctx = this.canvas.getContext("2d");
        this.#ctx.scale(this.dpr, this.dpr);
    }

    addBody(body) {
        const rendererClass = RendererMapping.has(body.constructor) ? RendererMapping.get(body.constructor) : RendererMapping.get(Body);
        const renderObj = new rendererClass(body);

        this.addObject(renderObj);
        return renderObj;
    }

    addObject(obj) {
        this.#objects.push(obj);
    }

    removeObject(obj) {
        const index = this.#objects.indexOf(obj);
        if (index !== -1) {
            this.#objects.splice(index, 1);
        }
    }

    render(delta) {
        this.#ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

        this.#objects.sort((r1, r2) => r1.z - r2.z);
        for (const object of this.#objects) {
            object.render(this.#ctx, delta);
        }
    }
}