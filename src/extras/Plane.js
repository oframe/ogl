import {Geometry} from '../core/Geometry.js';

export class Plane extends Geometry {
    constructor(gl, w = 1, h = 1, wSeg = 1, hSeg = 1) {
        const num = (wSeg + 1) * (hSeg + 1);
        const numIndices = wSeg * hSeg * 6;

        const position = new Float32Array(num * 3);
        const normal = new Float32Array(num * 3);
        const uv = new Float32Array(num * 2);
        const index = new Uint16Array(numIndices);

        const segW = w / wSeg;
        const segH = h / hSeg;
        const up = [0, 0, 1];

        let i = 0;
        let iI = 0;

        for (let iy = 0; iy <= hSeg; iy++) {
            let y = iy * segH - h / 2;
            for (let ix = 0; ix <= wSeg; ix++, i++) {
                let x = ix * segW - w / 2;
                position.set([x, -y, 0], i * 3);
                normal.set(up, i * 3);
                uv.set([ix / wSeg, 1 - iy / hSeg], i * 2);

                if (iy === hSeg || ix === wSeg) continue;
                let a = ix + iy * (wSeg + 1);
                let b = ix + (iy + 1) * (wSeg + 1);
                let c = ix + (iy + 1) * (wSeg + 1) + 1;
                let d = ix + iy * (wSeg + 1) + 1;

                index.set([a, b, d, b, c, d], iI * 6);
                iI++;
            }
        }

        super(gl, {
            position: {size: 3, data: position},
            normal: {size: 3, data: normal},
            uv: {size: 2, data: uv},
            index: {data: index},
        });
    }
}