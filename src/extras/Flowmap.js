import {RenderTarget} from '../core/RenderTarget.js';
import {Geometry} from '../core/Geometry.js';
import {Program} from '../core/Program.js';
import {Mesh} from '../core/Mesh.js';
import {Vec2} from '../math/Vec2.js';

export class Flowmap {
    constructor(gl, {
        size = 128, // default size of the render targets
        falloff = 0.3, // size of the stamp, percentage of the size
        alpha = 1, // opacity of the stamp
        dissipation = 0.98, // affects the speed that the stamp fades. Closer to 1 is slower
    } = {}) {
        const _this = this;
        this.gl = gl;

        // output uniform containing render target textures
        this.uniform = {value: null};

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
        }

        {
            createFBOs();

            this.aspect = 1;
            this.mouse = new Vec2();
            this.velocity = new Vec2();

            this.mesh = initProgram();
        }

        function createFBOs() {
            let supportLinearFiltering = gl.renderer.extensions[`OES_texture_${gl.renderer.isWebgl2 ? `` : `half_`}float_linear`];

            const options = {
                width: size, 
                height: size, 
                type: gl.renderer.isWebgl2 ? gl.HALF_FLOAT : 
                    gl.renderer.extensions['OES_texture_half_float'] ? gl.renderer.extensions['OES_texture_half_float'].HALF_FLOAT_OES : 
                    gl.UNSIGNED_BYTE,
                format: gl.RGBA,
                internalFormat: gl.renderer.isWebgl2 ? gl.RGBA16F : gl.RGBA,
                minFilter: supportLinearFiltering ? gl.LINEAR : gl.NEAREST,
                depth: false,
            };

            _this.mask.read = new RenderTarget(gl, options);
            _this.mask.write = new RenderTarget(gl, options);
            _this.mask.swap();
        }

        function initProgram() {
            return new Mesh(gl, {

                // Triangle that includes -1 to 1 range for 'position', and 0 to 1 range for 'uv'.
                geometry: new Geometry(gl, {
                    position: {size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3])},
                    uv: {size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2])},
                }),

                program: new Program(gl, {
                    vertex,
                    fragment,
                    uniforms: {
                        tMap: _this.uniform,

                        uFalloff: {value: falloff * 0.5},
                        uAlpha: {value: alpha},
                        uDissipation: {value: dissipation},

                        // User needs to update these
                        uAspect: {value: 1},
                        uMouse: {value: _this.mouse},
                        uVelocity: {value: _this.velocity},
                    },
                    depthTest: false,
                }),
            });
        }
    }

    update() {
        this.mesh.program.uniforms.uAspect.value = this.aspect;

        this.gl.renderer.render({
            scene: this.mesh,
            target: this.mask.write,
            clear: false,
        });
        this.mask.swap();
    }
}

const vertex = `
    attribute vec2 uv;
    attribute vec2 position;

    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = vec4(position, 0, 1);
    }
`;

const fragment = `
    precision highp float;

    uniform sampler2D tMap;

    uniform float uFalloff;
    uniform float uAlpha;
    uniform float uDissipation;
    
    uniform float uAspect;
    uniform vec2 uMouse;
    uniform vec2 uVelocity;

    varying vec2 vUv;

    void main() {
        vec4 color = texture2D(tMap, vUv) * uDissipation;

        vec2 cursor = vUv - uMouse;
        cursor.x *= uAspect;

        vec3 stamp = vec3(uVelocity * vec2(1, -1), 1.0 - pow(1.0 - min(1.0, length(uVelocity)), 3.0));
        float falloff = smoothstep(uFalloff, 0.0, length(cursor)) * uAlpha;

        color.rgb = mix(color.rgb, stamp, vec3(falloff));

        gl_FragColor = color;
    }
`;