import {Body} from "../../../physics/body/base.js";
import {CircleBody} from "../../../physics/body/circle.js";
import {LineBody} from "../../../physics/body/line.js";
import {PolygonBody} from "../../../physics/body/poly.js";
import {RectBody} from "../../../physics/body/rect.js";
import {BodyRenderer} from "./objects/base.js";
import {CircleBodyRenderer} from "./objects/circle.js";
import {LineRenderer} from "./objects/line.js";
import {PolygonBodyRenderer} from "./objects/poly.js";
import {RectBodyRenderer} from "./objects/rect.js";

/**
 * @type {Map<Body, typeof ICanvasRender>}
 */
export const RendererMapping = new Map([
    [RectBody, RectBodyRenderer],
    [CircleBody, CircleBodyRenderer],
    [PolygonBody, PolygonBodyRenderer],
    [LineBody, LineRenderer],
    [Body, BodyRenderer],
]);