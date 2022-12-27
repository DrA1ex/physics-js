import * as CommonUtils from "../../../examples/common/utils.js";

/**
 * @template R
 */
export class IRenderer {
    #useDpr;

    #canvas;

    #dpr;
    #canvasWidth;
    #canvasHeight;

    get canvas() {return this.#canvas;}
    get dpr() {return this.#dpr;}
    get canvasWidth() {return this.#canvasWidth;}
    get canvasHeight() {return this.#canvasHeight;}

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {{useDpr?: boolean}} options
     */
    constructor(canvas, options = {}) {
        this.#canvas = canvas;

        this.#useDpr = options.useDpr ?? true;
    }

    /**
     * @abstract
     */
    init() {
        const {dpr, canvasWidth, canvasHeight} = CommonUtils.initCanvas(this.#canvas, this.#useDpr);

        this.#dpr = dpr;
        this.#canvasWidth = canvasWidth;
        this.#canvasHeight = canvasHeight;
    }

    /**
     * @abstract
     * @param {Body} body
     * @return {R}
     */
    addBody(body) {}

    /**
     * @abstract
     * @param {R} obj
     */
    addObject(obj) {}

    /**
     * @abstract
     * @param {R} obj
     */
    removeObject(obj) {}

    /**
     * @abstract
     * @param {number} delta
     */
    render(delta) {}
}