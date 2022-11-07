import {Body, CirceBody} from "./body.js";
import {Vector2} from "./vector.js";
import {Debug} from "./debug.js";

const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());

const DEBUG = params["debug"] === "1";
const SlowMotion = Number.parseFloat(params["slow_motion"] || "1");
const Gravity = Number.parseFloat(params["g"] || "100");
const Resistance = Number.parseFloat(params["resistance"] || "0.99");

const stats = document.getElementById("stats");
const canvas = document.getElementById("canvas");

const rect = canvas.getBoundingClientRect();
const dpr = window.devicePixelRatio;

const CanvasWidth = rect.width;
const CanvasHeight = rect.height;

canvas.style.width = CanvasWidth + "px";
canvas.style.height = CanvasHeight + "px";
canvas.width = CanvasWidth * dpr;
canvas.height = CanvasHeight * dpr;

const ctx = canvas.getContext('2d');
ctx.scale(dpr, dpr);

const DebugInstance = new Debug();
window.__app = {DebugInstance};

const Bodies = [];

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

const Constraints = [
    {left: 1, top: 1, right: CanvasWidth - 1, bottom: CanvasHeight - 120 - 1},
];

let last = null;
for (const pattern of initBodies) {
    const yOffset = last?.position.y ?? Constraints[0].bottom;

    const body = new CirceBody(
        CanvasWidth / 2 + pattern.xOffset,
        yOffset - pattern.size / 2 - (last?.radius ?? 0) - 20,
        pattern.size / 2,
        pattern.size / 10
    );

    Bodies.push(body);
    last = body;
}

function calculatePhysics(elapsed) {
    const delta = elapsed * SlowMotion;
    if (delta <= 0) {
        return;
    }

    DebugInstance.reset();
    for (let i = 0; i < Bodies.length; i++) {
        for (let j = i + 1; j < Bodies.length; j++) {
            Bodies[i].collider.collide(Bodies[j]);
        }
    }

    for (const constraint of Constraints) {
        for (let i = 0; i < Bodies.length; i++) {
            processInnerConstraints(Bodies[i], constraint);
        }
    }

    for (const body of Bodies) {
        if (!body.active) {
            continue;
        }

        DebugInstance.addForce(body.position, body.pseudoVelocity.copy().scale(1 / delta), "blue");

        body.position.add(body.velocity.copy().scale(delta).add(body.pseudoVelocity));
        body.pseudoVelocity.zero();

        body.velocity.y += Gravity * delta;
        body.velocity.scale(Resistance);

        DebugInstance.addForce(body.position, body.velocity.copy(), "red");
    }
}

function processInnerConstraints(body, constraint) {
    const box = body.boundary;
    if (box.left < constraint.left) {
        body.pseudoVelocity.x += constraint.left - box.left
        body.velocity.x *= -0.3;
    } else if (box.right > constraint.right) {
        body.pseudoVelocity.x += constraint.right - box.right;
        body.velocity.x *= -0.3;
    }

    if (box.top < constraint.top) {
        body.pseudoVelocity.y += constraint.top - box.top;
        body.velocity.y *= -0.1;
    } else if (box.bottom + body.pseudoVelocity.y > constraint.bottom) {
        body.pseudoVelocity.y += constraint.bottom - box.bottom;
        body.velocity.y *= -0.1;
    }
}

function render() {
    ctx.clearRect(0, 0, CanvasWidth, CanvasHeight);

    ctx.strokeStyle = "black";
    for (const constraint of Constraints) {
        ctx.strokeRect(constraint.left, constraint.top, constraint.right - constraint.left, constraint.bottom - constraint.top);
    }

    ctx.strokeStyle = "lightgrey";
    ctx.fillStyle = "black";
    for (const body of Bodies) {
        ctx.beginPath();

        if (body instanceof CirceBody) {
            ctx.arc(body.position.x, body.position.y, body.radius, 0, Math.PI * 2);
        }

        ctx.fill();
        ctx.stroke();
    }

    if (DEBUG) {
        DebugInstance.render(ctx);

        ctx.strokeStyle = "green";
        for (const body of Bodies) {
            const box = body.boundary;
            ctx.strokeRect(box.left, box.top, box.right - box.left, box.bottom - box.top);
        }
    }
}

let lastStepTime = performance.now();
let elapsed = 0;

function step() {
    const t = performance.now();
    calculatePhysics(Math.min(elapsed, 33) / 1000);
    const physicsTime = performance.now() - t;

    requestAnimationFrame(timestamp => {
        elapsed = timestamp - lastStepTime;
        lastStepTime = timestamp;

        const t = performance.now();
        render();
        const renderTime = performance.now() - t;

        stats.innerText = [
            `Bodies: ${Bodies.length}`,
            `Physics time: ${physicsTime.toFixed(2)}ms`,
            `Render time: ${renderTime.toFixed(2)}ms`
        ].join("\n");

        setTimeout(step);
    });
}

canvas.oncontextmenu = () => false;
canvas.onmousedown = canvas.ontouchstart = (e) => {
    e.preventDefault();

    const point = e.touches ? e.touches[0] : e;
    const bcr = e.target.getBoundingClientRect();

    const x = point.clientX - bcr.x;
    const y = point.clientY - bcr.y;

    const pointBox = new Body(x, y, 0);
    const body = Bodies.find(b => pointBox.collider.detectCollision(b));
    if (body) {
        const angle = Math.random() * Math.PI * 2;
        const force = Math.random() * Gravity * 10;

        body.velocity.add(new Vector2(Math.cos(angle), Math.sin(angle)).scale(force));
    } else {
        for (let k = 0; k < 5; k++) {
            const size = Math.floor(1 + Math.random() * 4) * 10;
            const body = new CirceBody(x + 10 - Math.random() * 5, y + 10 - Math.random() * 5, size / 2, size / 10);

            setTimeout(() => Bodies.push(body), 33 * k);
        }
    }
}

step();