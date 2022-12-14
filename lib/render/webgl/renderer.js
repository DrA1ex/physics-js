import * as CommonUtils from "../../../examples/common/utils.js";
import * as ColorUtils from "../../utils/color.js";
import * as WebglUtils from "../../utils/webgl.js";
import {Configs, Meshes} from "./objects/index.js";

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
        WebglUtils.loadDataFromConfig(this.#gl, this.#configuration, [{
            program: "boundary",
            uniforms: [{name: "resolution", values: [this.#canvasWidth, this.#canvasHeight]}],
        }]);

        this.#gl.viewport(0, 0, this.#canvas.width, this.#canvas.height);
        this.#gl.clearColor(0, 0, 0, 0);
        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT);

        this.#gl.enable(this.#gl.BLEND);
        this.#gl.blendFunc(this.#gl.ONE, this.#gl.ONE_MINUS_SRC_ALPHA);
    }

    render(renderers) {
        const pointCnt = 1;

        const positionBuffer = new Float32Array(renderers.length * pointCnt * 2);
        const sizeBuffer = new Float32Array(renderers.length * pointCnt * 2);

        for (let i = 0; i < renderers.length; i++) {
            const pos = renderers[i].body.position
            const b = renderers[i].body.boundary

            positionBuffer[i * 2] = pos.x;
            positionBuffer[i * 2 + 1] = pos.y;

            sizeBuffer[i * 2] = b.width;
            sizeBuffer[i * 2 + 1] = b.height;
        }

        const fillBuffer = new Float32Array(renderers.length * pointCnt * 4);
        for (let i = 0; i < renderers.length; i++) {
            const renderer = renderers[i];
            const fill = renderer.sprite?.filter?.color ?? renderer.fillStyle
            const color = ColorUtils.parseHexColor(fill);
            const alpha = renderer.opacity;

            for (let k = 0; k < 3; k++) {
                fillBuffer[i * 4 + k] = color[k];
            }

            if (renderer.fill || renderer.fill === null && renderer.body.active) {
                fillBuffer[i * 4 + 3] = alpha;
            } else {
                fillBuffer[i * 4 + 3] = 0;
            }
        }

        WebglUtils.loadDataFromConfig(this.#gl, this.#configuration, [
            {
                program: "boundary", buffers: [
                    {name: "point", data: Meshes.boundary.points},
                    {name: "indexed", data: Meshes.boundary.indexed},

                    {name: "position", data: positionBuffer},
                    {name: "size", data: sizeBuffer},
                    {name: "fill", data: fillBuffer},
                ]
            }
        ]);

        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT);
        this.#gl.useProgram(this.#configuration.boundary.program);
        this.#gl.bindVertexArray(this.#configuration.boundary.vertexArrays["body"]);

        this.#gl.drawElementsInstanced(
            Meshes.boundary.type,
            6,
            Meshes.boundary.indexType,
            0,
            renderers.length
        );
    }
}