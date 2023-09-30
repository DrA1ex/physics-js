import {CircleBody} from "../../lib/physics/body/circle.js";
import {BoundaryBox} from "../../lib/physics/common/boundary.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";
import {CanvasRenderer} from "../../lib/render/renderer/canvas/renderer.js";
import {Vector2} from "../../lib/utils/vector.js";
import {Bootstrap, State} from "../common/bootstrap.js";
import * as Utils from "../common/utils.js";
import {CommonBootstrapSettings, CommonSettings} from "../common/settings/default.js";
import {SettingsController} from "../common/ui/controllers/settings.js";

delete CommonSettings.Properties.resistance;
delete CommonSettings.Properties.gravity;
const Settings = CommonBootstrapSettings.fromQueryParams({bias: 0.1});
const settingsCtrl = SettingsController.defaultCtrl(Settings);

const BootstrapInstance = new Bootstrap(
    new CanvasRenderer(document.getElementById("canvas"), Settings.renderer), Settings);
settingsCtrl.subscribe(this, SettingsController.RECONFIGURE_EVENT, SettingsController.defaultReconfigure(BootstrapInstance));

const WorldRect = new BoundaryBox(0, BootstrapInstance.canvasWidth, 0, BootstrapInstance.canvasHeight);
BootstrapInstance.addConstraint(new InsetConstraint(WorldRect, 0.3));
BootstrapInstance.addRect(WorldRect)

const count = 50;
const size = 25;
const distance = 200;
const center = new Vector2(BootstrapInstance.canvasWidth / 2, BootstrapInstance.canvasHeight / 2);

const angleStep = Math.PI * 2 / count;
for (let i = 0; i < count; i++) {
    const position = Vector2.fromAngle(angleStep * i).scale(distance).add(center);

    let body;
    if (i % 2 === 0) {
        body = new CircleBody(position.x, position.y, size / 2);
    } else {
        const angleCount = 3 + Math.floor(Math.random() * 7);
        body = Utils.createRegularPoly(position, angleCount, size);
    }

    BootstrapInstance.addRigidBody(
        body.setFriction(Settings.common.friction)
            .setRestitution(Math.random())
            .setMass(1 + Math.random() * 5)
    );
}

const rotatingBody = new CircleBody(center.x + distance / 2, center.y + distance / 2, size * 2, 20);
BootstrapInstance.addRigidBody(rotatingBody);
BootstrapInstance.getRenderObject(rotatingBody).fill = false;

BootstrapInstance.enableHotKeys();
BootstrapInstance.run();

const timeout = 1000 / 60;
const delta = timeout / 1000 * Settings.solver.slowMotion;
setInterval(() => {
    if (BootstrapInstance.state !== State.play) {
        return;
    }

    if (rotatingBody._angle === undefined) {
        rotatingBody._angle = 0;
        rotatingBody._position = rotatingBody.position.copy();
    }

    rotatingBody._angle += Math.PI / 2 * delta;
    const nextPosition = rotatingBody._position.rotated(rotatingBody._angle, new Vector2(center.x, center.y));
    rotatingBody.setVelocity(nextPosition.delta(rotatingBody.position));

    for (const body of BootstrapInstance.rigidBodies) {
        if (body === rotatingBody) {
            continue;
        }

        body.angularVelocity *= 0.3;
        body.velocity.add(rotatingBody.position.delta(body.position).scaled(0.3 * delta));
    }
}, timeout);