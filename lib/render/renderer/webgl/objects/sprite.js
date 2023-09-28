import * as WebglUtils from "../utils/webgl.js";
import {ColoredObject, ColoredObjectLoader} from "./common/colored.js";
import {SpriteFragment, SpriteVertex} from "./common/object_shaders.js";

const GL = WebGL2RenderingContext;

export class SpriteObject extends ColoredObject {
    /*** @type {ITextureSource} */
    texture;
    scale = 1;

    constructor(body) {
        super(body);

        this.color = "#ffffff";
    }

    get pointsCount() {return 1;}
    get group() {return `${super.group}_${this.texture.id}`;}

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
        const texture = objects[Symbol.iterator]().next().value.texture;
        if (!texture) return 0;

        const positionBuffer = new Float32Array(objects.size * 4);
        const sizeBuffer = new Float32Array(objects.size * Geometry.components);

        let i = 0;
        for (const obj of objects.values()) {
            const b = obj.body.boundary;

            positionBuffer[i * 4] = b.center.x;
            positionBuffer[i * 4 + 1] = b.center.y;
            positionBuffer[i * 4 + 2] = obj.z;
            positionBuffer[i * 4 + 3] = obj.body.angle;

            sizeBuffer[i * 2] = b.width * obj.scale;
            sizeBuffer[i * 2 + 1] = b.height * obj.scale;

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

        if (texture.glTexture === null) {
            WebglUtils.loadTextures(gl, configuration, Shader.program,
                [{
                    name: "u_texture",
                    source: texture,
                    params: {
                        format: texture.glFormat,
                        internalFormat: texture.glInternalFormat,
                        type: texture.glType,
                        params: {
                            min: texture.glMin,
                            mag: texture.glMag,
                            wrapS: texture.glWrapS,
                            wrapT: texture.glWrapT,
                        },
                        generateMipmap: texture.glGenerateMipmap
                    },
                }]
            );
        } else {
            WebglUtils.assignTextures(gl, configuration, Geometry.key, texture.glTexture);
        }

        this.#colorLoader.loadData(gl, configuration, objects);

        return objects.size;
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
    vs: SpriteVertex.trim(),
    fs: SpriteFragment.trim(),
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
    textures: [{name: "u_texture"}],
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