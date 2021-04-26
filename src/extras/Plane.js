import { Geometry } from '../core/Geometry.js';

export class Plane extends Geometry {
    constructor(gl, { width = 1, height = 1, widthSegments = 1, heightSegments = 1, attributes = {} } = {}) {
        const wSegs = widthSegments;
        const hSegs = heightSegments;

        // Determine length of arrays
        const num = (wSegs + 1) * (hSegs + 1);
        const numIndices = wSegs * hSegs * 6;

        // Generate empty arrays once
        const position = new Float32Array(num * 3);
        const normal = new Float32Array(num * 3);
        const uv = new Float32Array(num * 2);
        const index = numIndices > 65536 ? new Uint32Array(numIndices) : new Uint16Array(numIndices);

        Plane.buildPlane(position, normal, uv, index, width, height, 0, wSegs, hSegs);

        Object.assign(attributes, {
            position: { size: 3, data: position },
            normal: { size: 3, data: normal },
            uv: { size: 2, data: uv },
            index: { data: index },
        });

        super(gl, attributes);
    }

    static buildPlane(position, normal, uv, index, width, height, depth, wSegs, hSegs, u = 0, v = 1, w = 2, uDir = 1, vDir = -1, i = 0, ii = 0) {
        const io = i;
        const segW = width / wSegs;
        const segH = height / hSegs;

        for (let iy = 0; iy <= hSegs; iy++) {
            let y = iy * segH - height / 2;
            for (let ix = 0; ix <= wSegs; ix++, i++) {
                let x = ix * segW - width / 2;

                position[i * 3 + u] = x * uDir;
                position[i * 3 + v] = y * vDir;
                position[i * 3 + w] = depth / 2;

                normal[i * 3 + u] = 0;
                normal[i * 3 + v] = 0;
                normal[i * 3 + w] = depth >= 0 ? 1 : -1;

                uv[i * 2] = ix / wSegs;
                uv[i * 2 + 1] = 1 - iy / hSegs;

                if (iy === hSegs || ix === wSegs) continue;
                let a = io + ix + iy * (wSegs + 1);
                let b = io + ix + (iy + 1) * (wSegs + 1);
                let c = io + ix + (iy + 1) * (wSegs + 1) + 1;
                let d = io + ix + iy * (wSegs + 1) + 1;

                index[ii * 6] = a;
                index[ii * 6 + 1] = b;
                index[ii * 6 + 2] = d;
                index[ii * 6 + 3] = b;
                index[ii * 6 + 4] = c;
                index[ii * 6 + 5] = d;
                ii++;
            }
        }
    }
}
