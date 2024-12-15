// TODO: Destroy render targets if size changed and exists

import {Geometry} from '../core/Geometry.js';
import {Program} from '../core/Program.js';
import {Mesh} from '../core/Mesh.js';
import {RenderTarget} from '../core/RenderTarget.js';

export class Post {
    constructor(gl, {
        width,
        height,
        dpr,
        wrapS = gl.CLAMP_TO_EDGE,
        wrapT = gl.CLAMP_TO_EDGE,
        minFilter = gl.LINEAR,
        magFilter = gl.LINEAR,
        geometry = new Geometry(gl, {
            position: {size: 3, data: new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0])},
            uv: {size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2])},
        }),
    } = {}) {
        this.gl = gl;

        this.options = {wrapS, wrapT, minFilter, magFilter};

        this.passes = [];

        this.geometry = geometry;

        const fbo = this.fbo = {
            read: null,
            write: null,
            swap: () => {
                let temp = fbo.read;
                fbo.read = fbo.write;
                fbo.write = temp;
            },
        };

        this.resize({width, height, dpr});
    }

    addPass({
        vertex = defaultVertex,
        fragment = defaultFragment,
        uniforms = {},
        textureUniform = 'tMap',
        enabled = true,
    } = {}) {
        uniforms[textureUniform] = {value: this.fbo.read.texture};

        const program = new Program(this.gl, {vertex, fragment, uniforms});
        const mesh = new Mesh(this.gl, {geometry: this.geometry, program});

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

    resize({width, height, dpr} = {}) {
        if (dpr) this.dpr = dpr;
        if (width) {
            this.width = width;
            this.height = height || width;
        }

        dpr = this.dpr || this.gl.renderer.dpr;
        width = (this.width || this.gl.renderer.width) * dpr;
        height = (this.height || this.gl.renderer.height) * dpr;

        this.options.width = width;
        this.options.height = height;

        this.fbo.read = new RenderTarget(this.gl, this.options);
        this.fbo.write = new RenderTarget(this.gl, this.options);
    }

    // Uses same arguments as renderer.render
    render({
        scene,
        camera,
        target = null,
        update = true,
        sort = true,
        frustumCull = true,
    }) {
        const enabledPasses = this.passes.filter(pass => pass.enabled);
        
        this.gl.renderer.render({
            scene, camera,
            target: enabledPasses.length ? this.fbo.write : target,
            update, sort, frustumCull,
        });
        this.fbo.swap();

        enabledPasses.forEach((pass, i) => {
            pass.mesh.program.uniforms[pass.textureUniform].value = this.fbo.read.texture;
            this.gl.renderer.render({
                scene: pass.mesh, 
                target: i === enabledPasses.length - 1 ? target : this.fbo.write,
                clear: false,
            });
            this.fbo.swap();
        });
    }
}

const defaultVertex = `
attribute vec2 uv;
attribute vec3 position;

varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

const defaultFragment = `
precision highp float;

uniform sampler2D tMap;
varying vec2 vUv;

void main() {
    gl_FragColor = texture2D(tMap, vUv);
}
`;
