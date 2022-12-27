import {BodyRenderer} from "./base.js";

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