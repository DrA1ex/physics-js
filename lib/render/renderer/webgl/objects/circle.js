import {Vector2} from "../../../../utils/vector.js";
import * as WebglUtils from "../utils/webgl.js";
import {ColoredObject, ColoredObjectLoader} from "./common/colored.js";
import {ColorFragment} from "./common/common_shaders.js";
import {BoundaryVertex, CircleVertex} from "./common/object_shaders.js";

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

/**
 * @extends ColoredObject<CircleBody>
 */
export class CircleObject extends ColoredObject {
    get pointsCount() {return 1;}

    get geometry() {return Geometry;}
    get shader() {return Shader;}
    get loader() {return Loader;}
}

export class CircleObjectLoader {
    #colorLoader = new ColoredObjectLoader(Geometry);

    loadData(gl, configuration, objects) {
        const positionBuffer = new Float32Array(objects.size * 3);
        const radiusBuffer = new Float32Array(objects.size);

        let i = 0;
        for (const obj of objects.values()) {
            const body = obj.body
            const pos = body.position;

            positionBuffer[i * 3] = pos.x;
            positionBuffer[i * 3 + 1] = pos.y;
            positionBuffer[i * 3 + 2] = obj.z;

            radiusBuffer[i] = body.radius;
            ++i;
        }

        WebglUtils.loadDataFromConfig(gl, configuration, [
            {
                program: Geometry.key, buffers: [
                    {name: "point", data: Geometry.points},
                    {name: "indexed", data: Geometry.indexed},

                    {name: "position", data: positionBuffer},
                    {name: "radius", data: radiusBuffer},
                ]
            }
        ]);

        this.#colorLoader.loadData(gl, configuration, objects);

        return objects.size;
    }
}

export const Geometry = {
    key: "circle",
    type: GL.TRIANGLES,
    components: 2,
    points: generateDiskMesh(segmentCount),
    indexType: GL.UNSIGNED_SHORT,
    indexed: generateDiskIndexed(segmentCount)
};

export const Shader = {
    program: Geometry.key,
    vs: CircleVertex.trim(),
    fs: ColorFragment.trim(),
    attributes: [
        {name: "point"},
        {name: "position"},
        {name: "radius"},
        {name: "color"},
    ],
    uniforms: [
        {name: "projection", type: "uniformMatrix4fv"},
    ],
    buffers: [
        {name: "point", usageHint: GL.STATIC_DRAW},
        {name: "position", usageHint: GL.DYNAMIC_DRAW},
        {name: "radius", usageHint: GL.DYNAMIC_DRAW},
        {name: "color", usageHint: GL.DYNAMIC_DRAW},

        {name: "indexed", usageHint: GL.STATIC_DRAW, type: GL.ELEMENT_ARRAY_BUFFER},
    ],
    vertexArrays: [{
        name: "body", entries: [
            {name: "point", type: GL.FLOAT, size: Geometry.components, divisor: 0},
            {name: "position", type: GL.FLOAT, size: 3, divisor: 1},
            {name: "radius", type: GL.FLOAT, size: 1, divisor: 1},
            {name: "color", type: GL.FLOAT, size: 4, divisor: 1},
        ]
    }],
};

export const Loader = new CircleObjectLoader();