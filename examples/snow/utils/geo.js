import * as CommonUtils from "../../../lib/utils/common.js";

export async function getGeoPosition() {
    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(resolve, () => resolve(null));
    });
}

/**
 * @param {Date} time
 * @param {number} lat
 * @param {number} lon
 * @param {number} [zenith=90]
 * @return {{rising: number, sunset: number}}
 */
export function sunPosition(time, lat, lon, zenith = 90) {
    // http://edwilliams.org/sunrise_sunset_algorithm.htm

    const day = time.getDate();
    const month = time.getMonth() + 1;
    const year = time.getFullYear();

    const N1 = Math.floor(275 * month / 9)
    const N2 = Math.floor((month + 9) / 12)
    const N3 = (1 + Math.floor((year - 4 * Math.floor(year / 4) + 2) / 3))
    const N = N1 - (N2 * N3) + day - 30

    const lngHour = lon / 15

    const rising = clampHour(calculateSunTime(true, N, lngHour, lat, zenith) - time.getTimezoneOffset() / 60);
    const sunset = clampHour(calculateSunTime(false, N, lngHour, lat, zenith) - time.getTimezoneOffset() / 60);

    return {rising, sunset};
}

function calculateSunTime(rising, N, lngHour, lat, zenith) {
    const toRad = deg => deg / 180 * Math.PI;
    const toDeg = rad => rad / Math.PI * 180;
    const cos = deg => Math.cos(toRad(deg));
    const sin = deg => Math.sin(toRad(deg));
    const tan = deg => Math.tan(toRad(deg));
    const acos = v => toDeg(Math.acos(v));
    const asin = v => toDeg(Math.asin(v));
    const atan = v => toDeg(Math.atan(v));

    let t;
    if (rising) {
        t = N + ((6 - lngHour) / 24);
    } else {
        t = N + ((18 - lngHour) / 24);
    }

    const M = (0.9856 * t) - 3.289;
    const L = clampAngle(M + (1.916 * sin(M)) + (0.020 * sin(2 * M)) + 282.634);
    let RA = clampAngle(atan(0.91764 * tan(L)));

    const lQuadrant = Math.floor(L / 90) * 90;
    const raQuadrant = Math.floor(RA / 90) * 90;
    RA = (RA + (lQuadrant - raQuadrant)) / 15;

    const sinDec = 0.39782 * sin(L);
    const cosDec = cos(asin(sinDec));

    const cosH = (cos(zenith) - (sinDec * sin(lat))) / (cosDec * cos(lat));
    let H;
    if (rising) {
        H = 360 - acos(cosH)
    } else {
        H = acos(cosH);
    }

    H = H / 15
    const T = H + RA - (0.06571 * t) - 6.622;
    return T - lngHour;
}

function clampAngle(deg) {
    return CommonUtils.clampPeriodic(deg, 360);
}

function clampHour(value) {
    return CommonUtils.clampPeriodic(value, 24);
}