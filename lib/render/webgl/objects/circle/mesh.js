import {CircleBody} from "../../../../physics/body/circle.js";
import * as ColorUtils from "../../../../utils/color.js";
import {Vector2} from "../../../../utils/vector.js";
import * as WebglUtils from "../../../../utils/webgl.js";

const GL = WebGL2RenderingContext;

const segmentCount = 64;

function generateDiskMesh(cnt) {
    const result = new Float32Array((cnt + 1) * 2);
    result[0] = 0;
    result[1] = 0;

    const step = 2 * Math.PI / cnt;
    for (let i = 1; i <= cnt; i++) {
        const point = Vector2.fromAngle(-step * i);
        result[i * 2] = point.x;
        result[i * 2 + 1] = point.y
    }

    return result;
}

function generateDiskIndexed(cnt) {
    const result = new Uint16Array(cnt * 3);
    for (let k = 0; k < cnt; k++) {
        result[k * 3] = 0;
        result[k * 3 + 1] = k % cnt + 1;
        result[k * 3 + 2] = (k + 1) % cnt + 1;
    }

    return result;
}

export const Mesh = {
    key: "circle",
    body: CircleBody,
    type: GL.TRIANGLES,
    components: 2,
    points: generateDiskMesh(segmentCount),
    indexType: GL.UNSIGNED_SHORT,
    indexed: generateDiskIndexed(segmentCount),
    loadData(gl, configuration, renderers) {
        const positionBuffer = new Float32Array(renderers.length * this.components);
        const sizeBuffer = new Float32Array(renderers.length);

        for (let i = 0; i < renderers.length; i++) {
            const pos = renderers[i].body.position
            const body = renderers[i].body

            positionBuffer[i * 2] = pos.x;
            positionBuffer[i * 2 + 1] = pos.y;

            sizeBuffer[i] = body.radius;
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
                    {name: "radius", data: sizeBuffer},
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
        {name: "radius"},
        {name: "fill"},
    ],
    uniforms: [
        {name: "resolution", type: "uniform2f"},
    ],
    buffers: [
        {name: "point", usageHint: GL.STATIC_DRAW},
        {name: "position", usageHint: GL.DYNAMIC_DRAW},
        {name: "radius", usageHint: GL.DYNAMIC_DRAW},
        {name: "fill", usageHint: GL.DYNAMIC_DRAW},

        {name: "indexed", usageHint: GL.STATIC_DRAW, type: GL.ELEMENT_ARRAY_BUFFER},
    ],
    vertexArrays: [{
        name: "body", entries: [
            {name: "point", type: GL.FLOAT, size: Mesh.components, divisor: 0},
            {name: "position", type: GL.FLOAT, size: 2, divisor: 1},
            {name: "radius", type: GL.FLOAT, size: 1, divisor: 1},
            {name: "fill", type: GL.FLOAT, size: 4, divisor: 1},
        ]
    }],
};