import {Bootstrap, State} from "../common/bootstrap.js";
import * as Params from "../common/params.js";
import {BoundaryBox, CircleBody, PolygonBody, RectBody} from "../../lib/physics/body.js";
import {Vector2} from "../../lib/utils/vector.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";

function _generatePoly(angleCnt) {
    const angleStep = Math.PI * 2 / angleCnt;
    const result = new Array(angleCnt);
    for (let i = 0; i < angleCnt; i++) {
        result[i] = Vector2.fromAngle(i * angleStep).scaled(size / 2);
    }

    return result;
}

const options = Params.parse()
const BootstrapInstance = new Bootstrap(document.getElementById("canvas"), options);

BootstrapInstance.addConstraint(
    new InsetConstraint(new BoundaryBox(0, BootstrapInstance.canvasWidth, 0, BootstrapInstance.canvasHeight), 0.3)
);

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
        if (angleCount === 4) {
            body = new RectBody(position.x, position.y, size, size);
        } else {
            body = new PolygonBody(position.x, position.y, _generatePoly(angleCount));
        }
    }

    BootstrapInstance.addRigidBody(
        body.setFriction(options.friction)
            .setRestitution(Math.random())
            .setMass(1 + Math.random() * 5)
    );
}

BootstrapInstance.addRigidBody(new CircleBody(center.x + distance / 2, center.y + distance / 2, size * 2, 20));

BootstrapInstance.enableHotKeys();
BootstrapInstance.run();

const timeout = 1000 / 60;
const delta = timeout / 1000 * options.slowMotion;
setInterval(() => {
    if (BootstrapInstance.state !== State.play) {
        return;
    }

    const count = BootstrapInstance.rigidBodies.length;
    const rotatingBody = BootstrapInstance.rigidBodies[count - 1];
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