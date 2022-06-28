import { Mesh } from '../../core/Mesh.js';
import { Program } from '../../core/Program.js';
import { Geometry } from '../../core/Geometry.js';
import { Vec3 } from '../../math/Vec3.js';
import { Mat3 } from '../../math/Mat3.js';

export class VertexNormalsHelper extends Mesh {
    constructor(object, { size = 0.1, color = new Vec3(0.86, 0.16, 0.86), ...meshProps } = {}) {
        const gl = object.gl;
        const nNormals = object.geometry.attributes.normal.count;
        const positionsArray = new Float32Array(nNormals * 2 * 3);
        const normalsArray = new Float32Array(nNormals * 2 * 3);
        const sizeArray = new Float32Array(nNormals * 2);

        const normalData = object.geometry.attributes.normal.data;
        const positionData = object.geometry.attributes.position.data;
        const sizeData = new Float32Array([0, size]);

        for (let i = 0; i < nNormals; i++) {
            const i6 = i * 6;
            const i3 = i * 3;

            // duplicate position and normal for line start and end point
            const pSub = positionData.subarray(i3, i3 + 3);
            positionsArray.set(pSub, i6);
            positionsArray.set(pSub, i6 + 3);

            const nSub = normalData.subarray(i3, i3 + 3);
            normalsArray.set(nSub, i6);
            normalsArray.set(nSub, i6 + 3);

            sizeArray.set(sizeData, i * 2);
        }

        const geometry = new Geometry(gl, {
            position: { size: 3, data: positionsArray },
            normal: { size: 3, data: normalsArray },
            size: { size: 1, data: sizeArray },
        });

        const program = new Program(gl, {
            vertex,
            fragment,
            uniforms: {
                color: { value: color },
                worldNormalMatrix: { value: new Mat3() },
                objectWorldMatrix: { value: object.worldMatrix },
            },
        });

        super(gl, { ...meshProps, mode: gl.LINES, geometry, program });

        this.object = object;
    }

    draw(arg) {
        this.program.uniforms.worldNormalMatrix.value.getNormalMatrix(this.object.worldMatrix);
        super.draw(arg);
    }
}

const vertex = /* glsl */ `
attribute vec3 position;
attribute vec3 normal;
attribute float size;

uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 objectWorldMatrix;
uniform mat3 worldNormalMatrix;

void main() {
    vec3 n = normalize(worldNormalMatrix * normal) * size;
    vec3 p = (objectWorldMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(p + n, 1.0);
}
`;

const fragment = /* glsl */ `
precision highp float;
uniform vec3 color;

void main() {    
    gl_FragColor = vec4(color, 1.0);
}
`;
