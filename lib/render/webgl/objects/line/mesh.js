import {LineBody} from "../../../../physics/body/line.js";
import * as ColorUtils from "../../../../utils/color.js";
import * as WebglUtils from "../../../../utils/webgl.js";

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

        for (let i = 0; i < renderers.length; i++) {
            const points = renderers[i].body.points;

            positionBuffer[i * valuesPerItem] = points[0].x;
            positionBuffer[i * valuesPerItem + 1] = points[0].y;
            positionBuffer[i * valuesPerItem + 2] = points[1].x;
            positionBuffer[i * valuesPerItem + 3] = points[1].y;
        }

        const fillBuffer = new Float32Array(renderers.length * 4 * pointsPerItem);
        for (let i = 0; i < renderers.length; i++) {
            const renderer = renderers[i];
            const fill = renderer.sprite?.filter?.color ?? renderer.fillStyle
            const color = ColorUtils.parseHexColor(fill);
            const alpha = renderer.opacity;

            for (let j = 0; j < pointsPerItem; j++) {
                for (let k = 0; k < 3; k++) {
                    fillBuffer[i * 4 * pointsPerItem + j * pointsPerItem + k] = color[k];
                }

                fillBuffer[i * 4 * pointsPerItem + j * pointsPerItem + 3] = alpha;
            }
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
        {name: "point", usageHint: GL.STATIC_DRAW},
        {name: "fill", usageHint: GL.DYNAMIC_DRAW},
    ],
    vertexArrays: [{
        name: "body", entries: [
            {name: "point", type: GL.FLOAT, size: Mesh.components}
        ]
    }],
};