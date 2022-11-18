import {Bootstrap, State} from "../common/bootstrap.js";
import {BoundaryBox, CircleBody, RectBody} from "../../body.js";
import {GravityForce, ResistanceForce} from "../../force.js";
import {ConstraintType} from "../../enum.js";
import {Vector2} from "../../vector.js";
import {Collider} from "../../collision.js";

const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());

function parseBool(param) {
    if (param === "1") {
        return true;
    } else if (param === "0") {
        return false;
    }

    return null
}

const DebugMode = parseBool(params["debug"]) ?? false;
const ShowVectors = parseBool(params["debug_vector"]);
const ShowVectorLength = parseBool(params["debug_vector_length"]);
const ShowBoundary = parseBool(params["debug_boundary"]);

const SlowMotion = Number.parseFloat(params["slow_motion"] || "1");
const Gravity = Number.parseFloat(params["g"] || "100");
const Resistance = Math.min(1, Math.max(0, Number.parseFloat(params["resistance"] || "0.99")));

const BootstrapInstance = new Bootstrap(document.getElementById("canvas"), {
    debug: DebugMode, slowMotionRate: SlowMotion,
    showBoundary: ShowBoundary, showVectorLength: ShowVectorLength, showVector: ShowVectors
});

BootstrapInstance.addForce(new GravityForce(Gravity));
BootstrapInstance.addForce(new ResistanceForce(Resistance));

BootstrapInstance.addConstraint({
    type: ConstraintType.inset,
    box: new BoundaryBox(1, BootstrapInstance.canvasWidth, 1, BootstrapInstance.canvasHeight - 120 - 1),
    damper: new Vector2(0.5, 0.3),
});

const initBodies = [
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
];

let last = null;
for (const pattern of initBodies) {
    const yOffset = last?.position.y ?? BootstrapInstance.solver.constraints[0]?.box.bottom ?? 0;

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

    BootstrapInstance.addRigidBody(body);
    last = body;
}

canvas.oncontextmenu = () => false;
canvas.onmousedown = canvas.ontouchstart = (e) => {
    e.preventDefault();

    const point = e.touches ? e.touches[0] : e;
    const bcr = e.target.getBoundingClientRect();

    const x = point.clientX - bcr.x;
    const y = point.clientY - bcr.y;

    const pointBox = new BoundaryBox(x, x, y, y);
    const body = BootstrapInstance.solver.rigidBodies.find(b => Collider.detectBoundaryCollision(pointBox, b.boundary).result);
    if (body) {
        const angle = Math.random() * Math.PI * 2;
        const force = Math.random() * Gravity * 10 * body.mass;

        body.applyImpulse(new Vector2(Math.cos(angle), Math.sin(angle)).scale(force), body.position);
    } else {
        for (let k = 0; k < 5; k++) {
            const size = Math.floor(1 + Math.random() * 4) * 10;
            const body = new RectBody(x + 10 - Math.random() * 5, y + 10 - Math.random() * 5, size, size, size / 10);

            setTimeout(() => BootstrapInstance.solver.addRigidBody(body), 33 * k);
        }

        for (let k = 0; k < 5; k++) {
            const size = Math.floor(1 + Math.random() * 4) * 10;
            const body = new CircleBody(x + 10 - Math.random() * 5, y + 10 - Math.random() * 5, size / 2, size / 10);

            setTimeout(() => BootstrapInstance.solver.addRigidBody(body), 33 * (k + 5));
        }
    }
}

document.body.onkeydown = function (e) {
    switch (e.code) {
        case "Escape":
            BootstrapInstance.state === State.play ? BootstrapInstance.pause() : BootstrapInstance.play();
            break;

        case "Space":
            BootstrapInstance.stepMode();
            break;

        default:
            return;
    }

    e.preventDefault();
}

BootstrapInstance.run();