import {Body} from "../physics/body/base.js";
import {PolygonBody} from "../physics/body/poly.js";
import {LineBody} from "../physics/body/line.js";
import {RectBody} from "../physics/body/rect.js";
import {CircleBody} from "../physics/body/circle.js";
import {Vector2} from "../utils/vector.js";

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

/***
 * @extends BodyRenderer<PolygonBody>
 */
export class PolygonBodyRenderer extends BodyRenderer {
    smooth = false;
    smoothCount = 3;

    _renderBody(ctx, delta) {
        const {points, position} = this.body;
        if (points.length === 0) {
            return;
        }

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y)
        if (this.smooth) {
            for (let i = 0; i < points.length; i++) {
                const current = points[i % points.length];
                const {c, d} = this.#calcFocuses(points, i);

                ctx.quadraticCurveTo(current.x, current.y, c, d)
            }
        } else {
            for (let i = 0; i <= points.length; i++) {
                const point = points[i % points.length];
                ctx.lineTo(point.x, point.y);
            }
        }

        ctx.fill();
        ctx.stroke();

        if (this.renderDirection) {
            ctx.beginPath();
            ctx.moveTo(position.x, position.y);
            ctx.lineTo(points[0].x, points[0].y);
            ctx.stroke();
        }
    }

    #calcFocuses(points, i) {
        const current = points[i % points.length];
        const next = points[(i + 1) % points.length];
        const nextNext = points[(i + 2) % points.length];

        const c = (current.x + next.x + nextNext.x) / 3;
        const d = (current.y + next.y + nextNext.y) / 3;

        return {c, d};
    }
}

/***
 * @extends BodyRenderer<LineBody>
 */
export class LineRenderer extends PolygonBodyRenderer {
    renderDirection = false;
}

/**
 * @extends BodyRenderer<RectBody>
 */
export class RectBodyRenderer extends BodyRenderer {
    _renderBody(ctx, delta) {
        const {position, width, height, angle} = this.body;

        ctx.save();
        ctx.translate(position.x, position.y);
        if (angle !== 0) ctx.rotate(angle);

        ctx.beginPath();
        ctx.rect(-width / 2, -height / 2, width, height);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}


/**
 * @extends BodyRenderer<CircleBody>
 */
export class CircleBodyRenderer extends BodyRenderer {
    _renderBody(ctx, delta) {
        const {position, radius, angle} = this.body;

        ctx.beginPath();
        ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);

        ctx.fill();
        ctx.stroke();

        if (this.renderDirection) {
            const radiusPos = Vector2.fromAngle(angle).scale(radius).add(position);

            ctx.beginPath();
            ctx.moveTo(position.x, position.y);
            ctx.lineTo(radiusPos.x, radiusPos.y);
            ctx.stroke();
        }
    }
}

export const RendererMapping = new Map([
    [RectBody, RectBodyRenderer],
    [CircleBody, CircleBodyRenderer],
    [PolygonBody, PolygonBodyRenderer],
    [LineBody, LineRenderer],
    [Body, BodyRenderer],
]);