import BaseSegment from './BaseSegment.js';
import { Vec3 } from '../../math/Vec3.js';
import { T_VALUES, C_VALUES } from './utils.js';

const tempVec3 = /* @__PURE__ */ new Vec3();

function cubicBezier(t, p0, p1, p2, p3) {
    const k = 1 - t;
    // prettier-ignore
    return (
        (k * k * k * p0) +
        (3 * k * k * t * p1) +
        (3 * k * t * t * p2) +
        (t * t * t * p3)
    );
}

function cubicBezierDeriv(t, p0, p1, p2, p3) {
    const k = 1 - t;
    // prettier-ignore
    return (
        (3 * k * k * (p1 - p0)) +
        (6 * k * t * (p2 - p1)) +
        (3 * t * t * (p3 - p2))
    );
}

export default class CubicBezierSegment extends BaseSegment {
    constructor(p0, p1, p2, p3, tiltStart = 0, tiltEnd = 0) {
        super();
        this.p0 = p0;
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;

        this.tiltStart = tiltStart;
        this.tiltEnd = tiltEnd;

        this._len = -1;
    }

    /**
     * Updates the segment length. You must call this method every time you change the curve's control points.
     */
    updateLength() {
        // from https://github.com/Pomax/bezierjs/blob/d19695f3cc3ce383cf38ce4643f467deca7edb92/src/utils.js#L265
        const z = 0.5;
        const len = T_VALUES.length;

        let sum = 0;
        for (let i = 0, t; i < len; i++) {
            t = z * T_VALUES[i] + z;
            sum += C_VALUES[i] * this.getDerivativeAt(t, tempVec3).len();
        }

        this._len = z * sum;
    }

    /**
     * Get point at relative position in curve according to segment length.
     * @param {number} t Distance at time t in range [0 .. 1]
     * @param {Vec3} out Optional Vec3 to output
     * @returns {Vec3} Point at relative position
     */
    getPointAt(t, out = new Vec3()) {
        out.x = cubicBezier(t, this.p0.x, this.p1.x, this.p2.x, this.p3.x);
        out.y = cubicBezier(t, this.p0.y, this.p1.y, this.p2.y, this.p3.y);
        out.z = cubicBezier(t, this.p0.z, this.p1.z, this.p2.z, this.p3.z);
        return out;
    }

    getDerivativeAt(t, out = new Vec3()) {
        out.x = cubicBezierDeriv(t, this.p0.x, this.p1.x, this.p2.x, this.p3.x);
        out.y = cubicBezierDeriv(t, this.p0.y, this.p1.y, this.p2.y, this.p3.y);
        out.z = cubicBezierDeriv(t, this.p0.z, this.p1.z, this.p2.z, this.p3.z);
        return out;
    }

    /**
     * Returns a unit vector tangent at t
     * @param {number} t Distance at time t in range [0 .. 1]
     * @param {Vec3} out Optional Vec3 to output
     * @returns {Vec3} A unit vector
     */
    getTangentAt(t, out = new Vec3()) {
        return this.getDerivativeAt(t, out).normalize();
    }

    lastPoint() {
        return this.p3;
    }
}
