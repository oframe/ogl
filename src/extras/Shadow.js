import { Camera } from '../core/Camera.js';
import { Program } from '../core/Program.js';
import { RenderTarget } from '../core/RenderTarget.js';

export class Shadow {
    constructor(gpu, { light = new Camera(gpu), width = 1024, height = width } = {}) {
        this.renderer = gpu.renderer || gpu;

        this.light = light;

        this.target = new RenderTarget(gpu, { width, height });
        this.targetUniform = { value: this.target.texture };

        this.depthProgram = new Program(gpu, {
            vertex: defaultVertex,
            fragment: defaultFragment,
            cullFace: false,
        });

        this.castMeshes = [];
    }

    add({
        mesh,
        receive = true,
        cast = true,
        vertex = defaultVertex,
        fragment = defaultFragment,
        uniformProjection = 'shadowProjectionMatrix',
        uniformView = 'shadowViewMatrix',
        uniformTexture = 'tShadow',
    }) {
        // In WebGPU, uniforms must be declared at Program construction time.
        // If the program already has the shadow uniforms, skip injection.
        if (receive && !mesh.program.uniforms[uniformProjection]) {
            console.warn(
                'Shadow.add: shadow uniforms should be included at Program construction time for WebGPU. ' +
                'Pass shadowProjectionMatrix, shadowViewMatrix, and tShadow in the Program uniforms.'
            );
        }

        if (!cast) return;
        this.castMeshes.push(mesh);

        // Store program for when switching between depth override
        mesh.colorProgram = mesh.program;

        // Check if depth program already attached
        if (mesh.depthProgram) return;

        // Use global depth override if nothing custom passed in
        if (vertex === defaultVertex && fragment === defaultFragment) {
            mesh.depthProgram = this.depthProgram;
            return;
        }

        // Create custom override program
        mesh.depthProgram = new Program(this.renderer, {
            vertex,
            fragment,
            cullFace: false,
        });
    }

    setSize({ width = 1024, height = width }) {
        this.target = new RenderTarget(this.renderer, { width, height });
        this.targetUniform.value = this.target.texture;
    }

    render({ scene }) {
        // For depth render, replace program with depth override.
        // Hide meshes not casting shadows.
        scene.traverse((node) => {
            if (!node.draw) return;
            if (!!~this.castMeshes.indexOf(node)) {
                node.program = node.depthProgram;
            } else {
                node.isForceVisibility = node.visible;
                node.visible = false;
            }
        });

        // Render the depth shadow map using the light as the camera
        this.renderer.render({
            scene,
            camera: this.light,
            target: this.target,
        });

        // Then switch the program back to the normal one
        scene.traverse((node) => {
            if (!node.draw) return;
            if (!!~this.castMeshes.indexOf(node)) {
                node.program = node.colorProgram;
            } else {
                node.visible = node.isForceVisibility;
            }
        });
    }
}

const defaultVertex = /* wgsl */ `
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

const defaultFragment = /* wgsl */ `
    @fragment fn main(@builtin(position) fragCoord : vec4f) -> @location(0) vec4f {
        let v = fragCoord.z;
        let pack = fract(vec4f(1.0, 255.0, 65025.0, 16581375.0) * v);
        return pack - pack.yzww * vec4f(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0);
    }
`;
