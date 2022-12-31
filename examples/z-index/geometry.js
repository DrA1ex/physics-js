import {CircleBody} from "../../lib/physics/body/circle.js";
import {RectBody} from "../../lib/physics/body/rect.js";
import {CircleObject} from "../../lib/render/renderer/webgl/objects/circle.js";
import {PolygonObject} from "../../lib/render/renderer/webgl/objects/poly.js";
import {Vector2} from "../../lib/utils/vector.js";
import * as CommonUtils from "../common/utils.js";

export const config = [
    {"z": 0.1, "body": "circle", "x": 0, "y": 0, "radius": 50, "color": "#f1bf28", opacity: 0.5},

    {"z": 0, "body": "rect", "x": -200, "y": -150, "width": 150, "height": 300, "color": "#d8d8d8"},
    {"z": 0, "body": "rect", "x": -50, "y": 50, "width": 250, "height": 100, "color": "#d8d8d8"},
    {"z": 0, "body": "rect", "x": -50, "y": -150, "width": 250, "height": 100, "color": "#d8d8d8"},
    {"z": 0, "body": "rect", "x": 50, "y": -50, "width": 150, "height": 100, "color": "#d8d8d8"},
    {"z": 0, "body": "rect", "x": -50, "y": -50, "width": 100, "height": 100, "color": "#8dc053", "opacity": 0.5},

    {"z": 0.1, "body": "circle", "x": -118, "y": -11, "radius": 70, "color": "#41479a"},

    {"z": 0.2, "body": "rect", "x": -135.50400000000002, "y": -100, "width": 101.439, "height": 202.878, "color": "#66301b"},
    {"z": 0.2, "body": "rect", "x": -34.065, "y": 35.25200000000001, "width": 169.065, "height": 67.626, "color": "#66301b"},
    {"z": 0.2, "body": "rect", "x": -34.065, "y": -100, "width": 169.065, "height": 67.626, "color": "#66301b"},
    {"z": 0.2, "body": "rect", "x": 33.56099999999998, "y": -32.373999999999995, "width": 101.439, "height": 67.626, "color": "#66301b"},
    {"z": 0.2, "body": "rect", "x": -34.065, "y": -32.373999999999995, "width": 67.626, "height": 67.626, "color": "#a704f9", "opacity": 0.5},

    {"z": 0.3, "body": "regular-poly", "vertices": 3, "x": -17, "y": -146.5, "height": 20, "width": 338, "color": "#1826a4", "angle": -Math.PI / 2},
    {"z": 0.3, "body": "regular-poly", "vertices": 3, "x": 14, "y": -124.75, "height": 20, "width": 305, "color": "#1826a4", "angle": -Math.PI / 2},
    {"z": 0.3, "body": "regular-poly", "vertices": 3, "x": 41.5, "y": -158.75, "height": 15, "width": 365, "color": "#1826a4", "angle": -Math.PI / 2}
]

/**
 * @param {Bootstrap} engine
 * @param {*} config
 * @param {Vector2} offset
 */
export function createFromConfig(engine, config, offset) {
    for (const item of config) {
        const [body, render] = createBodyRenderPair(item);

        body.position.add(offset)
            .add(new Vector2(body.boundary.width, body.boundary.height)
                .rotated(-(item.angle ?? 0))
                .scale(0.5));

        body.angle = item.angle ?? 0;
        body.setStatic(true);

        render.color = item.color ?? "#000000";
        render.opacity = item.opacity ?? 1;
        render.z = item.z ?? 1;

        engine.addRigidBody(body, render);
    }
}

export function createBodyRenderPair(item) {
    switch (item.body) {
        case "rect": {
            const body = new RectBody(item.x, item.y, item.width, item.height);
            const render = new PolygonObject(body);
            return [body, render];
        }

        case "circle": {
            const body = new CircleBody(item.x, item.y, item.radius);
            const render = new CircleObject(body);
            return [body, render];
        }

        case "regular-poly": {
            const body = CommonUtils.createRegularPoly(new Vector2(item.x, item.y), item.vertices, item.width, item.height);
            const render = new PolygonObject(body);
            return [body, render];
        }

        default:
            throw new Error(`Unsupported type: ${item.body}`);
    }
}