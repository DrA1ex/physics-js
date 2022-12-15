import * as CommonUtils from "../../../examples/common/utils.js";
import * as WebglUtils from "../../utils/webgl.js";
import {Configs, Meshes, MeshesOrder} from "./objects/index.js";

export class WebglRenderer {
    #useDpr;
    #gl;
    #canvas;
    #configuration = {};

    #dpr;
    #canvasWidth;
    #canvasHeight;


    constructor(canvas, options) {
        this.#canvas = canvas;
        this.#useDpr = options.useDpr ?? true;
    }

    init() {
        const {dpr, canvasWidth, canvasHeight} = CommonUtils.initCanvas(this.#canvas, this.#useDpr);

        this.#gl = this.#canvas.getContext("webgl2", {premultipliedAlpha: true});
        this.#dpr = dpr;
        this.#canvasWidth = canvasWidth;
        this.#canvasHeight = canvasHeight;


        WebglUtils.createFromConfig(this.#gl, Configs, this.#configuration);
        WebglUtils.loadDataFromConfig(
            this.#gl, this.#configuration,
            Object.values(Meshes).map(mesh => ({
                program: mesh.key,
                uniforms: [
                    {name: "resolution", values: [this.#canvasWidth, this.#canvasHeight]},
                ],
            }))
        );

        this.#gl.viewport(0, 0, this.#canvas.width, this.#canvas.height);
        this.#gl.clearColor(0, 0, 0, 0);
        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT);

        this.#gl.enable(this.#gl.BLEND);
        this.#gl.blendFunc(this.#gl.ONE, this.#gl.ONE_MINUS_SRC_ALPHA);
    }

    render(renderers) {
        const map = new Map();
        for (const key of Object.keys(Meshes)) {
            map.set(key, []);
        }

        const meshesEntries = MeshesOrder.map(k => [k, Meshes[k]]);
        for (const renderer of renderers) {
            if (
                !renderer.body ||
                renderer.fill === false ||
                renderer.fill === null && !renderer.body.active ||
                renderer.opacity === 0
            ) {
                continue;
            }

            for (const [key, mesh] of meshesEntries) {
                if (renderer.body instanceof mesh.body) {
                    map.get(key).push(renderer);
                    break;
                }
            }
        }


        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT);
        for (const [key, mesh] of meshesEntries) {
            const values = map.get(key);
            if (values.length === 0) continue;

            this.#gl.useProgram(this.#configuration[key].program);
            const length = mesh.loadData(this.#gl, this.#configuration, values);

            this.#gl.bindVertexArray(this.#configuration[key].vertexArrays["body"]);
            if (mesh.indexed) {
                this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, this.#configuration[key].buffers.indexed);
                this.#gl.drawElementsInstanced(mesh.type, mesh.indexed.length, mesh.indexType, 0, length);
            } else if (mesh.indexType) {
                this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, this.#configuration[key].buffers.indexed);
                this.#gl.drawElements(mesh.type, length, mesh.indexType, 0);
            } else {
                this.#gl.drawArrays(mesh.type, 0, length);
            }
        }

        this.#gl.bindBuffer(this.#gl.ELEMENT_ARRAY_BUFFER, null);
        this.#gl.bindBuffer(this.#gl.ARRAY_BUFFER, null);
        this.#gl.bindVertexArray(null);
    }
}