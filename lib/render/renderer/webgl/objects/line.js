import * as WebglUtils from "../utils/webgl.js";
import {ColoredObject, ColoredObjectLoader} from "./common/colored.js";
import {ColorFragment} from "./common/common_shaders.js";
import {LineVertex} from "./common/object_shaders.js";

const GL = WebGL2RenderingContext;

/**
 * @extends ColoredObject<LineBody>
 */
export class LineObject extends ColoredObject {
    get pointsCount() {return 2;}

    get geometry() {return Geometry;}
    get shader() {return Shader;}
    get loader() {return Loader;}
}

class LineObjectLoader {
    #colorLoader = new ColoredObjectLoader(Geometry);

    loadData(gl, configuration, objects) {
        const pointsPerItem = 2;
        const valuesPerItem = 3 * pointsPerItem;
        const positionBuffer = new Float32Array(objects.size * valuesPerItem);

        let i = 0;
        for (const obj of objects.values()) {
            const points = obj.body.points;

            positionBuffer[i * valuesPerItem] = points[0].x;
            positionBuffer[i * valuesPerItem + 1] = points[0].y;
            positionBuffer[i * valuesPerItem + 2] = obj.z;
            positionBuffer[i * valuesPerItem + 3] = points[1].x;
            positionBuffer[i * valuesPerItem + 4] = points[1].y;
            positionBuffer[i * valuesPerItem + 5] = obj.z;

            ++i;
        }

        WebglUtils.loadDataFromConfig(gl, configuration, [
            {
                program: Geometry.key, buffers: [
                    {name: "point", data: positionBuffer},
                ]
            }
        ]);

        this.#colorLoader.loadData(gl, configuration, objects);

        return objects.size * pointsPerItem;
    }
}

export const Geometry = {
    key: "line",
    type: GL.LINES,
    components: 2,
};

export const Shader = {
    program: Geometry.key,
    vs: LineVertex.trim(),
    fs: ColorFragment.trim(),
    attributes: [
        {name: "point"},
        {name: "color"},
    ],
    uniforms: [
        {name: "projection", type: "uniformMatrix4fv"},
    ],
    buffers: [
        {name: "point", usageHint: GL.DYNAMIC_DRAW},
        {name: "color", usageHint: GL.DYNAMIC_DRAW},
    ],
    vertexArrays: [{
        name: "body", entries: [
            {name: "point", type: GL.FLOAT, size: 3},
            {name: "color", type: GL.FLOAT, size: 4},
        ]
    }],
};

export const Loader = new LineObjectLoader();