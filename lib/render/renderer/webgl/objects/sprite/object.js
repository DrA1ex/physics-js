import * as WebglUtils from "../../utils/webgl.js";
import {ColoredObject, ColoredObjectLoader} from "../common/colored.js";

const GL = WebGL2RenderingContext;

export class SpriteObject extends ColoredObject {
    /*** @type {ITextureSource} */
    texture;

    get pointsCount() {return 1;}

    get shader() {return Shader;}
    get geometry() {return Geometry;}
    get loader() {return Loader;}
}

export class SpriteObjectLoader {
    #colorLoader = new ColoredObjectLoader(Geometry);

    /***
     * @param {WebGL2RenderingContext} gl
     * @param configuration
     * @param {Set<SpriteObject>} objects
     *
     * @return {number}
     */
    loadData(gl, configuration, objects) {
        const positionBuffer = new Float32Array(objects.size * 4);
        const sizeBuffer = new Float32Array(objects.size * Geometry.components);

        let i = 0;
        for (const obj of objects.values()) {
            const b = obj.body.boundary;

            positionBuffer[i * 4] = b.center.x;
            positionBuffer[i * 4 + 1] = b.center.y;
            positionBuffer[i * 4 + 2] = obj.z;
            positionBuffer[i * 4 + 3] = obj.body.angle;

            sizeBuffer[i * 2] = b.width;
            sizeBuffer[i * 2 + 1] = b.height;

            ++i;
        }

        WebglUtils.loadDataFromConfig(gl, configuration, [{
            program: Geometry.key, buffers: [
                {name: "point", data: Geometry.points},
                {name: "texcoord", data: Geometry.texCords},
                {name: "indexed", data: Geometry.indexed},

                {name: "position", data: positionBuffer},
                {name: "size", data: sizeBuffer},
            ]
        }]);

        this.#colorLoader.loadData(gl, configuration, objects);

        return objects.size;
    }


    /**
     * @param {WebGL2RenderingContext} gl
     * @param {*} configuration
     * @param {ITextureSource} obj
     * @param {number} slot
     */
    static loadTexture(gl, configuration, obj, slot) {
        WebglUtils.loadDataFromConfig(gl, configuration, [{
            program: Shader.program,
            textures: [{name: "u_texture", source: obj.source, slot}]
        }]);

        obj.slot = slot;
    }
}

export const Geometry = {
    key: "sprite",
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
    texCords: new Float32Array([
        0, 0,
        1, 0,
        1, 1,
        0, 1,
    ])
};

export const Shader = {
    program: Geometry.key,
    vs: await fetch(new URL("./shaders/vertex.glsl", import.meta.url)).then(r => r.text()),
    fs: await fetch(new URL("./shaders/fragment.glsl", import.meta.url)).then(r => r.text()),
    attributes: [
        {name: "point"},
        {name: "texcoord"},

        {name: "position"},
        {name: "size"},
        {name: "color"},
    ],
    uniforms: [
        {name: "projection", type: "uniformMatrix4fv"},
    ],
    textures: [{
        name: "u_texture",
        format: GL.RGBA,
        internalFormat: GL.RGBA,
        type: GL.UNSIGNED_BYTE,
        params: {
            min: GL.LINEAR,
            mag: GL.LINEAR,
            wrapS: GL.CLAMP_TO_EDGE,
            wrapT: GL.CLAMP_TO_EDGE,
        },
        generateMipmap: true
    }],
    buffers: [
        {name: "point", usageHint: GL.STATIC_DRAW},
        {name: "texcoord", usageHint: GL.STATIC_DRAW},

        {name: "position", usageHint: GL.DYNAMIC_DRAW},
        {name: "size", usageHint: GL.DYNAMIC_DRAW},
        {name: "color", usageHint: GL.DYNAMIC_DRAW},

        {name: "indexed", usageHint: GL.STATIC_DRAW, type: GL.ELEMENT_ARRAY_BUFFER},
    ],
    vertexArrays: [{
        name: "body", entries: [
            {name: "point", type: GL.FLOAT, size: Geometry.components, divisor: 0},
            {name: "texcoord", type: GL.FLOAT, size: 2, divisor: 0},

            {name: "position", type: GL.FLOAT, size: 4, divisor: 1},
            {name: "size", type: GL.FLOAT, size: 2, divisor: 1},
            {name: "color", type: GL.FLOAT, size: 4, divisor: 1},
        ]
    }],
};

export const Loader = new SpriteObjectLoader();