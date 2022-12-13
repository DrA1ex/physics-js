/**
 * @typedef {function(t:number):number} EasingFunction
 */


/** @enum {string} */
export const KeyframeType = {
    absolute: "absolute",
    relative: "relative",
}
/** @enum {string} */
export const AnimationProperty = {
    /* Renderer */
    opacity: "opacity",
    fillStyle: "fillStyle",
    strokeStyle: "strokeStyle",
    /* Circle */
    radius: "radius",
    /* Rect */
    width: "width",
    height: "height",
    /* Polygon */
    xScale: "xScale",
    yScale: "yScale",
    xSkew: "xSkew",
    ySkew: "ySkew",
}
/** @enum {string} */
export const AnimationPropertyType = {
    number: "number",
    color: "color",
    percent: "percent",
    angle: "angle",
}
/**
 * @type {{[key: AnimationProperty]: AnimationPropertyType}}
 */
export const AnimationPropertyTypeMapping = {
    /* Renderer */
    [AnimationProperty.opacity]: AnimationPropertyType.number,
    [AnimationProperty.fillStyle]: AnimationPropertyType.color,
    [AnimationProperty.strokeStyle]: AnimationPropertyType.color,
    /* Circle */
    [AnimationProperty.radius]: AnimationPropertyType.number,
    /* Rect */
    [AnimationProperty.width]: AnimationPropertyType.number,
    [AnimationProperty.height]: AnimationPropertyType.number,
    /* Polygon */
    [AnimationProperty.xScale]: AnimationPropertyType.number,
    [AnimationProperty.yScale]: AnimationPropertyType.number,
    [AnimationProperty.xSkew]: AnimationPropertyType.number,
    [AnimationProperty.ySkew]: AnimationPropertyType.number,
} // noinspection JSUnusedGlobalSymbols
/**
 * @enum {string}
 */
export const AnimationAxis = {
    x: "x",
    xInverted: "xInverted",
    y: "y",
    yInverted: "yInverted"
}
/**
 * @enum {string}
 */
export const AnimationDirection = {
    forward: "forward",
    backward: "backward",
    both: "both",
}
/**
 * @enum {string}
 */
export const AnimationMode = {
    repeating: "repeating",
    once: "once",
}
/**
 * @enum {string}
 */
export const AngleAnimationDirection = {
    clockwise: "clockwise",
    anticlockwise: "anticlockwise",
    nearest: "nearest",
    unset: "unset",
}

/**
 * @readonly
 * @enum {EasingFunction}
 */
export const EasingFunctions = {
    linear: t => t,
    easeInSine: x => 1 - Math.cos((x * Math.PI) / 2),
    easeOutSine: x => Math.sin((x * Math.PI) / 2),
    easeInOutSine: x => -(Math.cos(Math.PI * x) - 1) / 2,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInQuart: t => t * t * t * t,
    easeOutQuart: t => 1 - (--t) * t * t * t,
    easeInOutQuart: t => t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    easeInQuint: t => t * t * t * t * t,
    easeOutQuint: t => 1 + (--t) * t * t * t * t,
    easeInOutQuint: t => t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
    easeInCirc: t => 1 - Math.sqrt(1 - Math.pow(t, 2)),
    easeOutCirc: t => Math.sqrt(1 - Math.pow(t - 1, 2)),
    easeInOutCirc: t => t < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
    easeInElastic: t => t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * (2 * Math.PI) / 3),
    easeOutElastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1,
    easeInOutElastic: t => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI) / 4.5)) / 2 : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI) / 4.5)) / 2 + 1,
}

export class ILayerAnimation {
    /**
     * @abstract
     *
     * @param {Layer} layer
     * @param {number} delta
     * @return {void}
     */
    apply(layer, delta) {}
}

export class IPathAnimation {

    /**
     * @abstract
     *
     * @param {Path} layer
     * @param {number} delta
     * @return {void}
     */
    apply(layer, delta) {}
}

/**
 * @abstract
 * @template T, R
 * @extends T
 */
export class IParametricAnimation {
    /**
     * @abstract
     *
     * @param {EasingFunction} easing
     * @return {T}
     */
    setEasing(easing) {}

    /**
     * @abstract
     *
     * @param {AnimationMode} value
     * @return {T}
     */
    setMode(value) {}

    /**
     * @abstract
     *
     * @param {AnimationDirection} value
     * @return {T}
     */
    setDirection(value) {}

    /**
     * @abstract
     *
     * @param {number} value
     * @return {T}
     */
    setRepeatLimit(value) {}

    /**
     * @abstract
     *
     * @return {boolean}
     */
    hasNextValue() {}

    /**
     * @abstract
     *
     * @param {number} delta
     * @return {R}
     */
    next(delta) {}

    /**
     * @abstract
     */
    reset() {}
}