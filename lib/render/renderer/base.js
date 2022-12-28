import * as CommonUtils from "../../../examples/common/utils.js";
import {Body} from "../../physics/body/base.js";

/**
 * @class
 * @template T
 */
export class IRenderer {
    #useDpr;

    /** @type {HTMLCanvasElement} */
    #canvas;

    /** @type {number} */
    #dpr;
    /** @type {number} */
    #canvasWidth;
    /** @type {number} */
    #canvasHeight;

    get canvas() {return this.#canvas;}
    get dpr() {return this.#dpr;}
    get canvasWidth() {return this.#canvasWidth;}
    get canvasHeight() {return this.#canvasHeight;}

    /**
     * @abstract
     * @return Map<Body, T>
     */
    get bodyToRenderObjectMapping() {}

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
     * @param {Body} body
     * @return {T}
     */
    addBody(body) {
        const mapping = this.bodyToRenderObjectMapping;
        const rendererClass = mapping.has(body.constructor) ? mapping.get(body.constructor) : mapping.get(Body);

        const renderObj = new rendererClass(body);

        this.addObject(renderObj);
        return renderObj;
    }

    /**
     * @abstract
     * @param {T} obj
     */
    addObject(obj) {}

    /**
     * @abstract
     * @param {T} obj
     */
    removeObject(obj) {}

    /**
     * @abstract
     * @param {number} delta
     */
    render(delta) {}
}