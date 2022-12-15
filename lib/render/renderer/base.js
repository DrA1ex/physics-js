import * as CollorUtils from "../../utils/color.js";

export class IRenderer {
    z = 0;

    /**
     * @abstract
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} delta
     */
    render(ctx, delta) {}
}

/**
 * @template {Body} T
 */
export class BodyRenderer extends IRenderer {
    /** @type {T} */
    body;

    _fillRgb;
    _strokeRgb;

    /** @type{boolean|null} */
    fill = null;
    stroke = true;
    renderDirection = true;

    opacity = 1;
    #fillStyle = "#000000";
    #strokeStyle = "#d3d3d3";

    get fillStyle() {return this.#fillStyle;}
    set fillStyle(value) {
        this.#fillStyle = value;
        this._fillRgb = null;
    }

    get strokeStyle() {return this.#strokeStyle;}
    set strokeStyle(value) {
        this.#strokeStyle = value;
        this._strokeRgb = null;
    }


    get fillRgb() {
        if (!this._fillRgb) this._fillRgb = CollorUtils.parseHexColor(this.fillStyle);
        return this._fillRgb;
    }

    get strokeRgb() {
        if (!this._strokeRgb) this._strokeRgb = CollorUtils.parseHexColor(this.strokeStyle);
        return this._strokeRgb;
    }

    /**
     * @param {T} body
     */
    constructor(body) {
        super();

        this.body = body;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} delta
     */
    render(ctx, delta) {
        if (!this._shouldRender()) return;

        this._beforeRender(ctx, delta);
        this._renderBody(ctx, delta);
        this._afterRender(ctx, delta);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} delta
     */
    _renderBody(ctx, delta) {
        const box = this.body.boundary;
        ctx.beginPath();
        ctx.rect(-box.width / 2, -box.width / 2, box.width, box.height);

        ctx.fill();
        ctx.stroke();
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} delta
     */
    _beforeRender(ctx, delta) {
        ctx.globalAlpha = this.opacity;

        ctx.strokeStyle = this.stroke ? this.strokeStyle : "transparent";

        if (this.fill === true) {
            ctx.fillStyle = this.fillStyle;
        } else if (this.fill === false) {
            ctx.fillStyle = "transparent";
        } else {
            ctx.fillStyle = this.body.active ? this.fillStyle : "transparent";
        }
    };

    _shouldRender() {
        return this.opacity > 0 && (this.fill || this.body.active && this.fill === null || this.stroke);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} delta
     */
    _afterRender(ctx, delta) {
        ctx.globalAlpha = 1;
    }
}
