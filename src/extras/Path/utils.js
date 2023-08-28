// from https://github.com/Pomax/bezierjs/blob/d19695f3cc3ce383cf38ce4643f467deca7edb92/src/utils.js#L26
// Legendre-Gauss abscissae with n=24 (x_i values, defined at i=n as the roots of the nth order Legendre polynomial Pn(x))
export const T_VALUES = [
    -0.0640568928626056260850430826247450385909, 0.0640568928626056260850430826247450385909, -0.1911188674736163091586398207570696318404,
    0.1911188674736163091586398207570696318404, -0.3150426796961633743867932913198102407864, 0.3150426796961633743867932913198102407864,
    -0.4337935076260451384870842319133497124524, 0.4337935076260451384870842319133497124524, -0.5454214713888395356583756172183723700107,
    0.5454214713888395356583756172183723700107, -0.6480936519369755692524957869107476266696, 0.6480936519369755692524957869107476266696,
    -0.7401241915785543642438281030999784255232, 0.7401241915785543642438281030999784255232, -0.8200019859739029219539498726697452080761,
    0.8200019859739029219539498726697452080761, -0.8864155270044010342131543419821967550873, 0.8864155270044010342131543419821967550873,
    -0.9382745520027327585236490017087214496548, 0.9382745520027327585236490017087214496548, -0.9747285559713094981983919930081690617411,
    0.9747285559713094981983919930081690617411, -0.9951872199970213601799974097007368118745, 0.9951872199970213601799974097007368118745,
];

// Legendre-Gauss weights with n=24 (w_i values, defined by a function linked to in the Bezier primer article)
export const C_VALUES = [
    0.1279381953467521569740561652246953718517, 0.1279381953467521569740561652246953718517, 0.1258374563468282961213753825111836887264,
    0.1258374563468282961213753825111836887264, 0.121670472927803391204463153476262425607, 0.121670472927803391204463153476262425607,
    0.1155056680537256013533444839067835598622, 0.1155056680537256013533444839067835598622, 0.1074442701159656347825773424466062227946,
    0.1074442701159656347825773424466062227946, 0.0976186521041138882698806644642471544279, 0.0976186521041138882698806644642471544279,
    0.086190161531953275917185202983742667185, 0.086190161531953275917185202983742667185, 0.0733464814110803057340336152531165181193,
    0.0733464814110803057340336152531165181193, 0.0592985849154367807463677585001085845412, 0.0592985849154367807463677585001085845412,
    0.0442774388174198061686027482113382288593, 0.0442774388174198061686027482113382288593, 0.0285313886289336631813078159518782864491,
    0.0285313886289336631813078159518782864491, 0.0123412297999871995468056670700372915759, 0.0123412297999871995468056670700372915759,
];

/**
 * Convert Degree To Radian
 * @param {number} a Angle in Degrees
 * @returns {number} a Angle in Radians
 */
export const toRadian = (a) => (a * Math.PI) / 180;

/**
 * Convert Radian To Degree
 * @param {number} a Angle in Radians
 * @returns {number} a Angle in Radian
 */
export const toDegrees = (a) => (180 * a) / Math.PI;

export const clamp = (val, min, max) => Math.max(min, Math.min(val, max));
export const lerp = (t, v0, v1) => v0 * (t - 1) + v1 * t;

/**
 * Fills a rotation matrix with the given sine and cosine of the angle around the given axis
 * This function helps to avoid inverse trigonometry
 * @param {Mat4} out mat4 receiving operation result
 * @param {Vec3} axis the axis to rotate around. Should be normalized
 * @param {number} sin sine of rotation angle
 * @param {number} cos cosine of rotation angle
 * @returns {Mat4} out
 */
export function mat4fromRotationSinCos(out, axis, sin, cos) {
    const x = axis[0];
    const y = axis[1];
    const z = axis[2];
    const t = 1 - cos;

    out[0] = x * x * t + cos;
    out[1] = y * x * t + z * sin;
    out[2] = z * x * t - y * sin;
    out[3] = 0;
    out[4] = x * y * t - z * sin;
    out[5] = y * y * t + cos;
    out[6] = z * y * t + x * sin;
    out[7] = 0;
    out[8] = x * z * t + y * sin;
    out[9] = y * z * t - x * sin;
    out[10] = z * z * t + cos;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
}

/**
 * Rotates the normal and binormal around its tangent by the given angle.
 *
 * see: https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula
 * @param {number} angle rotation angle
 * @param {Vec3} norm unit normal vector
 * @param {Vec3} binorm unit binormal vector
 * @param {Vec3} outNorm optional normal output vector. If not present then normal vector changes in place
 * @param {Vec3} outBinorm optional binormal output vector. If not present then binormal vector changes in place
 */
export function rotateNormalBinormal(angle, norm, binorm, outNorm = norm, outBinorm = binorm) {
    const s = Math.sin(angle);
    const c = Math.cos(angle);

    const nx = c * norm.x + s * binorm.x;
    const ny = c * norm.y + s * binorm.y;
    const nz = c * norm.z + s * binorm.z;

    const bx = c * binorm.x - s * norm.x;
    const by = c * binorm.y - s * norm.y;
    const bz = c * binorm.z - s * norm.z;

    outNorm.set(nx, ny, nz);
    outBinorm.set(bx, by, bz);
}
