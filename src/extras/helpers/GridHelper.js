import { Mesh } from '../../core/Mesh.js';
import { Program } from '../../core/Program.js';
import { Geometry } from '../../core/Geometry.js';
import { Vec3 } from '../../math/Vec3.js';

export class GridHelper extends Mesh {
    constructor(gl, { size = 10, divisions = 10, color = new Vec3(0.75, 0.75, 0.75), ...meshProps } = {}) {
        const numVertices = (size + 1) * 2 * 2;
        const vertices = new Float32Array(numVertices * 3);

        const hs = size / 2;
        for (let i = 0; i <= divisions; i++) {
            const t = i / divisions;
            const o = t * size - hs;

            vertices.set([o, 0, -hs, o, 0, hs], i * 12);
            vertices.set([-hs, 0, o, hs, 0, o], i * 12 + 6);
        }

        const geometry = new Geometry(gl, {
            position: { size: 3, data: vertices },
        });

        const program = new Program(gl, {
            vertex,
            fragment,
            uniforms: {
                color: { value: color },
            },
        });
        super(gl, { ...meshProps, mode: gl.LINES, geometry, program });
    }
}

const vertex = /* glsl */ `
attribute vec3 position;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

void main() {    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragment = /* glsl */ `
precision highp float;
uniform vec3 color;

void main() {    
    gl_FragColor = vec4(color, 1.0);
}
`;
