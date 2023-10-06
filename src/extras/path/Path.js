import { Vec3 } from '../../math/Vec3.js';
import { Mat4 } from '../../math/Mat4.js';
import CubicBezierSegment from './CubicBezierSegment.js';
import QuadraticBezierSegment from './QuadraticBezierSegment.js';
import LineSegment from './LineSegment.js';
import { clamp, toDegrees, toRadian, mat4fromRotationSinCos, rotateNormalBinormal } from './utils.js';

const tempVec3 = /* @__PURE__ */ new Vec3();
const tempMat4 = /* @__PURE__ */ new Mat4();

function throwIfNullProperty(property, message) {
    if (this[property] == null) throw new Error(message);
}

export class Path {
    constructor() {
        this._segments = [];
        this._lengthOffsets = null;
        this._totalLength = -1;
        this._lastPoint = null;
        this._lastTilt = 0;

        this._assertLastPoint = throwIfNullProperty.bind(this, '_lastPoint', 'Can`t get previous point of curve. Did you forget moveTo command?');

        this.tiltFunction = null;
    }

    moveTo(p, tilt = 0) {
        this._totalLength = -1;
        this._lastPoint = p;
        this._lastTilt = tilt;
    }

    bezierCurveTo(cp1, cp2, p, tilt = 0) {
        this._assertLastPoint();
        const seg = new CubicBezierSegment(this._lastPoint, cp1, cp2, p, this._lastTilt, tilt);
        this.addSegment(seg);
        return this;
    }

    quadraticCurveTo(cp, p, tilt = 0) {
        this._assertLastPoint();
        const seg = new QuadraticBezierSegment(this._lastPoint, cp, p, this._lastTilt, tilt);
        this.addSegment(seg);
        return this;
    }

    lineTo(p, tilt = 0) {
        this._assertLastPoint();
        const seg = new LineSegment(this._lastPoint, p, this._lastTilt, tilt);
        this.addSegment(seg);
        return this;
    }

    addSegment(segment) {
        this._totalLength = -1;
        this._lastPoint = segment.lastPoint();
        this._lastTilt = segment.tiltEnd;
        this._segments.push(segment);
        return this;
    }

    getSegments() {
        return this._segments;
    }

    updateLength() {
        const n = this._segments.length;
        this._lengthOffsets = new Array(n);

        let offset = 0;
        for (let i = 0; i < n; i++) {
            this._lengthOffsets[i] = offset;
            offset += this._segments[i].getLength();
        }

        this._totalLength = offset;
    }

    getLength() {
        if (this._totalLength < 0) {
            this.updateLength();
        }

        return this._totalLength;
    }

    /**
     * Finding a path segment at a given absolute length distance
     * @param {number} len absolute length distance
     * @returns {[number, number]} [_segment index_, _relative segment distance_]
     */
    findSegmentIndexAtLength(len) {
        const totalLength = this.getLength();

        if (len <= 0) {
            return [0, 0];
        }

        if (len >= totalLength) {
            return [this._segments.length - 1, 1];
        }

        let start = 0;
        let end = this._lengthOffsets.length - 1;
        let index = -1;
        let mid;

        while (start <= end) {
            mid = Math.ceil((start + end) / 2);

            if (mid === 0 || mid === this._lengthOffsets.length - 1 || (len >= this._lengthOffsets[mid] && len < this._lengthOffsets[mid + 1])) {
                index = mid;
                break;
            } else if (len < this._lengthOffsets[mid]) {
                end = mid - 1;
            } else {
                start = mid + 1;
            }
        }

        const seg = this._segments[index];
        const segLen = seg.getLength();
        const t = (len - this._lengthOffsets[index]) / segLen;

        return [index, t];
    }

    getPointAtLength(len, out = new Vec3()) {
        const [i, t] = this.findSegmentIndexAtLength(len);
        return this._segments[i].getPointAt(t, out);
    }

    getPointAt(t, out = new Vec3()) {
        const totalLength = this.getLength();
        return this.getPointAtLength(t * totalLength, out);
    }

    getTangentAtLength(len, out = new Vec3()) {
        const [i, t] = this.findSegmentIndexAtLength(len);
        return this._segments[i].getTangentAt(t, out);
    }

    getTangentAt(t, out = new Vec3()) {
        const totalLength = this.getLength();
        return this.getTangentAtLength(t * totalLength, out);
    }

    getTiltAtLength(len) {
        const [i, t] = this.findSegmentIndexAtLength(len);
        return this._segments[i].getTiltAt(t);
    }

    getTiltAt(t) {
        const totalLength = this.getLength();
        return this.getTiltAtLength(t * totalLength);
    }

    /**
     * Get sequence of points using `getPointAt(t)`
     * @param {number} divisions number of subdivisions
     * @returns {Vec3[]} array of points
     */
    getPoints(divisions = 64) {
        const points = new Array(divisions + 1);
        for (let i = 0; i <= divisions; i++) {
            points[i] = this.getPointAt(i / divisions);
        }
        return points;
    }

    /**
     * Generates the Frenet Frames.
     * See http://www.cs.indiana.edu/pub/techreports/TR425.pdf
     * @param {number} divisions number of subdivisions
     * @returns {{tangents: Vec3[], normals: Vec3[], binormals: Vec3[]}} Object with tangents, normals and binormals arrays
     */
    computeFrenetFrames(divisions = 64, closed = false) {
        const tangents = new Array(divisions + 1);
        const tilts = new Array(divisions + 1);

        const tiltFunction = this.tiltFunction ?? ((a) => a);

        // compute the tangent vectors and tilt for each segment on the curve
        const totalLength = this.getLength();
        for (let i = 0; i <= divisions; i++) {
            const [si, st] = this.findSegmentIndexAtLength((totalLength * i) / divisions);
            const segment = this._segments[si];
            tangents[i] = segment.getTangentAt(st);
            tilts[i] = tiltFunction(segment.getTiltAt(st), i / divisions, this);
        }

        const tx = Math.abs(tangents[0].x);
        const ty = Math.abs(tangents[0].y);
        const tz = Math.abs(tangents[0].z);

        const normal = new Vec3();
        if (tx < ty && tx < tz) {
            normal.set(1, 0, 0);
        } else if (ty < tx && ty < tz) {
            normal.set(0, 1, 0);
        } else {
            normal.set(0, 0, 1);
        }

        // select an initial normal vector perpendicular to the first tangent vector,
        // and in the direction of the minimum tangent xyz component
        const normals = new Array(divisions + 1);
        const binormals = new Array(divisions + 1);
        normals[0] = new Vec3();
        binormals[0] = new Vec3();

        tempVec3.cross(tangents[0], normal).normalize();
        normals[0].cross(tangents[0], tempVec3);
        binormals[0].cross(tangents[0], normals[0]);

        // compute the slowly-varying normal vector for each segment on the curve
        for (let i = 1; i < tangents.length; i++) {
            normals[i] = normals[i - 1].clone();
            binormals[i] = new Vec3();

            tempVec3.cross(tangents[i - 1], tangents[i]);
            const crossLen = tempVec3.len();

            if (crossLen > Number.EPSILON) {
                tempVec3.scale(1 / crossLen); // nomalize
                const cosTheta = clamp(tangents[i - 1].dot(tangents[i]), -1, 1); // clamp for floating pt errors
                const sinTheta = clamp(crossLen, -1, 1);

                mat4fromRotationSinCos(tempMat4, tempVec3, sinTheta, cosTheta);
                normals[i].applyMatrix4(tempMat4);
            }

            binormals[i].cross(tangents[i], normals[i]);
        }

        // add tilt twisting
        for (let i = 0; i < tilts.length; i++) {
            rotateNormalBinormal(toRadian(tilts[i]), normals[i], binormals[i]);
        }

        // if the curve is closed, postprocess the vectors so the first and last normal vectors are the same
        if (closed === true) {
            const normalLast = normals[normals.length - 1];
            let step = Math.acos(clamp(normals[0].dot(normalLast), -1, 1)) / (normals.length - 1);

            if (tangents[0].dot(tempVec3.cross(normals[0], normalLast)) > 0) {
                step = -step;
            }

            for (let i = 1; i < normals.length - 1; i++) {
                const angle = step * i;
                rotateNormalBinormal(angle, normals[i], binormals[i]);
                tilts[i] += toDegrees(angle);
            }

            normals[normals.length - 1] = normals[0].clone();
            binormals[binormals.length - 1] = binormals[0].clone();
        }

        return { tangents, normals, binormals, tilts };
    }
}
