import { Geometry } from '../core/Geometry.js';
import { Vec3 } from '../math/Vec3.js';

export class Cylinder extends Geometry {
    constructor(
        gl,
        {
            radiusTop = 0.5,
            radiusBottom = 0.5,
            height = 1,
            radialSegments = 8,
            heightSegments = 1,
            openEnded = false,
            thetaStart = 0,
            thetaLength = Math.PI * 2,
            attributes = {},
        } = {}
    ) {
        const rSegs = radialSegments;
        const hSegs = heightSegments;
        const tStart = thetaStart;
        const tLength = thetaLength;

        const numCaps = openEnded ? 0 : radiusBottom && radiusTop ? 2 : 1;
        const num = (rSegs + 1) * (hSegs + 1 + numCaps) + numCaps;
        const numIndices = rSegs * hSegs * 6 + numCaps * rSegs * 3;

        const position = new Float32Array(num * 3);
        const normal = new Float32Array(num * 3);
        const uv = new Float32Array(num * 2);
        const index = num > 65536 ? new Uint32Array(numIndices) : new Uint16Array(numIndices);

        let i = 0;
        let ii = 0;
        const indexArray = [];

        addHeight();
        if (!openEnded) {
            if (radiusTop) addCap(true);
            if (radiusBottom) addCap(false);
        }

        function addHeight() {
            let x, y;
            const n = new Vec3();
            const slope = (radiusBottom - radiusTop) / height;

            for (y = 0; y <= hSegs; y++) {
                const indexRow = [];
                const v = y / hSegs;

                const r = v * (radiusBottom - radiusTop) + radiusTop;
                for (x = 0; x <= rSegs; x++) {
                    const u = x / rSegs;
                    const theta = u * tLength + tStart;
                    const sinTheta = Math.sin(theta);
                    const cosTheta = Math.cos(theta);

                    position.set([r * sinTheta, (0.5 - v) * height, r * cosTheta], i * 3);
                    n.set(sinTheta, slope, cosTheta).normalize();
                    normal.set([n.x, n.y, n.z], i * 3);
                    uv.set([u, 1 - v], i * 2);
                    indexRow.push(i++);
                }
                indexArray.push(indexRow);
            }

            for (x = 0; x < rSegs; x++) {
                for (y = 0; y < hSegs; y++) {
                    const a = indexArray[y][x];
                    const b = indexArray[y + 1][x];
                    const c = indexArray[y + 1][x + 1];
                    const d = indexArray[y][x + 1];

                    index.set([a, b, d, b, c, d], ii * 3);
                    ii += 2;
                }
            }
        }

        function addCap(isTop) {
            let x;
            const r = isTop === true ? radiusTop : radiusBottom;
            const sign = isTop === true ? 1 : -1;

            const centerIndex = i;
            position.set([0, 0.5 * height * sign, 0], i * 3);
            normal.set([0, sign, 0], i * 3);
            uv.set([0.5, 0.5], i * 2);
            i++;

            for (x = 0; x <= rSegs; x++) {
                const u = x / rSegs;
                const theta = u * tLength + tStart;
                const cosTheta = Math.cos(theta);
                const sinTheta = Math.sin(theta);

                position.set([r * sinTheta, 0.5 * height * sign, r * cosTheta], i * 3);
                normal.set([0, sign, 0], i * 3);
                uv.set([cosTheta * 0.5 + 0.5, sinTheta * 0.5 * sign + 0.5], i * 2);
                i++;
            }

            for (x = 0; x < rSegs; x++) {
                const j = centerIndex + x + 1;
                if (isTop) {
                    index.set([j, j + 1, centerIndex], ii * 3);
                } else {
                    index.set([j + 1, j, centerIndex], ii * 3);
                }
                ii++;
            }
        }

        Object.assign(attributes, {
            position: { size: 3, data: position },
            normal: { size: 3, data: normal },
            uv: { size: 2, data: uv },
            index: { data: index },
        });

        super(gl, attributes);
    }
}
