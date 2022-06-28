import { Mesh } from '../../core/Mesh.js';
import { Program } from '../../core/Program.js';
import { Geometry } from '../../core/Geometry.js';
import { Vec3 } from '../../math/Vec3.js';

export class AxesHelper extends Mesh {
    constructor(
        gl,
        {
            size = 1,
            symmetric = false,
            xColor = new Vec3(0.96, 0.21, 0.32),
            yColor = new Vec3(0.44, 0.64, 0.11),
            zColor = new Vec3(0.18, 0.52, 0.89),
            ...meshProps
        } = {}
    ) {
        const a = symmetric ? -size : 0;
        const b = size;

        // prettier-ignore
        const vertices = new Float32Array([
			a, 0, 0,  b, 0, 0,
			0, a, 0,  0, b, 0,
			0, 0, a,  0, 0, b
		]);

        // prettier-ignore
        const colors = new Float32Array([
			...xColor,  ...xColor,
			...yColor,  ...yColor,
			...zColor,  ...zColor
		]);

        const geometry = new Geometry(gl, {
            position: { size: 3, data: vertices },
            color: { size: 3, data: colors },
        });

        const program = new Program(gl, { vertex, fragment });

        super(gl, { ...meshProps, mode: gl.LINES, geometry, program });
    }
}

const vertex = /* glsl */ `
attribute vec3 position;
attribute vec3 color;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec3 vColor;

void main() {    
    vColor = color;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragment = /* glsl */ `
precision highp float;
varying vec3 vColor;

void main() {    
    gl_FragColor = vec4(vColor, 1.0);
}
`;
