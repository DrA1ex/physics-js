import * as Params from "../common/params.js";
import * as CommonUtils from "../common/utils.js";

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

const snowOptions = Params.parseSettings({
    watch: {parser: Params.Parser.bool, param: "watch", default: false},
    top: {parser: Params.Parser.float, param: "offset_top", default: -40},
    bottom: {parser: Params.Parser.float, param: "offset_bottom", default: -1},

    snowSpawnPeriod: {parser: Params.Parser.float, param: "snow_spawn", default: 1000 / 160},
    snowPeriod: {parser: Params.Parser.float, param: "snow_emit", default: 1000 / 80},

    snowdriftSegmentCount: {parser: Params.Parser.float, param: "sd_seg_cnt", default: 200},
    snowDriftInitialHeight: {parser: Params.Parser.float, param: "sd_height", default: 30},

    houseWidth: {parser: Params.Parser.float, param: "house_w", default: 400},
    houseHeight: {parser: Params.Parser.float, param: "house_h", default: 250},
    houseFlueWidth: {parser: Params.Parser.float, param: "flue_w", default: 30},

    roofSnowDriftPointsCount: {parser: Params.Parser.float, param: "roof_seg_cnt", default: 30},
    roofSnowDriftWidth: {parser: Params.Parser.float, param: "roof_sd_w", default: 246},
    roofSnowDriftHeight: {parser: Params.Parser.float, param: "roof_sd_h", default: 10},

    treeWiggle: {parser: Params.Parser.float, param: "tree_wiggle", default: Math.PI / 180 * 10},
    treeWiggleSpeed: {parser: Params.Parser.float, param: "tree_wiggle_speed", default: Math.PI / 180 * 2}
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

    Background: {
        Tree: {
            Wiggle: snowOptions.treeWiggle,
            WiggleSpeed: snowOptions.treeWiggleSpeed,
        }
    },

    Style: {
        Watch: snowOptions.watch,
        WatchInterval: 500,

        Properties: [
            "--bg-color-1",
            "--bg-color-2",
            "--bg-color-3",
            "--snow-color",
            "--smoke-color",
            "--mountain-color-top",
            "--mountain-color-bottom",
            "--tree-color-top",
            "--tree-color-bottom",
            "--house-fill",
            "--light-color"
        ],

        Animation: {
            Step: 0.02,
            Interval: 1000 / 12,
        }
    }
};