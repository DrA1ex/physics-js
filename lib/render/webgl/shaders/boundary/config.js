const GL = WebGL2RenderingContext;

export default {
    program: "boundary",
    vs: await fetch(new URL("./boundary_v.glsl", import.meta.url)).then(r => r.text()),
    fs: await fetch(new URL("./boundary_f.glsl", import.meta.url)).then(r => r.text()),
    attributes: [
        {name: "position"},
        {name: "fill"},
    ],
    uniforms: [
        {name: "resolution", type: "uniform2f"},
    ],
    buffers: [
        {name: "position", usageHint: GL.DYNAMIC_DRAW},
        {name: "position_indexed", usageHint: GL.DYNAMIC_DRAW, type: GL.ELEMENT_ARRAY_BUFFER},
        {name: "fill", usageHint: GL.DYNAMIC_DRAW},
    ],
    vertexArrays: [{
        name: "body", entries: [
            {name: "position", type: GL.FLOAT, size: 2, divisor: 0},
            {name: "fill", type: GL.FLOAT, size: 4, divisor: 0},
        ]
    }],
};