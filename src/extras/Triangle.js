import { Geometry } from '../core/Geometry.js';

export class Triangle extends Geometry {
    constructor(gl, {
        attributes = {},
    } = {}) {

        Object.assign(attributes, {
            // position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
            position: { size: 3, data: new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]) },
            uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) },
            normal: { size: 3, data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]) }
        });

        super(gl, attributes);
    }
}
