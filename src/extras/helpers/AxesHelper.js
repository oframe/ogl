import { Mesh } from '../../core/Mesh.js';
import { Program } from '../../core/Program.js';
import { Geometry } from '../../core/Geometry.js';
import { Vec3 } from '../../math/Vec3.js';

export class AxesHelper extends Mesh {
    constructor(
        gpu,
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

        const geometry = new Geometry(gpu, {
            position: { size: 3, data: vertices },
            color: { size: 3, data: colors },
        });

        const program = new Program(gpu, { vertex, fragment, topology: 'line-list', cullFace: false });

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
    @location(1) color : vec3f,
};

struct VertexOutput {
    @builtin(position) position : vec4f,
    @location(0) vColor : vec3f,
};

@vertex fn main(input : VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.vColor = input.color;
    output.position = object.projectionMatrix * object.modelViewMatrix * vec4f(input.position, 1.0);
    return output;
}
`;

const fragment = /* wgsl */ `
struct FragInput {
    @location(0) vColor : vec3f,
};

@fragment fn main(input : FragInput) -> @location(0) vec4f {
    return vec4f(input.vColor, 1.0);
}
`;
