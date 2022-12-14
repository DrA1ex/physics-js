import {AngleAnimation} from "../../lib/render/animation/angle.js";
import {EasingFunctions} from "../../lib/render/animation/base.js";
import {ColorAnimation} from "../../lib/render/animation/color.js";
import * as Params from "../common/params.js";
import * as CommonUtils from "../common/utils.js";

/** @enum {number} */
export const SunAzimuth = {
    Official: 90,
    Civil: 96,
    Nautical: 102,
    Astro: 108,
}

/** @enum {string} */
export const Themes = {
    dawn: "dawn-theme",
    twilight: "twilight-theme",
    day: "day-theme",
    sunset: "sunset-theme",
    dusk: "dusk-theme",
    night: "night-theme"
}

/** @enum {string} */
export const SunMode = {
    sync: "sync",
    periodic: "periodic",
    fixed: "fixed"
}

const scale = CommonUtils.applyViewportScale([
    {media: "(orientation: landscape) and (max-width: 500px)", scale: 0.25},
    {media: "(orientation: landscape) and (max-width: 900px)", scale: 0.5},
    {media: "(orientation: landscape) and (max-width: 1200px)", scale: 0.75},
    {media: "(orientation: landscape) and (max-width: 1400px)", scale: 1},
    {media: "(orientation: portrait) and (max-height: 500px)", scale: 0.25},
    {media: "(orientation: portrait) and (max-height: 900px)", scale: 0.5},
    {media: "(orientation: portrait) and (max-height: 1200px)", scale: 0.75},
    {media: "(orientation: portrait) and (max-height: 1400px)", scale: 1},
]);

const isMobile = CommonUtils.isMobile();
const isPortrait = window.matchMedia("(orientation: portrait)").matches;

const snowOptions = Params.parseSettings({
    watch: {parser: Params.Parser.bool, param: "watch", default: false},
    offsetTop: {parser: Params.Parser.float, param: "offset_top", default: -40},
    offsetBottom: {parser: Params.Parser.float, param: "offset_bottom", default: isPortrait ? -60 : -20},

    sunMode: {parser: Params.Parser.enum(SunMode), param: "sun", default: SunMode.sync},
    theme: {parser: Params.Parser.enum(Themes), param: "theme", default: Themes.day},
    sunChangeInterval: {parser: Params.Parser.float, param: "sun_interval", default: 60},

    themeChangeAnimationStep: {parser: Params.Parser.float, param: "theme_step", default: isMobile ? 1 : 0.25},
    themeChangeAnimationInterval: {parser: Params.Parser.float, param: "theme_interval", default: isMobile ? 1000 / 10 : 1000 / 24},
    themeChangeEasing: {parser: Params.Parser.enum(EasingFunctions), param: "theme_easing", default: EasingFunctions.easeInOutCubic},

    detectCoordinates: {parser: Params.Parser.bool, param: "gps", default: true},
    lat: {parser: Params.Parser.float, param: "lat", default: null},
    lon: {parser: Params.Parser.float, param: "lon", default: null},

    snowSpawnPeriod: {parser: Params.Parser.float, param: "snow_spawn", default: isMobile ? 1000 / 80 : 1000 / 160},
    snowPeriod: {parser: Params.Parser.float, param: "snow_emit", default: isMobile ? 1000 / 40 : 1000 / 80},

    snowdriftSegmentCount: {parser: Params.Parser.float, param: "sd_seg_cnt", default: isMobile ? 100 : 200},
    snowDriftInitialHeight: {parser: Params.Parser.float, param: "sd_height", default: 30},
    snowDriftMaxHeight: {parser: Params.Parser.float, param: "sd_max_height", default: 250},

    snowGrowth: {parser: Params.Parser.float, param: "sd_growth", default: 0.02},

    snowReducingCheckInterval: {parser: Params.Parser.float, param: "reducing_interval", default: 5000},
    snowReducingSteps: {parser: Params.Parser.float, param: "reducing_steps", default: 200},

    houseWidth: {parser: Params.Parser.float, param: "house_w", default: 400},
    houseHeight: {parser: Params.Parser.float, param: "house_h", default: 250},
    houseFlueWidth: {parser: Params.Parser.float, param: "flue_w", default: 30},

    roofSnowDriftPointsCount: {parser: Params.Parser.float, param: "roof_seg_cnt", default: 30},
    roofSnowDriftWidth: {parser: Params.Parser.float, param: "roof_sd_w", default: 246},
    roofSnowDriftHeight: {parser: Params.Parser.float, param: "roof_sd_h", default: 10},

    treeWiggle: {parser: Params.Parser.float, param: "tree_wiggle", default: Math.PI / 180 * 10},
    treeWiggleSpeed: {parser: Params.Parser.float, param: "tree_wiggle_speed", default: Math.PI / 180 * 2},

    smokeInterval: {parser: Params.Parser.float, param: "smoke_interval", default: isMobile ? 1000 / 12 : 1000 / 24},
});

export default {
    World: {
        OffsetTop: snowOptions.offsetTop,
        OffsetBottom: snowOptions.offsetBottom,
        Border: 100,
        Scale: scale,
    },

    Snow: {
        EmitPeriod: snowOptions.snowPeriod,
        SpawnInterval: snowOptions.snowSpawnPeriod,
        InitDuration: 5,
        Border: 10,

        GrowthFactor: snowOptions.snowGrowth,

        Reducing: {
            CheckInterval: snowOptions.snowReducingCheckInterval,
            StepCount: snowOptions.snowReducingSteps,
        }
    },

    House: {
        Width: snowOptions.houseWidth,
        Height: snowOptions.houseHeight,

        Flue: {
            Width: snowOptions.houseFlueWidth,
            Height: snowOptions.houseFlueWidth * 1.7,
        },

        RoofSnow: {
            Segments: snowOptions.roofSnowDriftPointsCount,
            Width: snowOptions.roofSnowDriftWidth,
            Height: snowOptions.roofSnowDriftHeight,
        }
    },

    SnowDrift: {
        Segments: snowOptions.snowdriftSegmentCount,
        Height: snowOptions.snowDriftInitialHeight,
        MaxHeight: snowOptions.snowDriftMaxHeight,
    },

    Smoke: {
        Interval: snowOptions.smokeInterval,
        Framerate: 12,
    },

    Background: {
        Tree: {
            Wiggle: snowOptions.treeWiggle,
            WiggleSpeed: snowOptions.treeWiggleSpeed,
        }
    },

    Style: {
        Watch: snowOptions.watch,
        WatchInterval: 500,

        Themes: Object.values(Themes),

        /** @type {{[key: string]: typeof IParametricAnimation}} */
        Properties: {
            "--sun-angle": AngleAnimation,
            "--bg-color-1": ColorAnimation,
            "--bg-color-2": ColorAnimation,
            "--bg-color-3": ColorAnimation,
            "--snow-color": ColorAnimation,
            "--smoke-color": ColorAnimation,
            "--mountain-color-top": ColorAnimation,
            "--mountain-color-bottom": ColorAnimation,
            "--tree-color-top": ColorAnimation,
            "--tree-color-bottom": ColorAnimation,
            "--house-fill": ColorAnimation,
            "--light-color": ColorAnimation,
        },

        Animation: {
            Step: snowOptions.themeChangeAnimationStep,
            Interval: snowOptions.themeChangeAnimationInterval,
            Easing: snowOptions.themeChangeEasing,
        }
    },

    Sun: {
        Mode: snowOptions.sunMode,
        Theme: snowOptions.theme,
        Interval: snowOptions.sunChangeInterval,

        Orbit: {
            OffsetX: 0,
            OffsetY: -0.1,
            Width: 0.4,
            Height: 0.4
        },

        Coordinates: {
            Detect: snowOptions.detectCoordinates,
            Lat: snowOptions.lat,
            Lon: snowOptions.lon,
        },

        Periods: [
            {theme: "dawn", config: {kind: "rising", azimuth: SunAzimuth.Astro}},
            {theme: "twilight", config: {kind: "rising", azimuth: SunAzimuth.Civil}},
            {theme: "day", config: {kind: "rising", azimuth: SunAzimuth.Official}},
            {theme: "sunset", config: {kind: "sunset", azimuth: SunAzimuth.Official}},
            {theme: "dusk", config: {kind: "sunset", azimuth: SunAzimuth.Civil}},
            {theme: "night", config: {kind: "sunset", azimuth: SunAzimuth.Astro}},
        ]
    }
}