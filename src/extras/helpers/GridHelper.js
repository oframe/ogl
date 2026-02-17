import { Mesh } from '../../core/Mesh.js';
import { Program } from '../../core/Program.js';
import { Geometry } from '../../core/Geometry.js';
import { Vec3 } from '../../math/Vec3.js';

export class GridHelper extends Mesh {
    constructor(gpu, { size = 10, divisions = 10, color = new Vec3(0.75, 0.75, 0.75), ...meshProps } = {}) {
        const numVertices = (size + 1) * 2 * 2;
        const vertices = new Float32Array(numVertices * 3);

        const hs = size / 2;
        for (let i = 0; i <= divisions; i++) {
            const t = i / divisions;
            const o = t * size - hs;

            vertices.set([o, 0, -hs, o, 0, hs], i * 12);
            vertices.set([-hs, 0, o, hs, 0, o], i * 12 + 6);
        }

        const geometry = new Geometry(gpu, {
            position: { size: 3, data: vertices },
        });

        const program = new Program(gpu, {
            vertex,
            fragment,
            uniforms: {
                color: { value: color },
            },
            topology: 'line-list',
            cullFace: false,
        });
        super(gpu, { ...meshProps, geometry, program });
    }
}

const vertex = /* wgsl */ `
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
};

struct VertexOutput {
    @builtin(position) position : vec4f,
};

@vertex fn main(input : VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.position = object.projectionMatrix * object.modelViewMatrix * vec4f(input.position, 1.0);
    return output;
}
`;

const fragment = /* wgsl */ `
struct MaterialUniforms {
    color : vec3f,
};

@group(0) @binding(0) var<uniform> material : MaterialUniforms;

@fragment fn main() -> @location(0) vec4f {
    return vec4f(material.color, 1.0);
}
`;
