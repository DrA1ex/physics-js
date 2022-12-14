import {AngleAnimation} from "../../lib/render/animation/angle.js";
import {EasingFunctions} from "../../lib/render/animation/base.js";
import {ColorAnimation} from "../../lib/render/animation/color.js";
import * as Params from "../common/params.js";
import * as CommonUtils from "../common/utils.js";
import {Browser, Platform} from "../common/utils.js";

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

/**
 * @typedef {{
 *      name: string,
 *      theme: {step: number, interval: number},
 *      snow: {emit: number, spawn: number, segments: number},
 *      smoke: {interval: number},
 *      dpr: boolean
 * }} Preset
 *
 * @enum {Preset}
 */
const GraphicsPreset = {
    microwave: {
        name: "Microwave",
        theme: {
            step: 4,
            interval: 1000,
        },
        snow: {
            emit: 1000 / 3,
            spawn: 1000 / 10,
            segments: 30,
        },
        smoke: {
            interval: 1000,
        },
        dpr: false,
    },
    low: {
        name: "Low",
        theme: {
            step: 2,
            interval: 1000 / 6,
        },
        snow: {
            emit: 1000 / 24,
            spawn: 1000 / 50,
            segments: 60,
        },
        smoke: {
            interval: 1000 / 6,
        },
        dpr: false,
    },
    medium: {
        name: "Medium",
        theme: {
            step: 1,
            interval: 1000 / 12,
        },
        snow: {
            emit: 1000 / 40,
            spawn: 1000 / 80,
            segments: 100
        },
        smoke: {
            interval: 1000 / 12
        },
        dpr: false,
    },
    high: {
        name: "High",
        theme: {
            step: 0.25,
            interval: 1000 / 30,
        },
        snow: {
            emit: 1000 / 80,
            spawn: 1000 / 160,
            segments: 200
        },
        smoke: {
            interval: 1000 / 24
        },
        dpr: true,
    },
    ultra: {
        name: "Ultra",
        theme: {
            step: 0.1,
            interval: 1000 / 60,
        },
        snow: {
            emit: 1000 / 100,
            spawn: 1000 / 200,
            segments: 300
        },
        smoke: {
            interval: 1000 / 40
        },
        dpr: true,
    }
}

const isMobile = CommonUtils.isMobile();
const browser = CommonUtils.getBrowser();
const isPortrait = window.matchMedia("(orientation: portrait)").matches;

const defaultPreset = isMobile ? GraphicsPreset.medium : (
    browser.browser === Browser.chrome ? GraphicsPreset.high : (
        browser.browser === Browser.firefox && browser.os === Platform.windows ? GraphicsPreset.high : GraphicsPreset.medium
    )
);

console.log(browser);
console.log(defaultPreset.name);

/** @type {Preset} */
const preset = Params.parseSettings({
    preset: {parser: Params.Parser.enum(GraphicsPreset), param: "preset", default: defaultPreset}
}).preset;

const snowOptions = Params.parseSettings({
    watch: {parser: Params.Parser.bool, param: "watch", default: false},
    offsetTop: {parser: Params.Parser.float, param: "offset_top", default: -40},
    offsetBottom: {parser: Params.Parser.float, param: "offset_bottom", default: isPortrait ? -60 : -20},

    sunMode: {parser: Params.Parser.enum(SunMode), param: "sun", default: SunMode.sync},
    theme: {parser: Params.Parser.enum(Themes), param: "theme", default: Themes.day},
    sunChangeInterval: {parser: Params.Parser.float, param: "sun_interval", default: 60},

    themeChangeAnimationStep: {parser: Params.Parser.float, param: "theme_step", default: preset.theme.step},
    themeChangeAnimationInterval: {parser: Params.Parser.float, param: "theme_interval", default: preset.theme.interval},
    themeChangeEasing: {parser: Params.Parser.enum(EasingFunctions), param: "theme_easing", default: EasingFunctions.easeInOutCubic},

    detectCoordinates: {parser: Params.Parser.bool, param: "gps", default: true},
    lat: {parser: Params.Parser.float, param: "lat", default: null},
    lon: {parser: Params.Parser.float, param: "lon", default: null},

    snowSpawnPeriod: {parser: Params.Parser.float, param: "snow_spawn", default: preset.snow.spawn},
    snowPeriod: {parser: Params.Parser.float, param: "snow_emit", default: preset.snow.emit},

    snowdriftSegmentCount: {parser: Params.Parser.float, param: "sd_seg_cnt", default: preset.snow.segments},
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

    smokeInterval: {parser: Params.Parser.float, param: "smoke_interval", default: preset.smoke.interval},
});

export default {
    Preset: preset,
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