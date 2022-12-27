import {PolygonBody} from "../../../../physics/body/poly.js";
import * as WebglUtils from "../../../../utils/webgl.js";
import {PolygonBodyRenderer} from "../../../renderer/poly.js";
import * as MeshUtils from "../common/utils.js";

const GL = WebGL2RenderingContext;

export const Mesh = {
    key: "poly",
    renderer: PolygonBodyRenderer,
    type: GL.TRIANGLES,
    indexType: GL.UNSIGNED_INT,
    components: 2,
    loadData(gl, configuration, renderers) {
        const vertexCount = renderers.reduce((p, c) => p + c.body.points.length, 0);
        const positionBuffer = new Float32Array(vertexCount * this.components);
        const indexedBuffer = new Uint32Array((vertexCount - 2 * renderers.length) * 3);
        const fillBuffer = new Float32Array(vertexCount * 4);

        let pIndex = 0;
        let vIndex = 0;
        for (let i = 0; i < renderers.length; i++) {
            const renderer = renderers[i];
            const body = renderer.body;
            const points = body.points;

            const fill = renderer.sprite?.filter?.color ?? renderer.fillRgb
            MeshUtils.assignColor(fillBuffer, pIndex, points.length + 1, fill, renderer.opacity);

            const indexedMesh = renderer.triangulation;
            if (indexedMesh) {
                for (let k = 0; k < indexedMesh.length; k++) {
                    indexedBuffer[vIndex++] = pIndex + indexedMesh[k];
                }
            } else {
                vIndex += (points.length - 2) * 3;
            }

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