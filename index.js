// noinspection DuplicatedCode

const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());

const DEBUG = params["debug"] === "1";
const SlowMotion = Number.parseFloat(params["slow_motion"] || "1");
const Gravity = Number.parseFloat(params["g"] || "100");
const Resistance = Number.parseFloat(params["resistance"] || "0.99");

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

const FORCES = [];
const Bodies = [];

const Colliders = [
    {x: 0, y: 0, width: CanvasWidth, height: 1},
    {x: 0, y: CanvasHeight - 120, width: CanvasWidth, height: 1},
    {x: 0, y: 0, width: 1, height: CanvasHeight - 120},
    {x: CanvasWidth - 1, y: 0, width: 1, height: CanvasHeight - 120},
];

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

let last;
for (const pattern of initBodies) {
    const yOffset = last?.position.y ?? CanvasHeight - 120;
    const body = {
        position: {
            x: CanvasWidth / 2 + pattern.xOffset,
            y: yOffset - pattern.size / 2 - (last?.size ?? 0) / 2 - 20,
        },
        size: pattern.size,
        mass: pattern.size / 10,
        velocity: {x: 0, y: 0},
        active: true
    };

    Bodies.push(body);
    last = body;
}

function calculatePhysics(elapsed) {
    FORCES.splice(0);
    const delta = elapsed * SlowMotion;

    for (const body of Bodies) {
        if (!body.active) {
            continue;
        }

        body.position.x += body.velocity.x * delta;
        body.position.y += body.velocity.y * delta;

        body.velocity.y += Gravity * delta;
        body.velocity.y *= Resistance;
        body.velocity.x *= Resistance;


        FORCES.push({position: {...body.position}, velocity: {x: 0, y: Gravity}});
        processWorldCollision(body);
    }

    for (let i = 0; i < Bodies.length; i++) {
        for (let j = i + 1; j < Bodies.length; j++) {
            processCollision(Bodies[i], Bodies[j]);
        }
    }
}

function processWorldCollision(body) {
    const box = circleBox(body);
    if (box.left < 0) {
        body.position.x = body.size / 2;
        body.velocity.x = 0;
    } else if (box.right > CanvasWidth) {
        body.position.x = CanvasWidth - body.size / 2;
        body.velocity.x = 0;
    }

    if (box.top < 0) {
        body.position.y = body.size / 2;
        body.velocity.y = 0;
    } else if (box.bottom > CanvasHeight - 120) {
        body.position.y = CanvasHeight - body.size / 2 - 120;
        body.velocity.y = 0;
    }
}

function circleBox(body) {
    return {
        left: body.position.x - body.size / 2,
        right: body.position.x + body.size / 2,
        top: body.position.y - body.size / 2,
        bottom: body.position.y + body.size / 2
    }
}

function processCollision(body1, body2) {
    function _checkBoxCollision() {
        function _checkRange(start1, end1, start2, end2) {
            return start1 >= start2 && start1 <= end2 || end1 >= start2 && end1 <= end2;
        }

        const box1 = circleBox(body1);
        const box2 = circleBox(body2);

        return _checkRange(box1.left, box1.right, box2.left, box2.right)
            && _checkRange(box1.top, box1.bottom, box2.top, box2.bottom);
    }

    function _collide(dx, dy, distSquare, b1, b2) {
        const dot = ((b1.velocity.x - b2.velocity.x) * dx + (b1.velocity.y - b2.velocity.y) * dy);
        return {x: -dot / distSquare * dx, y: -dot / distSquare * dy};
    }

    if (_checkBoxCollision()) {
        const dx = body1.position.x - body2.position.x,
            dy = body1.position.y - body2.position.y;
        const collisionSizeSq = Math.pow((body1.size + body2.size) / 2, 2);

        const distSquare = dx * dx + dy * dy;
        if (distSquare <= collisionSizeSq) {
            const velocity1 = _collide(dx, dy, distSquare, body1, body2);
            const velocity2 = _collide(-dx, -dy, distSquare, body2, body1);

            FORCES.push({position: {...body1.position}, velocity: {...velocity1}});
            FORCES.push({position: {...body2.position}, velocity: {...velocity2}});

            body1.velocity.x += velocity1.x;
            body1.velocity.y += velocity1.y;

            body2.velocity.x += velocity2.x;
            body2.velocity.y += velocity2.y;
        }
    }
}

function render() {
    ctx.clearRect(0, 0, CanvasWidth, CanvasHeight);

    ctx.strokeStyle = "lightgrey";
    ctx.fillStyle = "black";

    for (const collider of Colliders) {
        ctx.fillRect(collider.x, collider.y, collider.width, collider.height);
    }

    for (const body of Bodies) {
        ctx.beginPath();
        ctx.arc(body.position.x, body.position.y, body.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    if (DEBUG) {
        ctx.strokeStyle = "green";
        for (const force of FORCES) {
            _drawVector(force.position, force.velocity);
        }

        for (const body of Bodies) {
            const box = circleBox(body);
            ctx.strokeRect(box.left, box.top, box.right - box.left, box.bottom - box.top);
        }

        ctx.strokeStyle = "red";
        for (const body of Bodies) {
            _drawVector(body.position, body.velocity);
        }
    }
}

function _drawVector(position, size) {
    ctx.beginPath();
    ctx.moveTo(position.x, position.y);
    ctx.lineTo(position.x + size.x, position.y + size.y);
    ctx.rect(position.x + size.x - 1, position.y + size.y - 1, 2, 2);
    ctx.stroke();
}

let lastStepTime = performance.now();
let elapsed = 0;

function step() {
    calculatePhysics(Math.min(elapsed, 33) / 1000);

    requestAnimationFrame(timestamp => {
        elapsed = timestamp - lastStepTime;
        lastStepTime = timestamp;

        render();
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

    let action;
    if (e.touches) {
        action = e.touches.length === 2 ? 2 : 1;
    } else {
        action = e.altKey || e.button === 2 ? 2 : 1;
    }

    if (action === 1) {
        const size = Math.floor(1 + Math.random() * 4) * 10;

        Bodies.push({
            position: {x, y},
            velocity: {x: 0, y: 0},
            size,
            mass: size / 10,
            active: true
        });
    }
}

step();