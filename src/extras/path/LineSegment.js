import BaseSegment from './BaseSegment.js';
import { Vec3 } from '../../math/Vec3.js';
import { lerp as lerp3 } from '../../math/functions/Vec3Func.js';

const tempVec3 = /* @__PURE__ */ new Vec3();

export default class LineSegment extends BaseSegment {
    constructor(p0, p1, tiltStart = 0, tiltEnd = 0) {
        super();
        this.p0 = p0;
        this.p1 = p1;

        this.tiltStart = tiltStart;
        this.tiltEnd = tiltEnd;

        this._len = -1;
    }

    /**
     * Updates the segment length. You must call this method every time you change the curve's control points.
     */
    updateLength() {
        this._len = tempVec3.sub(this.p1, this.p0).len();
    }

    /**
     * Get point at relative position in curve according to segment length.
     * @param {number} t Distance at time t in range [0 .. 1]
     * @param {Vec3} out Optional Vec3 to output
     * @returns {Vec3} Point at relative position
     */
    getPointAt(t, out = new Vec3()) {
        lerp3(out, this.p0, this.p1, t);
        return out;
    }

    /**
     * Returns a unit vector tangent at t
     * @param {number} t Distance at time t in range [0 .. 1]
     * @param {Vec3} out Optional Vec3 to output
     * @returns {Vec3} A unit vector
     */
    getTangentAt(t, out = new Vec3()) {
        return out.sub(this.p1, this.p0).normalize();
    }

    lastPoint() {
        return this.p1;
    }
}
