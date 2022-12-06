function parseBool(param) {
    if (typeof param === "boolean") return param;

    if (param === "1") return true;
    else if (param === "0") return false;
    return null
}

function parseNumber(param, parser) {
    if (typeof param === "number") return param;

    const value = parser(param);
    if (Number.isFinite(value)) return value;
    return null;
}

export const Parser = {
    bool: parseBool,
    int: (v) => parseNumber(v, Number.parseInt),
    float: (v) => parseNumber(v, Number.parseFloat),
}

export function parse(def = {}) {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());

    for (const [key, defValue] of Object.entries(def)) {
        if (params[key] === undefined || params[key] === "") {
            params[key] = defValue;
        }
    }

    const result = {
        debug: parseBool(params["debug"]) ?? false,
        statistics: parseBool(params["stats"]) ?? true,
        useDpr: parseBool(params["dpr"]) ?? true,

        showBodies: parseBool(params["debug_body"]) ?? true,
        showVector: parseBool(params["debug_vector"]),
        showPoints: parseBool(params["debug_point"]),
        showVectorLength: parseBool(params["debug_vector_length"]),
        showBoundary: parseBool(params["debug_boundary"]),
        showVelocityVector: parseBool(params["debug_velocity"]),
        showNormalVector: parseBool(params["debug_normal"]),
        showTangentVector: parseBool(params["debug_tangent"]),
        showContactVector: parseBool(params["debug_contact"]),
        showTree: parseBool(params["debug_tree"]),
        showTreeLeafs: parseBool(params["debug_tree_leafs"]),
        showTreeSegments: parseBool(params["debug_tree_segments"]),
        showTreeBoundaryCollision: parseBool(params["debug_tree_collision"]),
        showWarmVector: parseBool(params["debug_warming"]),

        slowMotion: parseNumber(params["slow_motion"], Number.parseFloat) ?? 1,
        gravity: parseNumber(params["g"], Number.parseFloat) ?? 100,
        resistance: Math.min(1, Math.max(0, parseNumber(params["resistance"], Number.parseFloat) ?? 0.99)),
        friction: Math.min(1, Math.max(0, parseNumber(params["friction"], Number.parseFloat) ?? 0.2)),
        restitution: Math.min(1, Math.max(0, parseNumber(params["restitution"], Number.parseFloat) ?? 0.5)),

        solverBias: parseNumber(params["bias"], Number.parseFloat),
        solverBeta: parseNumber(params["beta"], Number.parseFloat),
        allowedOverlap: parseNumber(params["overlap"], Number.parseFloat),
        solverSteps: parseNumber(params["steps"], Number.parseInt),
        solverTreeDivider: parseNumber(params["tree_divider"], Number.parseInt),
        solverTreeMaxCount: parseNumber(params["tree_cnt"], Number.parseInt),
        solverWarming: parseBool(params["warming"]),
    };

    return Object.keys(result).reduce((res, key) => {
        if (result[key] !== null) {
            res[key] = result[key];
        }

        return res;
    }, {});
}

export function parseSettings(config) {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());

    const result = {}
    for (const [key, {parser, param, default: def}] of Object.entries(config)) {
        const value = parser(params[param] ?? def);

        if (value !== null) {
            result[key] = value;
        }
    }

    return result;
}