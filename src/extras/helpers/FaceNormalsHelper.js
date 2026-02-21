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
        const gpu = object.renderer;

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

        const geometry = new Geometry(gpu, {
            position: { size: 3, data: positionsArray },
            normal: { size: 3, data: normalsArray },
            size: { size: 1, data: sizeArray },
        });

        const program = new Program(gpu, {
            vertex,
            fragment,
            uniforms: {
                color: { value: color },
                worldNormalMatrix: { value: new Mat3() },
                objectWorldMatrix: { value: object.worldMatrix },
            },
            topology: 'line-list',
            cullFace: false,
        });

        super(gpu, { ...meshProps, geometry, program });

        this.object = object;
    }

    draw(arg) {
        this.program.uniforms.worldNormalMatrix.value.getNormalMatrix(this.object.worldMatrix);
        super.draw(arg);
    }
}

const vertex = /* wgsl */ `
struct MaterialUniforms {
    color : vec3f,
    worldNormalMatrix : mat3x3f,
    objectWorldMatrix : mat4x4f,
};

@group(0) @binding(0) var<uniform> material : MaterialUniforms;

struct ObjectUniforms {
    modelMatrix : mat4x4f,
    viewMatrix : mat4x4f,
    modelViewMatrix : mat4x4f,
    projectionMatrix : mat4x4f,
    normalMatrix : mat3x3f,
    cameraPosition : vec3f,
};

@group(1) @binding(0) var<uniform> object : ObjectUniforms;

struct VertexInput {
    @location(0) position : vec3f,
    @location(1) normal : vec3f,
    @location(2) size : f32,
};

struct VertexOutput {
    @builtin(position) position : vec4f,
};

@vertex fn main(input : VertexInput) -> VertexOutput {
    var output : VertexOutput;
    let n = normalize(material.worldNormalMatrix * input.normal) * input.size;
    let p = (material.objectWorldMatrix * vec4f(input.position, 1.0)).xyz;
    output.position = object.projectionMatrix * object.viewMatrix * vec4f(p + n, 1.0);
    return output;
}
`;

const fragment = /* wgsl */ `
struct MaterialUniforms {
    color : vec3f,
    worldNormalMatrix : mat3x3f,
    objectWorldMatrix : mat4x4f,
};

@group(0) @binding(0) var<uniform> material : MaterialUniforms;

@fragment fn main() -> @location(0) vec4f {
    return vec4f(material.color, 1.0);
}
`;
