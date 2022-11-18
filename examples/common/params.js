function parseBool(param) {
    if (param === "1") {
        return true;
    } else if (param === "0") {
        return false;
    }

    return null
}

export function parse() {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());

    return {
        debug: parseBool(params["debug"]) ?? false,
        statistics: parseBool(params["stats"]) ?? true,
        showVector: parseBool(params["debug_vector"]),
        showVectorLength: parseBool(params["debug_vector_length"]),
        showBoundary: parseBool(params["debug_boundary"]),

        slowMotion: Number.parseFloat(params["slow_motion"]) || 1,
        gravity: Number.parseFloat(params["g"]) || 100,
        resistance: Math.min(1, Math.max(0, Number.parseFloat(params["resistance"])) || 0.99),
    }
}