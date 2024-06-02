import { Program } from '../core/Program.js';
import { Mesh } from '../core/Mesh.js';
import { RenderTarget } from '../core/RenderTarget.js';
import { Triangle } from './Triangle.js';

export class Post {
    constructor(
        gl,
        {
            width,
            height,
            dpr,
            wrapS = gl.CLAMP_TO_EDGE,
            wrapT = gl.CLAMP_TO_EDGE,
            minFilter = gl.LINEAR,
            magFilter = gl.LINEAR,
            geometry = new Triangle(gl),
            targetOnly = null,
            depth = true,
        } = {}
    ) {
        this.gl = gl;

        this.passes = [];

        this.geometry = geometry;

        this.uniform = { value: null };
        this.targetOnly = targetOnly;

        if (dpr) this.dpr = dpr;
        if (width) this.width = width;
        if (height) this.height = height;

        dpr = this.dpr || this.gl.renderer.dpr;
        this.resolutionWidth = Math.floor(this.width || this.gl.renderer.width * dpr);
        this.resolutionHeight = Math.floor(this.height || this.gl.renderer.height * dpr);

        let options = {
            dpr: this.dpr,
            width: this.resolutionWidth,
            height: this.resolutionHeight,
            wrapS,
            wrapT,
            minFilter,
            magFilter,
            depth,
        };

        const fbo = (this.fbo = {
            read: new RenderTarget(this.gl, options),
            write: new RenderTarget(this.gl, options),
            swap: () => {
                let temp = fbo.read;
                fbo.read = fbo.write;
                fbo.write = temp;
            },
        });
    }

    addPass({ vertex = defaultVertex, fragment = defaultFragment, uniforms = {}, textureUniform = 'tMap', enabled = true } = {}) {
        uniforms[textureUniform] = { value: this.fbo.read.texture };

        const program = new Program(this.gl, { vertex, fragment, uniforms });
        const mesh = new Mesh(this.gl, { geometry: this.geometry, program });

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

        dpr = this.dpr || this.gl.renderer.dpr;
        this.resolutionWidth = Math.floor(this.width || this.gl.renderer.width * dpr);
        this.resolutionHeight = Math.floor(this.height || this.gl.renderer.height * dpr);

        this.fbo.read.setSize(this.resolutionWidth, this.resolutionHeight);
        this.fbo.write.setSize(this.resolutionWidth, this.resolutionHeight);
    }

    // Uses same arguments as renderer.render, with addition of optional texture passed in to avoid scene render
    render({ scene, camera, texture, target = null, update = true, sort = true, frustumCull = true, beforePostCallbacks }) {
        const enabledPasses = this.passes.filter((pass) => pass.enabled);

        if (!texture) {
            this.gl.renderer.render({
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
            this.gl.renderer.render({
                scene: pass.mesh,
                target: i === enabledPasses.length - 1 && (target || !this.targetOnly) ? target : this.fbo.write,
                clear: true,
            });
            this.fbo.swap();
        });

        this.uniform.value = this.fbo.read.texture;
    }
}

const defaultVertex = /* glsl */ `
    attribute vec2 uv;
    attribute vec2 position;

    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = vec4(position, 0, 1);
    }
`;

const defaultFragment = /* glsl */ `
    precision highp float;

    uniform sampler2D tMap;
    varying vec2 vUv;

    void main() {
        gl_FragColor = texture2D(tMap, vUv);
    }
`;
