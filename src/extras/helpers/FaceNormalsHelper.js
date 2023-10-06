import { Mesh } from '../../core/Mesh.js';
import { Program } from '../../core/Program.js';
import { Geometry } from '../../core/Geometry.js';
import { Vec3 } from '../../math/Vec3.js';
import { Mat3 } from '../../math/Mat3.js';

const vA = /* @__PURE__ */ new Vec3();
const vB = /* @__PURE__ */ new Vec3();
const vC = /* @__PURE__ */ new Vec3();
const vCenter = /* @__PURE__ */ new Vec3();
const vNormal = /* @__PURE__ */ new Vec3();

export class FaceNormalsHelper extends Mesh {
    constructor(object, { size = 0.1, color = new Vec3(0.15, 0.86, 0.86), ...meshProps } = {}) {
        const gl = object.gl;

        const positionData = object.geometry.attributes.position.data;
        const sizeData = new Float32Array([0, size]);

        const indexAttr = object.geometry.attributes.index;
        const getIndex = indexAttr ? (i) => indexAttr.data[i] : (i) => i;
        const numVertices = indexAttr ? indexAttr.data.length : Math.floor(positionData.length / 3);

        const nNormals = Math.floor(numVertices / 3);
        const positionsArray = new Float32Array(nNormals * 2 * 3);
        const normalsArray = new Float32Array(nNormals * 2 * 3);
        const sizeArray = new Float32Array(nNormals * 2);

        for (let i = 0; i < numVertices; i += 3) {
            vA.fromArray(positionData, getIndex(i + 0) * 3);
            vB.fromArray(positionData, getIndex(i + 1) * 3);
            vC.fromArray(positionData, getIndex(i + 2) * 3);

            vCenter
                .add(vA, vB)
                .add(vC)
                .multiply(1 / 3);

            vA.sub(vA, vB);
            vC.sub(vC, vB);
            vNormal.cross(vC, vA).normalize();

            // duplicate position and normal for line start and end point
            const i2 = i * 2;
            positionsArray.set(vCenter, i2);
            positionsArray.set(vCenter, i2 + 3);

            normalsArray.set(vNormal, i2);
            normalsArray.set(vNormal, i2 + 3);
            sizeArray.set(sizeData, (i / 3) * 2);
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
