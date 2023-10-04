import {Body} from "../../../physics/body/base.js";
import {CircleBody} from "../../../physics/body/circle.js";
import {LineBody} from "../../../physics/body/line.js";
import {PolygonBody} from "../../../physics/body/poly.js";
import {RectBody} from "../../../physics/body/rect.js";
import {IRenderer} from "../base.js";
import {BoundaryObject} from "./objects/boundary.js";
import {CircleObject} from "./objects/circle.js";
import {Shaders} from "./objects/index.js";
import {LineObject} from "./objects/line.js";
import {PolygonObject} from "./objects/poly.js";
import {m4} from "./utils/m4.js";
import * as WebglUtils from "./utils/webgl.js";
import {IRenderObject} from "./objects/base.js";

/**
 * @extends IRenderer<IRenderObject>
 */
export class WebglRenderer extends IRenderer {
    #bodyToRenderObjectMapping = new Map([
        [LineBody, LineObject],
        [RectBody, PolygonObject],
        [PolygonBody, PolygonObject],
        [CircleBody, CircleObject],
        [Body, BoundaryObject]
    ]);

    /** @type {WebGL2RenderingContext} */
    #gl;
    #configuration = {};

    #projMatrix;

    /**
     * @type {Map<string, {key: string, opaque: Set<IRenderObject>, transparent: Set<IRenderObject>}>}
     */
    #objectsByType = new Map();

    get bodyToRenderObjectMapping() {
        return this.#bodyToRenderObjectMapping;
    }

    clear() {
        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT);
    }

    render(delta) {
        this.#prepare();

        this.clear();
        this.#gl.depthMask(true);
        for (const data of this.#objectsByType.values()) {
            this.#render(data.key, data.opaque);
        }

        this.#gl.depthMask(false);
        for (const data of this.#objectsByType.values()) {
            this.#render(data.key, data.transparent);
        }
    }

    setProjectionMatrix(matrix) {
        this.#projMatrix = matrix;

        WebglUtils.loadDataFromConfig(
            this.#gl, this.#configuration,
            Shaders.map(shader => ({
                program: shader.program,
                uniforms: [
                    {name: "projection", values: [false, this.#projMatrix]},
                ],
            }))
        );
    }

    setBlending(sFactor, dFactor) {
        this.#gl.blendFunc(sFactor, dFactor);
    }

    #render(key, objs) {
        if (objs.size === 0) return;

        const {geometry, loader} = objs[Symbol.iterator]().next().value;

        this.#gl.useProgram(this.#configuration[key].program);
        const length = loader.loadData(this.#gl, this.#configuration, objs);

        this.#gl.bindVertexArray(this.#configuration[key].vertexArrays["body"]);
        if (geometry.indexed) {
            this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, this.#configuration[key].buffers.indexed);
            this.#gl.drawElementsInstanced(geometry.type, geometry.indexed.length, geometry.indexType, 0, length);
        } else if (geometry.indexType) {
            this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, this.#configuration[key].buffers.indexed);
            this.#gl.drawElements(geometry.type, length, geometry.indexType, 0);
        } else {
            this.#gl.drawArrays(geometry.type, 0, length);
        }

        this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, null);
        this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, null);
        this.#gl.bindVertexArray(null);
    }

    #prepare() {
        for (const sets of this.#objectsByType.values()) {
            for (const obj of sets.opaque) {
                if (!obj.isOpaque) {
                    sets.opaque.delete(obj);
                    sets.transparent.add(obj);
                }
            }

            for (const obj of sets.transparent) {
                if (obj.isOpaque) {
                    sets.transparent.delete(obj);
                    sets.opaque.add(obj);
                }
            }
        }
    }

    init() {
        super.init();

        this.#gl = this.canvas.getContext("webgl2", {premultipliedAlpha: true});

        WebglUtils.createFromConfig(this.#gl, Shaders, this.#configuration);
        this.setProjectionMatrix(m4.projection(this.canvasWidth, this.canvasHeight, 2));

        this.#gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.#gl.clearColor(0, 0, 0, 0);
        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT);

        this.#gl.enable(this.#gl.BLEND);
        this.setBlending(this.#gl.ONE, this.#gl.ONE_MINUS_SRC_ALPHA)

        this.#gl.pixelStorei(this.#gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

        this.#gl.enable(this.#gl.DEPTH_TEST);
        this.#gl.depthFunc(this.#gl.LEQUAL);
    }

    /**
     * @param {IRenderObject} obj
     */
    addObject(obj) {
        if (!(obj instanceof IRenderObject)) throw new Error(`Unsupported render object: ${obj?.constructor?.name ?? obj}`)

        let sets = this.#objectsByType.get(obj.group);
        if (!sets) {
            sets = {key: obj.key, transparent: new Set(), opaque: new Set()};
            this.#objectsByType.set(obj.group, sets);
        }

        if (obj.isOpaque) {
            sets.opaque.add(obj);
        } else {
            sets.transparent.add(obj);
        }
    }

    /**
     * @param {IRenderObject} obj
     */
    removeObject(obj) {
        if (this.#objectsByType.has(obj.group)) {
            const sets = this.#objectsByType.get(obj.group);
            if (!sets.transparent.delete(obj)) {
                sets.opaque.delete(obj);
            }
        }
    }
}