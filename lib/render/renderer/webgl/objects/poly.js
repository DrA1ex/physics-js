import * as CommonUtils from "../../../../utils/common.js";
import * as TriangulationUtils from "../utils/triangulation.js";
import * as WebglUtils from "../utils/webgl.js";
import {ColoredObject, ColoredObjectLoader} from "./common/colored.js";
import {ColorFragment} from "./common/common_shaders.js";
import {PolyVertex} from "./common/object_shaders.js";

const GL = WebGL2RenderingContext;

/**
 * @extends ColoredObject<PolygonBody>
 */
export class PolygonObject extends ColoredObject {
    #triangulation = null;
    #pointsColor = null;

    get triangulation() {return this.#triangulation ?? (this.#triangulation = TriangulationUtils.earClipping(this.body.points));}
    get pointsCount() {return this.#pointsColor ?? (this.#pointsColor = this.body.points.length);}

    get geometry() {return Geometry;}
    get shader() {return Shader;}
    get loader() {return Loader;}
}

export class PolygonBodyLoader {
    #colorLoader = new ColoredObjectLoader(Geometry);

    loadData(gl, configuration, objects) {
        const vertexCount = CommonUtils.count(objects, o => o.pointsCount);
        const positionBuffer = new Float32Array(vertexCount * 3);
        const indexedBuffer = new Uint32Array((vertexCount - 2 * objects.size) * 3);

        let pIndex = 0;
        let vIndex = 0;

        for (const obj of objects) {
            const body = obj.body;
            const points = body.points;

            const indexedMesh = obj.triangulation;
            if (indexedMesh) {
                for (let k = 0; k < indexedMesh.length; k++) {
                    indexedBuffer[vIndex++] = pIndex + indexedMesh[k];
                }
            } else {
                vIndex += (points.length - 2) * 3;
            }

            for (let j = 0; j < points.length; j++) {
                const point = points[j];
                positionBuffer[pIndex * 3] = point.x;
                positionBuffer[pIndex * 3 + 1] = point.y;
                positionBuffer[pIndex * 3 + 2] = obj.z;
                ++pIndex
            }
        }

        WebglUtils.loadDataFromConfig(gl, configuration, [{
            program: Geometry.key, buffers: [
                {name: "point", data: positionBuffer},
                {name: "indexed", data: indexedBuffer},
            ]
        }]);

        this.#colorLoader.loadData(gl, configuration, objects);

        return indexedBuffer.length;
    }
}

export const Geometry = {
    key: "poly",
    type: GL.TRIANGLES,
    indexType: GL.UNSIGNED_INT,
    components: 2,
};

export const Shader = {
    program: Geometry.key,
    vs: PolyVertex.trim(),
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

        {name: "indexed", usageHint: GL.DYNAMIC_DRAW, type: GL.ELEMENT_ARRAY_BUFFER},
    ],
    vertexArrays: [{
        name: "body", entries: [
            {name: "point", type: GL.FLOAT, size: 3},
            {name: "color", type: GL.FLOAT, size: 4}
        ]
    }],
};

export const Loader = new PolygonBodyLoader();