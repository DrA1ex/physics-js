import * as TriangulationUtils from "../../utils/triangulation.js";
import {BodyRenderer} from "./base.js";

/***
 * @extends BodyRenderer<PolygonBody>
 */
export class PolygonBodyRenderer extends BodyRenderer {
    smooth = false;
    smoothCount = 3;

    #triangulation = null;

    get triangulation() {
        if (this.#triangulation === null) {
            this.#triangulation = TriangulationUtils.earClipping(this.body.points);
        }

        return this.#triangulation;
    }

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