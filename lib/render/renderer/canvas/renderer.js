import {Body} from "../../../physics/body/base.js";
import {CircleBody} from "../../../physics/body/circle.js";
import {LineBody} from "../../../physics/body/line.js";
import {PolygonBody} from "../../../physics/body/poly.js";
import {RectBody} from "../../../physics/body/rect.js";
import {IRenderer} from "../base.js";
import {BodyRenderer} from "./objects/base.js";
import {CircleBodyRenderer} from "./objects/circle.js";
import {LineRenderer} from "./objects/line.js";
import {PolygonBodyRenderer} from "./objects/poly.js";
import {RectBodyRenderer} from "./objects/rect.js";

/**
 * @extends IRenderer<ICanvasRender>
 */
export class CanvasRenderer extends IRenderer {
    #bodyToRenderObjectMapping = new Map([
        [RectBody, RectBodyRenderer],
        [CircleBody, CircleBodyRenderer],
        [PolygonBody, PolygonBodyRenderer],
        [LineBody, LineRenderer],
        [Body, BodyRenderer],
    ]);

    #objects = [];

    #ctx;

    get bodyToRenderObjectMapping() {return this.#bodyToRenderObjectMapping;}

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