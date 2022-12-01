import {Vector2} from "../../lib/utils/vector.js";
import {PolygonBody, RectBody} from "../../lib/physics/body.js";
import * as CommonUtils from "../../lib/utils/common.js";

/**
 * @param {Vector2} position
 * @param {number} vertexCount
 * @param {number} size
 * @return {PolygonBody}
 */
export function createRegularPoly(position, vertexCount, size) {
    if (vertexCount === 4) {
        return new RectBody(position.x, position.y, size, size);
    }

    const angleStep = Math.PI * 2 / Math.max(2, vertexCount);
    const points = new Array(vertexCount);
    for (let i = 0; i < vertexCount; i++) {
        points[i] = Vector2.fromAngle(i * angleStep).scale(size / 2);
    }

    return new PolygonBody(position.x, position.y, points);
}

/**
 * @param {TouchEvent | MouseEvent} e
 * @return {Vector2}
 */
export function getMousePos(e) {
    const point = (e.touches && e.touches[0] || e.changedTouches && e.changedTouches[0]) ?? e;
    const bcr = e.target.getBoundingClientRect();

    return new Vector2(point.clientX - bcr.x, point.clientY - bcr.y);
}

/**
 * @param {number} minComponent
 * @param {number} maxComponent
 * @param {number} [alpha=1]
 * @return {string}
 */
export function randomColor(minComponent, maxComponent, alpha = 1) {
    const components = new Array(4);
    for (let i = 0; i < 3; i++) {
        components[i] = Math.floor(minComponent + Math.random() * (maxComponent - minComponent));
    }

    components[3] = Math.floor(alpha * 255);

    return "#" + components.map(v => Math.min(255, Math.max(0, v)).toString(16)).join("");
}


/***
 * @param {Vector2} pos
 * @param {BoundaryBox} box
 * @param {number} size
 * @param {number} [border=0]
 * @return {void}
 */
export function clampBodyPosition(pos, box, size, border = 0) {
    pos.x = CommonUtils.clamp(box.left + size + border, box.right - size - border, pos.x);
    pos.y = CommonUtils.clamp(box.top + size + border, box.bottom - size - border, pos.y);
}


/**
 * @param {HTMLCanvasElement} canvas
 * @param {boolean} [useDpr=true]
 * @return {{canvasWidth: number, dpr: number, canvasHeight: number}}
 */
export function initCanvas(canvas, useDpr = true) {
    const rect = canvas.getBoundingClientRect();

    const dpr = useDpr ? window.devicePixelRatio : 1;
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;

    canvas.style.width = canvasWidth + "px";
    canvas.style.height = canvasHeight + "px";
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;

    return {dpr, canvasWidth, canvasHeight};
}

export function applyViewportScale(mediaQueries, userSalable = 0) {
    let pageScale = 1;
    for (const {media, scale} of mediaQueries) {
        if (window.matchMedia(media).matches) {
            pageScale = scale;
            break;
        }
    }

    let viewport = document.querySelector("meta[name=viewport]");
    if (!viewport) {
        viewport = document.createElement("meta");
        viewport.name = "viewport";

        document.head.appendChild(viewport);
    }

    const viewportAttData = `width=device-width, initial-scale=${pageScale}, maximum-scale=${pageScale}, user-scalable=${userSalable}, viewport-fit=cover`
    viewport.setAttribute('content', viewportAttData);
}

export function isMobile() {
    if (globalThis.window) {
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }

    return false;
}