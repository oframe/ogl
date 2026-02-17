import { Program } from '../core/Program.js';

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
        @location(1) normal : vec3f,
    };

    struct VertexOutput {
        @builtin(position) position : vec4f,
        @location(0) vNormal : vec3f,
    };

    @vertex fn main(input : VertexInput) -> VertexOutput {
        var output : VertexOutput;
        output.vNormal = normalize(object.normalMatrix * input.normal);
        output.position = object.projectionMatrix * object.modelViewMatrix * vec4f(input.position, 1.0);
        return output;
    }
`;

const fragment = /* wgsl */ `
    struct FragmentInput {
        @location(0) vNormal : vec3f,
    };

    @fragment fn main(input : FragmentInput) -> @location(0) vec4f {
        return vec4f(normalize(input.vNormal), 1.0);
    }
`;

export function NormalProgram(gpu) {
    return new Program(gpu, {
        vertex: vertex,
        fragment: fragment,
        cullFace: false,
    });
}
