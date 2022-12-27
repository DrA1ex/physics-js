import * as WebglUtils from "../../../../utils/webgl.js";
import {SpriteRenderer} from "../../../renderer/sprite.js";

import {Mesh as BoundaryMesh} from "../boundary/mesh.js";

const GL = WebGL2RenderingContext;

export const Mesh = {
    key: "sprite",
    renderer: SpriteRenderer,
    type: BoundaryMesh.type,
    components: BoundaryMesh.components,
    points: BoundaryMesh.points,
    indexType: BoundaryMesh.indexType,
    indexed: BoundaryMesh.indexed,
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

        WebglUtils.loadDataFromConfig(gl, configuration, [
            {
                program: this.key, buffers: [
                    {name: "point", data: this.points},
                    {name: "indexed", data: this.indexed},

                    {name: "position", data: positionBuffer},
                    {name: "size", data: sizeBuffer},
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
    ],
    uniforms: [
        {name: "resolution", type: "uniform2f"},
    ],
    buffers: [
        {name: "point", usageHint: GL.STATIC_DRAW},
        {name: "position", usageHint: GL.DYNAMIC_DRAW},
        {name: "size", usageHint: GL.DYNAMIC_DRAW},

        {name: "indexed", usageHint: GL.STATIC_DRAW, type: GL.ELEMENT_ARRAY_BUFFER},
    ],
    vertexArrays: [{
        name: "body", entries: [
            {name: "point", type: GL.FLOAT, size: Mesh.components, divisor: 0},
            {name: "position", type: GL.FLOAT, size: 2, divisor: 1},
            {name: "size", type: GL.FLOAT, size: 2, divisor: 1},
        ]
    }],
    textures: [{
        name: "sprite_tex"
    }]
};