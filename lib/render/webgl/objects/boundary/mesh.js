const GL = WebGL2RenderingContext;

export const Mesh = {
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
};

export const Config = {
    program: "boundary",
    vs: await fetch(new URL("./shaders/vertex.glsl", import.meta.url)).then(r => r.text()),
    fs: await fetch(new URL("./shaders/fragment.glsl", import.meta.url)).then(r => r.text()),
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