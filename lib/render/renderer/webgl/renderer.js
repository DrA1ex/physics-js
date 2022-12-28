import {Body} from "../../../physics/body/base.js";
import {CircleBody} from "../../../physics/body/circle.js";
import {LineBody} from "../../../physics/body/line.js";
import {PolygonBody} from "../../../physics/body/poly.js";
import {IRenderer} from "../base.js";
import {BoundaryObject} from "./objects/boundary/object.js";
import {CircleObject} from "./objects/circle/object.js";
import {Shaders} from "./objects/index.js";
import {LineObject} from "./objects/line/object.js";
import {PolygonObject} from "./objects/poly/object.js";
import * as WebglUtils from "./utils/webgl.js";

/**
 * @extends IRenderer<IRenderObject>
 */
export class WebglRenderer extends IRenderer {
    #bodyToRenderObjectMapping = new Map([
        [LineBody, LineObject],
        [PolygonBody, PolygonObject],
        [CircleBody, CircleObject],
        [Body, BoundaryObject]
    ]);

    /** @type {WebGL2RenderingContext} */
    #gl;
    #configuration = {};

    /**
     * @type {Map<string, {opaque: Set<IRenderObject>, transparent: Set<IRenderObject>}>}
     */
    #objectsByType = new Map();

    get bodyToRenderObjectMapping() {
        return this.#bodyToRenderObjectMapping;
    }

    render(delta) {
        this.#prepare();

        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT | this.#gl.DEPTH_BUFFER_BIT);

        this.#gl.depthMask(true);
        for (const [key, data] of this.#objectsByType.entries()) {
            this.#render(key, data.opaque);
        }

        this.#gl.depthMask(false);
        for (const [key, data] of this.#objectsByType.entries()) {
            this.#render(key, data.transparent);
        }
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
                if (!obj.isIOpaque) {
                    sets.opaque.delete(obj);
                    sets.transparent.add(obj);
                }
            }

            for (const obj of sets.transparent) {
                if (obj.isIOpaque) {
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
        WebglUtils.loadDataFromConfig(
            this.#gl, this.#configuration,
            Shaders.map(shader => ({
                program: shader.program,
                uniforms: [
                    {name: "resolution", values: [this.canvasWidth, this.canvasHeight]},
                ],
            }))
        );

        this.#gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.#gl.clearColor(0, 0, 0, 0);
        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT);

        this.#gl.enable(this.#gl.BLEND);
        this.#gl.blendFunc(this.#gl.ONE, this.#gl.ONE_MINUS_SRC_ALPHA);

        this.#gl.enable(this.#gl.DEPTH_TEST);
        this.#gl.depthFunc(this.#gl.LEQUAL);
    }

    /**
     * @param {IRenderObject} obj
     */
    addObject(obj) {
        let sets = this.#objectsByType.get(obj.key);
        if (!sets) {
            sets = {transparent: new Set(), opaque: new Set()};
            this.#objectsByType.set(obj.key, sets);
        }

        if (obj.isIOpaque) {
            sets.opaque.add(obj);
        } else {
            sets.transparent.add(obj);
        }
    }

    /**
     * @param {IRenderObject} obj
     */
    removeObject(obj) {
        if (this.#objectsByType.has(obj.key)) {
            const sets = this.#objectsByType.get(obj.key);
            if (!sets.transparent.delete(obj)) {
                sets.opaque.delete(obj);
            }
        }
    }
}