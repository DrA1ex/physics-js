import {Body} from "../../physics/body/base.js";
import {CircleBody} from "../../physics/body/circle.js";
import {LineBody} from "../../physics/body/line.js";
import {PolygonBody} from "../../physics/body/poly.js";
import {RectBody} from "../../physics/body/rect.js";
import {BodyRenderer} from "./base.js";
import {CircleBodyRenderer} from "./circle.js";
import {LineRenderer} from "./line.js";
import {PolygonBodyRenderer} from "./poly.js";
import {RectBodyRenderer} from "./rect.js";

export const RendererMapping = new Map([
    [RectBody, RectBodyRenderer],
    [CircleBody, CircleBodyRenderer],
    [PolygonBody, PolygonBodyRenderer],
    [LineBody, LineRenderer],
    [Body, BodyRenderer],
]);