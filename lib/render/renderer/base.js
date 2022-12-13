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

    /** @type{boolean|null} */
    fill = null;
    stroke = true;
    renderDirection = true;

    opacity = 1;
    fillStyle = "#000000";
    strokeStyle = "#d3d3d3";

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
