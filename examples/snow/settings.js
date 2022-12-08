import * as Params from "../common/params.js";
import * as CommonUtils from "../common/utils.js";
import {ColorAnimation, PercentAnimation} from "../../lib/render/animation.js";

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

const snowOptions = Params.parseSettings({
    watch: {parser: Params.Parser.bool, param: "watch", default: false},
    top: {parser: Params.Parser.float, param: "offset_top", default: -40},
    bottom: {parser: Params.Parser.float, param: "offset_bottom", default: -1},

    sunMode: {parser: Params.Parser.enum(SunMode), param: "sun", default: SunMode.sync},
    theme: {parser: Params.Parser.enum(Themes), param: "theme", default: Themes.day},
    sunChangeInterval: {parser: Params.Parser.float, param: "sun_interval", default: 60},

    detectCoordinates: {parser: Params.Parser.bool, param: "gps", default: true},
    lat: {parser: Params.Parser.float, param: "lat", default: null},
    lon: {parser: Params.Parser.float, param: "lon", default: null},

    snowSpawnPeriod: {parser: Params.Parser.float, param: "snow_spawn", default: isMobile ? 1000 / 80 : 1000 / 160},
    snowPeriod: {parser: Params.Parser.float, param: "snow_emit", default: isMobile ? 1000 / 40 : 1000 / 80},

    snowdriftSegmentCount: {parser: Params.Parser.float, param: "sd_seg_cnt", default: isMobile ? 100 : 200},
    snowDriftInitialHeight: {parser: Params.Parser.float, param: "sd_height", default: 30},

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
        OffsetTop: snowOptions.top,
        OffsetBottom: snowOptions.bottom,
        Border: 100,
        Scale: scale,
    },

    Snow: {
        EmitPeriod: snowOptions.snowPeriod,
        SpawnInterval: snowOptions.snowSpawnPeriod,
        InitDuration: 5,
        Border: 10,
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
            "--sun-position-x": PercentAnimation,
            "--sun-position-y": PercentAnimation,
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
            Step: isMobile ? 1 : 0.25,
            Interval: isMobile ? 1000 / 6 : 1000 / 24,
        }
    },

    Sun: {
        Mode: snowOptions.sunMode,
        Theme: snowOptions.theme,
        Interval: snowOptions.sunChangeInterval,

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