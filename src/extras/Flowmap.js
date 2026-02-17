import { RenderTarget } from '../core/RenderTarget.js';
import { Program } from '../core/Program.js';
import { Mesh } from '../core/Mesh.js';
import { Vec2 } from '../math/Vec2.js';
import { Triangle } from './Triangle.js';

export class Flowmap {
    constructor(
        gpu,
        {
            size = 128, // default size of the render targets
            falloff = 0.3, // size of the stamp, percentage of the size
            alpha = 1, // opacity of the stamp
            dissipation = 0.98, // affects the speed that the stamp fades. Closer to 1 is slower
        } = {}
    ) {
        const _this = this;
        this.renderer = gpu.renderer || gpu;

        // output uniform containing render target textures
        this.uniform = { value: null };

        this.mask = {
            read: null,
            write: null,

            // Helper function to ping pong the render targets and update the uniform
            swap: () => {
                let temp = _this.mask.read;
                _this.mask.read = _this.mask.write;
                _this.mask.write = temp;
                _this.uniform.value = _this.mask.read.texture;
            },
        };

        {
            createFBOs();

            this.aspect = 1;
            this.mouse = new Vec2();
            this.velocity = new Vec2();

            this.mesh = initProgram();
        }

        function createFBOs() {
            const options = {
                width: size,
                height: size,
                format: 'rgba16float',
                depth: false,
            };

            _this.mask.read = new RenderTarget(gpu, options);
            _this.mask.write = new RenderTarget(gpu, options);
            _this.mask.swap();
        }

        function initProgram() {
            return new Mesh(gpu, {
                // Triangle that includes -1 to 1 range for 'position', and 0 to 1 range for 'uv'.
                geometry: new Triangle(gpu),

                program: new Program(gpu, {
                    vertex,
                    fragment,
                    uniforms: {
                        tMap: _this.uniform,

                        uFalloff: { value: falloff * 0.5 },
                        uAlpha: { value: alpha },
                        uDissipation: { value: dissipation },

                        // User needs to update these
                        uAspect: { value: 1 },
                        uMouse: { value: _this.mouse },
                        uVelocity: { value: _this.velocity },
                    },
                    depthTest: false,
                }),
            });
        }
    }

    update() {
        this.mesh.program.uniforms.uAspect.value = this.aspect;

        this.renderer.render({
            scene: this.mesh,
            target: this.mask.write,
            clear: false,
        });
        this.mask.swap();
    }
}

const vertex = /* wgsl */ `
    struct VertexInput {
        @location(0) position : vec2f,
        @location(1) uv : vec2f,
    };

    struct VertexOutput {
        @builtin(position) position : vec4f,
        @location(0) vUv : vec2f,
    };

    @vertex fn main(input : VertexInput) -> VertexOutput {
        var output : VertexOutput;
        output.vUv = input.uv;
        output.position = vec4f(input.position, 0.0, 1.0);
        return output;
    }
`;

const fragment = /* wgsl */ `
    struct MaterialUniforms {
        uFalloff : f32,
        uAlpha : f32,
        uDissipation : f32,
        uAspect : f32,
        uMouse : vec2f,
        uVelocity : vec2f,
    };

    @group(0) @binding(0) var<uniform> material : MaterialUniforms;
    @group(0) @binding(1) var tMap : texture_2d<f32>;
    @group(0) @binding(2) var tMapSampler : sampler;

    struct FragmentInput {
        @location(0) vUv : vec2f,
    };

    @fragment fn main(input : FragmentInput) -> @location(0) vec4f {
        var color = textureSample(tMap, tMapSampler, vec2f(input.vUv.x, 1.0 - input.vUv.y)) * material.uDissipation;

        var cursor = input.vUv - material.uMouse;
        cursor.x *= material.uAspect;

        let stamp = vec3f(material.uVelocity * vec2f(1.0, -1.0), 1.0 - pow(1.0 - min(1.0, length(material.uVelocity)), 3.0));
        let falloff = smoothstep(material.uFalloff, 0.0, length(cursor)) * material.uAlpha;

        color = vec4f(mix(color.rgb, stamp, vec3f(falloff)), color.a);

        return color;
    }
`;
