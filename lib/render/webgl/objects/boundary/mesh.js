import {Body} from "../../../../physics/body/base.js";
import * as ColorUtils from "../../../../utils/color.js";
import * as WebglUtils from "../../../../utils/webgl.js";

const GL = WebGL2RenderingContext;

export const Mesh = {
    key: "boundary",
    body: Body,
    type: GL.TRIANGLES,
    components: 2,
    points: new Float32Array([
        -0.5, -0.5,
        0.5, -0.5,
        0.5, 0.5,
        -0.5, 0.5
    ]),
    indexType: GL.UNSIGNED_SHORT,
    indexed: new Uint16Array([
        0, 1, 2,
        2, 3, 0
    ]),
    loadData(gl, configuration, renderers) {
        const positionBuffer = new Float32Array(renderers.length * this.components);
        const sizeBuffer = new Float32Array(renderers.length * this.components);

        for (let i = 0; i < renderers.length; i++) {
            const b = renderers[i].body.boundary

            positionBuffer[i * 2] = b.center.x;
            positionBuffer[i * 2 + 1] = b.center.y;

            sizeBuffer[i * 2] = b.width;
            sizeBuffer[i * 2 + 1] = b.height;
        }

        const fillBuffer = new Float32Array(renderers.length * 4);
        for (let i = 0; i < renderers.length; i++) {
            const renderer = renderers[i];
            const fill = renderer.sprite?.filter?.color ?? renderer.fillStyle
            const color = ColorUtils.parseHexColor(fill);
            const alpha = renderer.opacity;

            for (let k = 0; k < 3; k++) {
                fillBuffer[i * 4 + k] = color[k];
            }

            fillBuffer[i * 4 + 3] = alpha;
        }

        WebglUtils.loadDataFromConfig(gl, configuration, [
            {
                program: this.key, buffers: [
                    {name: "point", data: this.points},
                    {name: "indexed", data: this.indexed},

                    {name: "position", data: positionBuffer},
                    {name: "size", data: sizeBuffer},
                    {name: "fill", data: fillBuffer},
                ]
            }
        ]);

        return renderers.length;
    }
};

export const Config = {
    program: Mesh.key,
    vs: await fetch(new URL("./shaders/vertex.glsl", import.meta.url)).then(r => r.text()),
    fs: await fetch(new URL("../common/shaders/color_f.glsl", import.meta.url)).then(r => r.text()),
    attributes: [
        {name: "point"},
        {name: "position"},
        {name: "size"},
        {name: "fill"},
    ],
    uniforms: [
        {name: "resolution", type: "uniform2f"},
    ],
    buffers: [
        {name: "point", usageHint: GL.STATIC_DRAW},
        {name: "position", usageHint: GL.DYNAMIC_DRAW},
        {name: "size", usageHint: GL.DYNAMIC_DRAW},
        {name: "fill", usageHint: GL.DYNAMIC_DRAW},

        {name: "indexed", usageHint: GL.STATIC_DRAW, type: GL.ELEMENT_ARRAY_BUFFER},
    ],
    vertexArrays: [{
        name: "body", entries: [
            {name: "point", type: GL.FLOAT, size: Mesh.components, divisor: 0},
            {name: "position", type: GL.FLOAT, size: 2, divisor: 1},
            {name: "size", type: GL.FLOAT, size: 2, divisor: 1},
            {name: "fill", type: GL.FLOAT, size: 4, divisor: 1},
        ]
    }],
};