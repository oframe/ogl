import { Mesh } from '../core/Mesh.js';
import { Program } from '../core/Program.js';
import { Geometry } from '../core/Geometry.js';
import { Vec3 } from '../math/Vec3.js';

export class WireMesh extends Mesh {
    constructor(gl, { geometry, wireColor = new Vec3(0, 0.75, 0.5), ...meshProps } = {}) {
        const wireProgram = new Program(gl, {
            vertex,
            fragment,
            uniforms: { wireColor: { value: wireColor } },
        });

        let indicesArray;

        if (geometry.attributes.index) {
            const data = geometry.attributes.index.data;
            const numIndices = (data.length / 3) * 6;
            indicesArray = new data.constructor(numIndices);

            for (let i = 0; i < data.length; i += 3) {
                indicesArray.set([data[i], data[i + 1], data[i + 1], data[i + 2], data[i + 2], data[i]], i * 2);
            }
        } else {
            // from: https://github.com/oframe/ogl/blob/fceff3a9bd4e2d31a1dca04491cdef11c6cae86e/examples/wireframe.html#L112
            const numVertices = geometry.attributes.position.data.length / 3;
            const numIndices = (numVertices / 3) * 6;
            indicesArray = numIndices > 65536 ? new Uint32Array(numIndices) : new Uint16Array(numIndices);

            for (let i = 0; i < numVertices; i += 3) {
                // For every triangle, make three line pairs (start, end)
                indicesArray.set([i, i + 1, i + 1, i + 2, i + 2, i], i * 2);
            }
        }

        const wireGeometry = new Geometry(gl, {
            position: { ...geometry.attributes.position },
            index: { data: indicesArray },
        });

        super(gl, { ...meshProps, mode: gl.LINES, geometry: wireGeometry, program: wireProgram });
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
uniform vec3 wireColor;

void main() {    
    gl_FragColor = vec4(wireColor, 1.0);
}
`;
