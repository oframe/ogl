import { Mesh } from '../../core/Mesh.js';
import { Program } from '../../core/Program.js';
import { Geometry } from '../../core/Geometry.js';
import { Vec3 } from '../../math/Vec3.js';
import { Mat3 } from '../../math/Mat3.js';

const vA = new Vec3();
const vB = new Vec3();
const vC = new Vec3();
const vCenter = new Vec3();
const vNormal = new Vec3();

export class FacesNormalsHelper extends Mesh {
    constructor(object, { size = 0.1, color = new Vec3(0.15, 0.86, 0.86), ...meshProps } = {}) {
        const gl = object.gl;

        const positionData = object.geometry.attributes.position.data;
        const positionAndNormal = [];
        const hashSet = new Set();

        function addIfUniquePositionNormal(p, n) {
            if (isUniquePositionNormal(p, n, hashSet)) {
                positionAndNormal.push(p.clone(), n.clone());
            }
        }

        if (object.geometry.attributes.index) {
            const idata = object.geometry.attributes.index.data;

            for (let i = 0; i < idata.length; i += 3) {
                vA.fromArray(positionData, idata[i + 0] * 3);
                vB.fromArray(positionData, idata[i + 1] * 3);
                vC.fromArray(positionData, idata[i + 2] * 3);

                computeTriangleCenterAndNormal(vA, vB, vC, vCenter, vNormal);
                addIfUniquePositionNormal(vCenter, vNormal);
            }
        } else {
            const numVertices = Math.floor(positionData.length / 3);

            for (let i = 0; i < numVertices; i += 3) {
                vA.fromArray(positionData, (i + 0) * 3);
                vB.fromArray(positionData, (i + 1) * 3);
                vC.fromArray(positionData, (i + 2) * 3);

                computeTriangleCenterAndNormal(vA, vB, vC, vCenter, vNormal);
                addIfUniquePositionNormal(vCenter, vNormal);
            }
        }

        const sizeData = new Float32Array([0, size]);
        const nNormals = positionAndNormal.length / 2;
        const positionsArray = new Float32Array(nNormals * 2 * 3);
        const normalsArray = new Float32Array(nNormals * 2 * 3);
        const sizeArray = new Float32Array(nNormals * 2);

        for (let i = 0; i < nNormals; i++) {
            const i6 = i * 6;
            const i2 = i * 2;

            const p = positionAndNormal[i2 + 0];
            const n = positionAndNormal[i2 + 1];

            // duplicate position and normal for line start and end point
            positionsArray.set(p, i6);
            positionsArray.set(p, i6 + 3);

            normalsArray.set(n, i6);
            normalsArray.set(n, i6 + 3);

            sizeArray.set(sizeData, i2);
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

const vAB = new Vec3();
const vCB = new Vec3();

function computeTriangleCenterAndNormal(vA, vB, vC, outCenter, outNormal) {
    outCenter
        .add(vA, vB)
        .add(vC)
        .multiply(1 / 3);

    vAB.sub(vA, vB);
    vCB.sub(vC, vB);
    outNormal.cross(vCB, vAB).normalize();
}

function isUniquePositionNormal(p, n, hashSet, precision = 12) {
    // prettier-ignore
    const hash = [
        p.x.toFixed(precision), p.y.toFixed(precision), p.z.toFixed(precision),
        n.x.toFixed(precision), n.y.toFixed(precision), n.z.toFixed(precision)
    ].join('#');

    const oldSize = hashSet.size;
    hashSet.add(hash);
    return hashSet.size - oldSize === 1;
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
