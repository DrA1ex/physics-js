import {RectBody} from "../../physics/body/rect.js";
import {RectBodyRenderer} from "./rect.js";
import {CircleBody} from "../../physics/body/circle.js";
import {CircleBodyRenderer} from "./circle.js";
import {PolygonBody} from "../../physics/body/poly.js";
import {PolygonBodyRenderer} from "./poly.js";
import {LineBody} from "../../physics/body/line.js";
import {LineRenderer} from "./line.js";
import {Body} from "../../physics/body/base.js";
import {BodyRenderer} from "./base.js";

export const RendererMapping = new Map([
    [RectBody, RectBodyRenderer],
    [CircleBody, CircleBodyRenderer],
    [PolygonBody, PolygonBodyRenderer],
    [LineBody, LineRenderer],
    [Body, BodyRenderer],
]);