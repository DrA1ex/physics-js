import {Bootstrap, State} from "../common/bootstrap.js";
import * as Params from "../common/params.js";
import {BoundaryBox, RectBody} from "../../lib/physics/body.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";
import {Collider} from "../../lib/physics/collider.js";
import {Vector2} from "../../lib/utils/vector.js";
import * as Utils from "../common/utils.js";
import {GravityForce, ResistanceForce} from "../../lib/physics/force.js";
import * as GeomUtils from "../../lib/utils/geom.js";


const options = Params.parse({g: 500, steps: 20, bias: 0.1, beta: 0.8});
const BootstrapInstance = new Bootstrap(document.getElementById("canvas"), options);

const {canvasWidth, canvasHeight} = BootstrapInstance;
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

BootstrapInstance.addConstraint(new InsetConstraint(new BoundaryBox(1, canvasWidth, 1, canvasHeight - 1), 0, 1));
BootstrapInstance.addForce(new GravityForce(options.gravity));
BootstrapInstance.addForce(new ResistanceForce(options.resistance));

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
    body.setFriction(options.friction);
    body.setRestitution(options.restitution);
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
        .setFriction(options.friction)
        .setRestitution(options.restitution);

    setTimeout(() => BootstrapInstance.addRigidBody(body), delta * i);
}