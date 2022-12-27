import {PolygonBody} from "../../lib/physics/body/poly.js";
import {RectBody} from "../../lib/physics/body/rect.js";
import * as CommonUtils from "../../lib/utils/common.js";
import {Vector2} from "../../lib/utils/vector.js";

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
 * @return {string}
 */
export function randomColor(minComponent, maxComponent) {
    const components = new Array(3);
    for (let i = 0; i < 3; i++) {
        components[i] = Math.floor(minComponent + Math.random() * (maxComponent - minComponent));
    }

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

    return pageScale;
}

export function isMobile() {
    if (globalThis.window) {
        return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    }

    return false;
}

/** @enum {string} */
export const Browser = {
    chrome: "Chrome",
    firefox: "Firefox",
    safari: "Safari",
    edge: "Edge",
    ie: "Internet Explorer",
    other: "Other",
}

/** @enum {string} */
export const Platform = {
    windows: "Windows",
    macos: "Mac OS",
    linux: "Linux",
    ios: "iOS",
    android: "Android",
    other: "Other"
}

/** @return {{browser: Browser, os: Platform}} */
export function getBrowser() {
    const browser = navigator.userAgent.match(/(Chrome|Firefox|Safari|Edg|MSIE)/i)[1] ?? "";
    const platform = navigator.userAgent.match(/(mac|win|linux|android|ipad|iphone|ipod)/i)[1] ?? "";

    const browserMapping = {
        chrome: Browser.chrome,
        firefox: Browser.firefox,
        safari: Browser.safari,
        edg: Browser.edge,
        msie: Browser.ie,
    }

    const platformMapping = {
        mac: Platform.macos,
        win: Platform.windows,
        linux: Platform.linux,
        android: Platform.android,
        ipad: Platform.ios,
        iphone: Platform.ios,
        ipod: Platform.ios
    }

    return {
        browser: browserMapping[browser.toLowerCase()] ?? Browser.other,
        os: platformMapping[platform.toLowerCase()] ?? Platform.other
    };
}

export function installGlobalErrorHook() {
    addEventListener("error", (event) => {
        alert(event.error?.stack ?? event.message);
    });
}


export function* reversed(array) {
    for (let i = array.length - 1; i >= 0; i--) {
        yield array[i];
    }
}