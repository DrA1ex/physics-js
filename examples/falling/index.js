import {Bootstrap} from "../common/bootstrap.js";
import {BoundaryBox, CircleBody, RectBody} from "../../lib/physics/body.js";
import {GravityForce, ResistanceForce} from "../../lib/physics/force.js";
import {Collider} from "../../lib/physics/collision.js";
import * as Params from "../common/params.js";
import {InsetConstraint} from "../../lib/physics/constraint.js";
import * as Utils from "../common/utils.js";
import {Vector2} from "../../lib/utils/vector.js";
import * as CommonUtils from "../../lib/utils/common.js";

function _createBody(position, size) {
    let body;
    switch (Math.round(Math.random() * 2)) {
        case 0:
            body = new CircleBody(position.x, position.y, size / 2, size / 10);
            break;

        default:
            body = Utils.createRegularPoly(position, Math.floor(3 + Math.random() * 4), size)
            break;
    }

    return body.setFriction(options.friction).setRestitution(options.restitution);
}

function _accelerateBody(body) {
    const angle = Math.random() * Math.PI * 2;
    const force = Math.random() * options.gravity * 10 * body.mass;

    body.applyImpulse(new Vector2(Math.cos(angle), Math.sin(angle)).scale(force), body.position);
}

function _createBodies(x, y, box) {
    for (let k = 0; k < 10; k++) {
        const size = Math.floor(1 + Math.random() * 4) * 10;
        const pos = Vector2.fromAngle(Math.random() * Math.PI * 2).scale(size).add(new Vector2(x, y));

        pos.x = CommonUtils.clamp(box.left + size, box.right - size, pos.x);
        pos.y = CommonUtils.clamp(box.top + size, box.bottom - size, pos.y);

        const body = _createBody(pos, size);

        setTimeout(() => BootstrapInstance.addRigidBody(body), 16 * k);
    }
}

function _createBodiesByPattern(initBodies) {
    let last = null;
    for (const pattern of initBodies) {
        const yOffset = last?.position.y ?? BootstrapInstance.constraints[0]?.box.bottom ?? 0;

        let body;
        if (last instanceof CircleBody) {
            body = new RectBody(
                BootstrapInstance.canvasWidth / 2 + pattern.xOffset,
                yOffset - pattern.size / 2 - (last?.radius ?? 0) - 20,
                pattern.size,
                pattern.size,
                pattern.size / 10
            );
        } else {
            body = new CircleBody(
                BootstrapInstance.canvasWidth / 2 + pattern.xOffset,
                yOffset - pattern.size / 2 - (last?.width ?? 0) / 2 - 20,
                pattern.size / 2,
                pattern.size / 10
            );
        }

        BootstrapInstance.addRigidBody(body
            .setFriction(options.friction)
            .setRestitution(options.restitution));

        last = body;
    }
}

const options = Params.parse()
const BootstrapInstance = new Bootstrap(document.getElementById("canvas"), options);

BootstrapInstance.addForce(new GravityForce(options.gravity));
BootstrapInstance.addForce(new ResistanceForce(options.resistance));

const bottom = BootstrapInstance.canvasHeight - 120 - 1;
BootstrapInstance.addConstraint(new InsetConstraint(new BoundaryBox(1, BootstrapInstance.canvasWidth - 1, 1, bottom), 0.3));
BootstrapInstance.addRigidBody(
    new RectBody(BootstrapInstance.canvasWidth / 2, bottom - 10, BootstrapInstance.canvasWidth - 2, 20)
        .setActive(false)
        .setRestitution(0.3)
);

canvas.oncontextmenu = () => false;
canvas.onmousedown = canvas.ontouchstart = (e) => {
    e.preventDefault();

    const point = e.touches ? e.touches[0] : e;
    const bcr = e.target.getBoundingClientRect();

    const x = point.clientX - bcr.x;
    const y = point.clientY - bcr.y;
    if (y > bottom) {
        return;
    }

    const pointBox = new BoundaryBox(x, x, y, y);
    const body = BootstrapInstance.rigidBodies.find(b => b.active && Collider.isBoundaryCollide(pointBox, b.boundary));
    if (body) {
        _accelerateBody(body)
    } else {
        _createBodies(x, y, BootstrapInstance.constraints[0].box);
    }
}

_createBodiesByPattern([
    {xOffset: 0, size: 60},
    {xOffset: -20, size: 70},
    {xOffset: 10, size: 50},
    {xOffset: -5, size: 30},
    {xOffset: 5, size: 40},
    {xOffset: 0, size: 10},
    {xOffset: 0, size: 20},
    {xOffset: -2, size: 5},
    {xOffset: 2, size: 5},
    {xOffset: -1, size: 5},
    {xOffset: 1, size: 5},
    {xOffset: 0, size: 5},
]);

BootstrapInstance.enableHotKeys();
BootstrapInstance.run();