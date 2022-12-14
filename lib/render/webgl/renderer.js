import * as CommonUtils from "../../../examples/common/utils.js";
import * as ColorUtils from "../../utils/color.js";
import * as WebglUtils from "../../utils/webgl.js";
import ShaderConfig from "./shaders/config.js";

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


        WebglUtils.createFromConfig(this.#gl, ShaderConfig, this.#configuration);
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
        const pointCnt = 4;

        const buffer = new Float32Array(renderers.length * pointCnt * 2);
        for (let i = 0; i < renderers.length; i++) {
            const points = renderers[i].body.boundary.points();
            for (let k = 0; k < 4; k++) {
                buffer[i * pointCnt * 2 + k * 2] = points[k].x;
                buffer[i * pointCnt * 2 + k * 2 + 1] = points[k].y;
            }
        }

        const fillBuffer = new Float32Array(renderers.length * pointCnt * 4);
        for (let i = 0; i < renderers.length; i++) {
            const renderer = renderers[i];
            const fill = renderer.sprite?.filter?.color ?? renderer.fillStyle
            const color = ColorUtils.parseHexColor(fill);
            const alpha = renderer.opacity;

            for (let j = 0; j < pointCnt; j++) {
                for (let k = 0; k < 3; k++) {
                    fillBuffer[i * pointCnt * 4 + j * 4 + k] = color[k];
                }

                if (renderer.fill || renderer.fill === null && renderer.body.active) {
                    fillBuffer[i * pointCnt * 4 + j * 4 + 3] = alpha;
                } else {
                    fillBuffer[i * pointCnt * 4 + j * 4 + 3] = 0;
                }
            }
        }

        const indexBuffer = new Uint16Array(renderers.length * 6)
        for (let i = 0; i < renderers.length; i++) {
            indexBuffer[i * 6] = i * 4;
            indexBuffer[i * 6 + 1] = i * 4 + 1;
            indexBuffer[i * 6 + 2] = i * 4 + 2;
            indexBuffer[i * 6 + 3] = i * 4 + 2;
            indexBuffer[i * 6 + 4] = i * 4 + 3;
            indexBuffer[i * 6 + 5] = i * 4;
        }

        WebglUtils.loadDataFromConfig(this.#gl, this.#configuration, [
            {
                program: "boundary", buffers: [
                    {name: "position", data: buffer},
                    {name: "position_indexed", data: indexBuffer},
                    {name: "fill", data: fillBuffer},
                ]
            }
        ]);

        this.#gl.clear(this.#gl.COLOR_BUFFER_BIT);
        this.#gl.useProgram(this.#configuration.boundary.program);
        this.#gl.bindVertexArray(this.#configuration.boundary.vertexArrays["body"]);
        this.#gl.drawElements(
            this.#gl.TRIANGLES, renderers.length * 6, this.#gl.UNSIGNED_SHORT, 0
        );
    }
}