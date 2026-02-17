import { Program } from '../core/Program.js';
import { Mesh } from '../core/Mesh.js';
import { RenderTarget } from '../core/RenderTarget.js';
import { Triangle } from './Triangle.js';

export class Post {
    constructor(
        gpu,
        {
            width,
            height,
            dpr,
            geometry = new Triangle(gpu),
            targetOnly = null,
            depth = true,
        } = {}
    ) {
        this.renderer = gpu.renderer || gpu;

        this.passes = [];

        this.geometry = geometry;

        this.targetOnly = targetOnly;

        if (dpr) this.dpr = dpr;
        if (width) this.width = width;
        if (height) this.height = height;

        dpr = this.dpr || this.renderer.dpr;
        this.resolutionWidth = Math.floor(this.width || this.renderer.width * dpr);
        this.resolutionHeight = Math.floor(this.height || this.renderer.height * dpr);

        const options = {
            width: this.resolutionWidth,
            height: this.resolutionHeight,
            depth,
        };

        const fbo = (this.fbo = {
            read: new RenderTarget(this.renderer, options),
            write: new RenderTarget(this.renderer, options),
            swap: () => {
                let temp = fbo.read;
                fbo.read = fbo.write;
                fbo.write = temp;
            },
        });

        // Initialize with read texture so it's never null when used as a uniform in other passes
        this.uniform = { value: this.fbo.read.texture };
    }

    addPass({ vertex = defaultVertex, fragment = defaultFragment, uniforms = {}, textureUniform = 'tMap', enabled = true } = {}) {
        uniforms[textureUniform] = { value: this.fbo.read.texture };

        const program = new Program(this.renderer, { vertex, fragment, uniforms });
        const mesh = new Mesh(this.renderer, { geometry: this.geometry, program });

        const pass = {
            mesh,
            program,
            uniforms,
            enabled,
            textureUniform,
        };

        this.passes.push(pass);
        return pass;
    }

    resize({ width, height, dpr } = {}) {
        if (dpr) this.dpr = dpr;
        if (width) this.width = width;
        if (height) this.height = height;

        dpr = this.dpr || this.renderer.dpr;
        this.resolutionWidth = Math.floor(this.width || this.renderer.width * dpr);
        this.resolutionHeight = Math.floor(this.height || this.renderer.height * dpr);

        this.fbo.read.setSize(this.resolutionWidth, this.resolutionHeight);
        this.fbo.write.setSize(this.resolutionWidth, this.resolutionHeight);
    }

    // Uses same arguments as renderer.render, with addition of optional texture passed in to avoid scene render
    render({ scene, camera, texture, target = null, update = true, sort = true, frustumCull = true, beforePostCallbacks }) {
        const enabledPasses = this.passes.filter((pass) => pass.enabled);

        if (!texture) {
            this.renderer.render({
                scene,
                camera,
                target: enabledPasses.length || (!target && this.targetOnly) ? this.fbo.write : target,
                update,
                sort,
                frustumCull,
            });
            this.fbo.swap();

            // Callback after rendering scene, but before post effects
            if (beforePostCallbacks) beforePostCallbacks.forEach((f) => f && f());
        }

        enabledPasses.forEach((pass, i) => {
            pass.mesh.program.uniforms[pass.textureUniform].value = !i && texture ? texture : this.fbo.read.texture;
            this.renderer.render({
                scene: pass.mesh,
                target: i === enabledPasses.length - 1 && (target || !this.targetOnly) ? target : this.fbo.write,
                clear: true,
            });
            this.fbo.swap();
        });

        this.uniform.value = this.fbo.read.texture;
    }
}

const defaultVertex = /* wgsl */ `
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
        output.vUv = vec2f(input.uv.x, 1.0 - input.uv.y);
        output.position = vec4f(input.position, 0.0, 1.0);
        return output;
    }
`;

const defaultFragment = /* wgsl */ `
    @group(0) @binding(0) var tMapTex : texture_2d<f32>;
    @group(0) @binding(1) var tMapSampler : sampler;

    struct FragmentInput {
        @location(0) vUv : vec2f,
    };

    @fragment fn main(input : FragmentInput) -> @location(0) vec4f {
        return textureSample(tMapTex, tMapSampler, input.vUv);
    }
`;
