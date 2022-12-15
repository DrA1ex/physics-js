import {LineBody} from "../../../../physics/body/line.js";
import * as WebglUtils from "../../../../utils/webgl.js";
import * as MeshUtils from "../common/utils.js";

const GL = WebGL2RenderingContext;

export const Mesh = {
    key: "line",
    body: LineBody,
    type: GL.LINES,
    components: 2,
    loadData(gl, configuration, renderers) {
        const pointsPerItem = 2;
        const valuesPerItem = this.components * pointsPerItem;
        const positionBuffer = new Float32Array(renderers.length * valuesPerItem);
        const fillBuffer = new Float32Array(renderers.length * 4 * pointsPerItem);

        for (let i = 0; i < renderers.length; i++) {
            const renderer = renderers[i];
            const points = renderer.body.points;

            const fill = renderer.strokeRgb;
            MeshUtils.assignColor(fillBuffer, i * 2, 2, fill, renderer.opacity);

            positionBuffer[i * valuesPerItem] = points[0].x;
            positionBuffer[i * valuesPerItem + 1] = points[0].y;
            positionBuffer[i * valuesPerItem + 2] = points[1].x;
            positionBuffer[i * valuesPerItem + 3] = points[1].y;
        }

        WebglUtils.loadDataFromConfig(gl, configuration, [
            {
                program: this.key, buffers: [
                    {name: "point", data: positionBuffer},
                    {name: "fill", data: fillBuffer},
                ]
            }
        ]);

        return renderers.length * pointsPerItem;
    }
};

export const Config = {
    program: Mesh.key,
    vs: await fetch(new URL("./shaders/vertex.glsl", import.meta.url)).then(r => r.text()),
    fs: await fetch(new URL("../common/shaders/color_f.glsl", import.meta.url)).then(r => r.text()),
    attributes: [
        {name: "point"},
        {name: "fill"},
    ],
    uniforms: [
        {name: "resolution", type: "uniform2f"},
    ],
    buffers: [
        {name: "point", usageHint: GL.DYNAMIC_DRAW},
        {name: "fill", usageHint: GL.DYNAMIC_DRAW},
    ],
    vertexArrays: [{
        name: "body", entries: [
            {name: "point", type: GL.FLOAT, size: Mesh.components},
            {name: "fill", type: GL.FLOAT, size: 4},
        ]
    }],
};