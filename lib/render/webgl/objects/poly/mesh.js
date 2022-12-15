import {PolygonBody} from "../../../../physics/body/poly.js";
import * as ColorUtils from "../../../../utils/color.js";
import * as WebglUtils from "../../../../utils/webgl.js";

const GL = WebGL2RenderingContext;

function assignColor(buffer, index, count, rgb, alpha) {
    index *= 4;
    for (let i = 0; i < count; i++) {
        for (let k = 0; k < 3; k++) {
            buffer[index + i * 4 + k] = rgb[k];
        }

        buffer[index + i * 4 + 3] = alpha;
    }
}

function setIndexedTriangle(buffer, index, pIndex, count) {
    index *= 3;
    for (let k = 0; k < count; k++) {
        buffer[index + k * 3] = pIndex;
        buffer[index + k * 3 + 1] = pIndex + k % count + 1;
        buffer[index + k * 3 + 2] = pIndex + (k + 1) % count + 1;
    }
}

export const Mesh = {
    key: "poly",
    body: PolygonBody,
    type: GL.TRIANGLES,
    indexType: GL.UNSIGNED_INT,
    components: 2,
    loadData(gl, configuration, renderers) {
        const vertexCount = renderers.reduce((p, c) => p + c.body.points.length, 0);
        const pointCnt = vertexCount + renderers.length;
        const positionBuffer = new Float32Array(pointCnt * this.components);
        const indexedBuffer = new Uint32Array(vertexCount * 3);
        const fillBuffer = new Float32Array(pointCnt * 4);

        let pIndex = 0;
        let vIndex = 0;
        for (let i = 0; i < renderers.length; i++) {
            const renderer = renderers[i];
            const body = renderer.body;
            const points = body.points;

            const fill = renderer.sprite?.filter?.color ?? renderer.fillStyle
            const color = ColorUtils.parseHexColor(fill);
            const alpha = renderer.opacity;
            assignColor(fillBuffer, pIndex, points.length + 1, color, alpha);

            setIndexedTriangle(indexedBuffer, vIndex, pIndex, points.length);
            vIndex += points.length;

            positionBuffer[pIndex * this.components] = body.position.x;
            positionBuffer[pIndex * this.components + 1] = body.position.y;
            ++pIndex;

            for (let j = 0; j < points.length; j++) {
                const point = points[j];
                positionBuffer[pIndex * this.components] = point.x;
                positionBuffer[pIndex * this.components + 1] = point.y;
                ++pIndex
            }
        }

        WebglUtils.loadDataFromConfig(gl, configuration, [
            {
                program: this.key, buffers: [
                    {name: "point", data: positionBuffer},
                    {name: "fill", data: fillBuffer},

                    {name: "indexed", data: indexedBuffer},
                ]
            }
        ]);

        return indexedBuffer.length;
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

        {name: "indexed", usageHint: GL.DYNAMIC_DRAW, type: GL.ELEMENT_ARRAY_BUFFER},
    ],
    vertexArrays: [{
        name: "body", entries: [
            {name: "point", type: GL.FLOAT, size: Mesh.components},
            {name: "fill", type: GL.FLOAT, size: 4}
        ]
    }],
};