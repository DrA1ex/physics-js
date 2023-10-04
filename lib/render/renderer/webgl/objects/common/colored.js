import * as ColorUtils from "../../../../../utils/color.js";
import * as CommonUtils from "../../../../../utils/common.js";
import * as WebglUtils from "../../utils/webgl.js";
import {IRenderObject} from "../base.js";

/**
 * @abstract
 */
export class ColoredObject extends IRenderObject {
    /**
     * @abstract
     * @return {number}
     */
    get pointsCount() {}

    #colorComponents = null;
    #color = "#626262";

    opacity = 1;

    get color() {return this.#color;}
    get isOpaque() {return this.opacity === 1;}

    /**
     * @param {string} value
     */
    set color(value) {
        this.#color = value;
        this.#colorComponents = null;
    }

    get colorComponents() {
        if (!this.#colorComponents) {
            this.#colorComponents = ColorUtils.parseHexColor(this.color);
        }

        return this.#colorComponents;
    }
}

export class ColoredObjectLoader {
    #geometry;

    constructor(geometry) {
        this.#geometry = geometry;
    }

    loadData(gl, configuration, objects) {
        const pointsCnt = CommonUtils.count(objects, o => o.pointsCount);
        const colorBuffer = new Float32Array(pointsCnt * 4);

        let i = 0;
        for (const obj of objects.values()) {
            const color = obj.colorComponents;
            const alpha = obj.opacity;

            for (let k = 0; k < obj.pointsCount; k++) {
                for (let k = 0; k < 3; k++) {
                    colorBuffer[i * 4 + k] = color[k];
                }

                colorBuffer[i * 4 + 3] = alpha;
                ++i;
            }
        }

        WebglUtils.loadDataFromConfig(gl, configuration, [{
            program: this.#geometry.key,
            buffers: [{name: "color", data: colorBuffer}]
        }]);
    }
}