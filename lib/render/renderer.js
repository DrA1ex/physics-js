import {Vector2} from "../utils/vector.js";
import {Body, CircleBody, LineBody, PolygonBody, RectBody} from "../physics/body.js";

/**
 * @template {Body} T
 */
export class BodyRenderer {
    /** @type {T} */
    body;
    renderDirection = true;

    /**
     * @param {T} body
     */
    constructor(body) {
        this.body = body;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx) {
        this._beforeRender(ctx);
        this._renderBody(ctx);
        this._afterRender(ctx);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    _renderBody(ctx) {
        const box = this.body.boundary;
        ctx.beginPath();
        ctx.rect(-box.width / 2, -box.width / 2, box.width, box.height);
        if (this.body.active) ctx.fill();
        ctx.stroke();
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    _beforeRender(ctx) {};

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    _afterRender(ctx) {}
}

/***
 * @extends BodyRenderer<PolygonBody>
 */
export class PolygonBodyRenderer extends BodyRenderer {
    _renderBody(ctx) {
        const {points, position} = this.body;
        if (points.length === 0) {
            return;
        }

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y)
        for (let i = 0; i <= points.length; i++) {
            const point = points[i % points.length];
            ctx.lineTo(point.x, point.y);
        }

        if (this.body.active) ctx.fill();
        ctx.stroke();

        if (this.renderDirection) {
            ctx.beginPath();
            ctx.moveTo(position.x, position.y);
            ctx.lineTo(points[0].x, points[0].y);
            ctx.stroke();
        }
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
    _renderBody(ctx) {
        const {position, width, height, angle, active} = this.body;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.rect(-width / 2, -height / 2, width, height);
        if (active) ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}


/**
 * @extends BodyRenderer<CircleBody>
 */
export class CircleBodyRenderer extends BodyRenderer {
    _renderBody(ctx) {
        const {position, radius, angle, active} = this.body;

        ctx.beginPath();
        ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);

        if (active) ctx.fill();
        ctx.stroke();

        if (this.renderDirection) {
            ctx.beginPath();
            ctx.moveTo(position.x, position.y);
            ctx.lineTo(...Vector2.fromAngle(angle).scale(radius).add(position).elements());
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