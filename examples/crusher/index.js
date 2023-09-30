import {RectBody} from "../../lib/physics/body/rect.js";
import {BoundaryBox} from "../../lib/physics/common/boundary.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";
import {GravityForce, ResistanceForce} from "../../lib/physics/force.js";
import {CanvasRenderer} from "../../lib/render/renderer/canvas/renderer.js";
import * as GeomUtils from "../../lib/utils/geom.js";
import {Vector2} from "../../lib/utils/vector.js";
import {Bootstrap, State} from "../common/bootstrap.js";
import * as Utils from "../common/utils.js";
import {CommonBootstrapSettings} from "../common/settings/default.js";
import {SettingsController} from "../common/ui/controllers/settings.js";


const Settings = CommonBootstrapSettings.fromQueryParams({gravity: 500, steps: 20, bias: 0.1, beta: 0.8});
const settingsCtrl = SettingsController.defaultCtrl(Settings);
const BootstrapInstance = new Bootstrap(new CanvasRenderer(document.getElementById("canvas"), Settings.renderer), Settings);
settingsCtrl.subscribe(this, SettingsController.RECONFIGURE_EVENT, SettingsController.defaultReconfigure(BootstrapInstance));

const {canvasWidth, canvasHeight} = BootstrapInstance.renderer;
const yOffset = 20;

const crusherWidth = 100;
const crusherHeight = canvasHeight * 2 / 3;
const crusherSpeed = 120;
const crusherAngle = Math.PI / 180 * 3;
const crusherFill = "#bdbdbd";
const crusherStroke = "#424242";

const trashCount = 50;
const trashMinSize = 20;
const trashMaxSize = 40;

const delta = 1000 / 60;

const WorldRect = new BoundaryBox(0, BootstrapInstance.canvasWidth, 0, BootstrapInstance.canvasHeight);
BootstrapInstance.addConstraint(new InsetConstraint(WorldRect, 0.3));
BootstrapInstance.addRect(WorldRect)

BootstrapInstance.addForce(new GravityForce(Settings.common.gravity));
BootstrapInstance.addForce(new ResistanceForce(Settings.common.resistance));

const floor = BootstrapInstance.addRigidBody(new RectBody(canvasWidth / 2, yOffset + canvasHeight - crusherWidth / 2, canvasWidth, crusherWidth).setActive(false))
floor.renderer.fill = true;
floor.renderer.strokeStyle = crusherStroke;
floor.renderer.fillStyle = crusherFill;

const crushers = [];
crushers.push(BootstrapInstance.addRigidBody(
    new RectBody(crusherWidth, yOffset * 2 + canvasHeight - crusherHeight / 2 - crusherWidth, crusherWidth, crusherHeight)
        .setAngle(-crusherAngle)
        .setActive(false)
));

crushers.push(BootstrapInstance.addRigidBody(
    new RectBody(canvasWidth - crusherWidth, yOffset * 2 + canvasHeight - crusherHeight / 2 - crusherWidth, crusherWidth, crusherHeight)
        .setAngle(crusherAngle)
        .setActive(false)
))

for (const crusher of crushers) {
    crusher.renderer.fill = true;
    crusher.renderer.fillStyle = crusherFill;
    crusher.renderer.strokeStyle = crusherStroke;
}

for (const body of BootstrapInstance.rigidBodies) {
    body.setFriction(Settings.common.friction);
    body.setRestitution(Settings.common.restitution);
}


BootstrapInstance.enableHotKeys();
BootstrapInstance.run();

let direction = 1;
setInterval(() => {
    if (BootstrapInstance.state === State.pause) return;

    const [{body: crusher1}, {body: crusher2}] = crushers;
    if (crusher1.position.x < crusherWidth || GeomUtils.isBoundaryCollide(crusher1.boundary, crusher2.boundary)) {
        direction *= -1;
    }

    crusher1.position.add(new Vector2(direction * crusherSpeed * delta / 1000))
    crusher2.position.add(new Vector2(-direction * crusherSpeed * delta / 1000));
}, delta);

for (let i = 0; i < trashCount; i++) {
    const size = trashMinSize + Math.random() * (trashMaxSize - trashMinSize);
    const vertexCount = Math.floor(3 + Math.random() * 5);
    const body = Utils.createRegularPoly(new Vector2(canvasWidth / 2, canvasHeight / 2), vertexCount, size)
        .setFriction(Settings.common.friction)
        .setRestitution(Settings.common.restitution);

    setTimeout(() => BootstrapInstance.addRigidBody(body), delta * i);
}