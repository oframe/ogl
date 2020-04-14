import { Geometry } from '../core/Geometry.js';
import { Plane } from './Plane.js';

export class Box extends Geometry {
    constructor(gl, { width = 1, height = 1, depth = 1, widthSegments = 1, heightSegments = 1, depthSegments = 1, attributes = {} } = {}) {
        const wSegs = widthSegments;
        const hSegs = heightSegments;
        const dSegs = depthSegments;

        const num = (wSegs + 1) * (hSegs + 1) * 2 + (wSegs + 1) * (dSegs + 1) * 2 + (hSegs + 1) * (dSegs + 1) * 2;
        const numIndices = (wSegs * hSegs * 2 + wSegs * dSegs * 2 + hSegs * dSegs * 2) * 6;

        const position = new Float32Array(num * 3);
        const normal = new Float32Array(num * 3);
        const uv = new Float32Array(num * 2);
        const index = num > 65536 ? new Uint32Array(numIndices) : new Uint16Array(numIndices);

        let i = 0;
        let ii = 0;

        // left, right
        Plane.buildPlane(position, normal, uv, index, depth, height, width, dSegs, hSegs, 2, 1, 0, -1, -1, i, ii);
        Plane.buildPlane(
            position,
            normal,
            uv,
            index,
            depth,
            height,
            -width,
            dSegs,
            hSegs,
            2,
            1,
            0,
            1,
            -1,
            (i += (dSegs + 1) * (hSegs + 1)),
            (ii += dSegs * hSegs)
        );

        // top, bottom
        Plane.buildPlane(
            position,
            normal,
            uv,
            index,
            width,
            depth,
            height,
            dSegs,
            hSegs,
            0,
            2,
            1,
            1,
            1,
            (i += (dSegs + 1) * (hSegs + 1)),
            (ii += dSegs * hSegs)
        );
        Plane.buildPlane(
            position,
            normal,
            uv,
            index,
            width,
            depth,
            -height,
            dSegs,
            hSegs,
            0,
            2,
            1,
            1,
            -1,
            (i += (wSegs + 1) * (dSegs + 1)),
            (ii += wSegs * dSegs)
        );

        // front, back
        Plane.buildPlane(
            position,
            normal,
            uv,
            index,
            width,
            height,
            -depth,
            wSegs,
            hSegs,
            0,
            1,
            2,
            -1,
            -1,
            (i += (wSegs + 1) * (dSegs + 1)),
            (ii += wSegs * dSegs)
        );
        Plane.buildPlane(
            position,
            normal,
            uv,
            index,
            width,
            height,
            depth,
            wSegs,
            hSegs,
            0,
            1,
            2,
            1,
            -1,
            (i += (wSegs + 1) * (hSegs + 1)),
            (ii += wSegs * hSegs)
        );

        Object.assign(attributes, {
            position: { size: 3, data: position },
            normal: { size: 3, data: normal },
            uv: { size: 2, data: uv },
            index: { data: index },
        });

        super(gl, attributes);
    }
}
