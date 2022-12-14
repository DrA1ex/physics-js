import {Vector2} from "../../utils/vector.js";
import {BodyRenderer} from "./base.js";

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