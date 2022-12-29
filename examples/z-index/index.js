import {EasingFunctions} from "../../lib/render/animation/base.js";
import {VectorAnimation} from "../../lib/render/animation/vector.js";
import {WebglRenderer} from "../../lib/render/renderer/webgl/renderer.js";
import {Vector2} from "../../lib/utils/vector.js";
import {Bootstrap} from "../common/bootstrap.js";
import * as Params from "../common/params.js";
import * as CommonUtils from "../common/utils.js";
import * as Geometry from "./geometry.js";


const options = Params.parse();
const BootstrapInstance = new Bootstrap(new WebglRenderer(document.getElementById("canvas"), options), options);
const center = new Vector2(BootstrapInstance.renderer.canvasWidth, BootstrapInstance.renderer.canvasHeight).scale(0.5);

Geometry.createFromConfig(BootstrapInstance, Geometry.config, center);

BootstrapInstance.enableHotKeys();
BootstrapInstance.run();

const groups = {};
for (const body of BootstrapInstance.rigidBodies) {
    const z = BootstrapInstance.getRenderObject(body).z;
    if (!groups[z]) groups[z] = {boundary: body.boundary.copy(), bodies: [], z};

    body.__position = body.position.copy();
    body.__target = body.position.copy();

    CommonUtils.unionBox(groups[z].boundary, body.boundary);
    groups[z].bodies.push(body);
}


const sortedGroups = Object.values(groups).sort((a, b) => a.z - b.z);

let splitWidthSum = 0;
for (const group of sortedGroups) {
    splitWidthSum += group.boundary.width;
}

const splitOffset = (BootstrapInstance.renderer.canvasWidth - splitWidthSum) / 2;
const animationDuration = 2;
let state = 0;

async function step() {
    let prevPosition = new Vector2(splitOffset);
    for (const group of sortedGroups) {
        for (const body of group.bodies) {
            if (state === 0) {
                const relativePosition = body.__position.delta(group.boundary.center);
                body.__target.x = prevPosition.x + relativePosition.x + group.boundary.width / 2;
            } else {
                body.__target.set(body.__position);
            }
        }

        prevPosition.x += group.boundary.width;
    }

    for (const body of BootstrapInstance.rigidBodies) {
        body.__animation = new VectorAnimation(body.position, body.__target, 1 / animationDuration)
            .setEasing(EasingFunctions.easeInOutQuart);
    }

    while (true) {
        let hasNext = false;
        await BootstrapInstance.requestPhysicsFrame(delta => {
            for (const body of BootstrapInstance.rigidBodies) {
                body.position.set(body.__animation.next(delta));
                hasNext ||= body.__animation.hasNextValue();
            }
        });

        if (!hasNext) break;
    }

    state += 1;
    if (state > 1) state = 0;

    setTimeout(step, 1000);
}

setTimeout(step, 1000);