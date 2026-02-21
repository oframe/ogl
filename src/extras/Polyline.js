import { Geometry } from '../core/Geometry.js';
import { Program } from '../core/Program.js';
import { Mesh } from '../core/Mesh.js';
import { Vec2 } from '../math/Vec2.js';
import { Vec3 } from '../math/Vec3.js';
import { Color } from '../math/Color.js';

const tmp = /* @__PURE__ */ new Vec3();

export class Polyline {
    constructor(
        gpu,
        {
            points, // Array of Vec3s
            vertex = defaultVertex,
            fragment = defaultFragment,
            uniforms = {},
            attributes = {}, // For passing in custom attribs
        }
    ) {
        this.renderer = gpu.renderer || gpu;
        this.points = points;
        this.count = points.length;

        // Create buffers
        this.position = new Float32Array(this.count * 3 * 2);
        this.prev = new Float32Array(this.count * 3 * 2);
        this.next = new Float32Array(this.count * 3 * 2);
        const side = new Float32Array(this.count * 1 * 2);
        const uv = new Float32Array(this.count * 2 * 2);
        const index = new Uint16Array((this.count - 1) * 3 * 2);

        // Set static buffers
        for (let i = 0; i < this.count; i++) {
            side.set([-1, 1], i * 2);
            const v = i / (this.count - 1);
            uv.set([0, v, 1, v], i * 4);

            if (i === this.count - 1) continue;
            const ind = i * 2;
            index.set([ind + 0, ind + 1, ind + 2], (ind + 0) * 3);
            index.set([ind + 2, ind + 1, ind + 3], (ind + 1) * 3);
        }

        const geometry = (this.geometry = new Geometry(
            gpu,
            Object.assign(attributes, {
                position: { size: 3, data: this.position },
                prev: { size: 3, data: this.prev },
                next: { size: 3, data: this.next },
                side: { size: 1, data: side },
                uv: { size: 2, data: uv },
                index: { size: 1, data: index },
            })
        ));

        // Populate dynamic buffers
        this.updateGeometry();

        // Build uniforms in a fixed order so WGSL struct layout is predictable
        const mergedUniforms = {};
        mergedUniforms.uResolution = uniforms.uResolution || { value: new Vec2() };
        mergedUniforms.uDPR = uniforms.uDPR || { value: 1 };
        mergedUniforms.uThickness = uniforms.uThickness || { value: 1 };
        mergedUniforms.uColor = uniforms.uColor || { value: new Color('#000') };
        mergedUniforms.uMiter = uniforms.uMiter || { value: 1 };
        // Copy any additional user uniforms after the standard ones
        for (let key in uniforms) {
            if (!mergedUniforms[key]) mergedUniforms[key] = uniforms[key];
        }

        this.resolution = mergedUniforms.uResolution;
        this.dpr = mergedUniforms.uDPR;
        this.thickness = mergedUniforms.uThickness;
        this.color = mergedUniforms.uColor;
        this.miter = mergedUniforms.uMiter;

        // Set size uniforms' values
        this.resize();

        const program = (this.program = new Program(gpu, {
            vertex,
            fragment,
            uniforms: mergedUniforms,
        }));

        this.mesh = new Mesh(gpu, { geometry, program });
    }

    updateGeometry() {
        this.points.forEach((p, i) => {
            p.toArray(this.position, i * 3 * 2);
            p.toArray(this.position, i * 3 * 2 + 3);

            if (!i) {
                // If first point, calculate prev using the distance to 2nd point
                tmp.copy(p)
                    .sub(this.points[i + 1])
                    .add(p);
                tmp.toArray(this.prev, i * 3 * 2);
                tmp.toArray(this.prev, i * 3 * 2 + 3);
            } else {
                p.toArray(this.next, (i - 1) * 3 * 2);
                p.toArray(this.next, (i - 1) * 3 * 2 + 3);
            }

            if (i === this.points.length - 1) {
                // If last point, calculate next using distance to 2nd last point
                tmp.copy(p)
                    .sub(this.points[i - 1])
                    .add(p);
                tmp.toArray(this.next, i * 3 * 2);
                tmp.toArray(this.next, i * 3 * 2 + 3);
            } else {
                p.toArray(this.prev, (i + 1) * 3 * 2);
                p.toArray(this.prev, (i + 1) * 3 * 2 + 3);
            }
        });

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.prev.needsUpdate = true;
        this.geometry.attributes.next.needsUpdate = true;
    }

    // Only need to call if not handling resolution uniforms manually
    resize() {
        if (this.resolution) this.resolution.value.set(this.renderer.canvas.width, this.renderer.canvas.height);
        if (this.dpr) this.dpr.value = this.renderer.dpr;
    }
}

// Default WGSL shaders (with camera/object UBO support)
// MaterialUniforms struct order must match the mergedUniforms insertion order above:
// uResolution(vec2f), uDPR(f32), uThickness(f32), uColor(vec3f), uMiter(f32)

const defaultVertex = /* wgsl */ `
    struct MaterialUniforms {
        uResolution : vec2f,
        uDPR : f32,
        uThickness : f32,
        uColor : vec3f,
        uMiter : f32,
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
        @location(1) prev : vec3f,
        @location(2) next : vec3f,
        @location(3) side : f32,
        @location(4) uv : vec2f,
    };

    struct VertexOutput {
        @builtin(position) position : vec4f,
        @location(0) vUv : vec2f,
    };

    @vertex fn main(input : VertexInput) -> VertexOutput {
        let mvp = object.projectionMatrix * object.modelViewMatrix;
        var current = mvp * vec4f(input.position, 1.0);
        let nextPos = mvp * vec4f(input.next, 1.0);
        let prevPos = mvp * vec4f(input.prev, 1.0);

        let aspect = vec2f(material.uResolution.x / material.uResolution.y, 1.0);
        let currentScreen = current.xy / current.w * aspect;
        let nextScreen = nextPos.xy / nextPos.w * aspect;
        let prevScreen = prevPos.xy / prevPos.w * aspect;

        let dir1 = normalize(currentScreen - prevScreen);
        let dir2 = normalize(nextScreen - currentScreen);
        let dir = normalize(dir1 + dir2);

        var normal = vec2f(-dir.y, dir.x);
        normal /= mix(1.0, max(0.3, dot(normal, vec2f(-dir1.y, dir1.x))), material.uMiter);
        normal /= aspect;

        let pixelWidthRatio = 1.0 / (material.uResolution.y / material.uDPR);
        let pixelWidth = current.w * pixelWidthRatio;
        normal *= pixelWidth * material.uThickness;

        var output : VertexOutput;
        output.vUv = input.uv;
        output.position = vec4f(current.xy - normal * input.side, current.zw);
        return output;
    }
`;

const defaultFragment = /* wgsl */ `
    struct MaterialUniforms {
        uResolution : vec2f,
        uDPR : f32,
        uThickness : f32,
        uColor : vec3f,
        uMiter : f32,
    };

    @group(0) @binding(0) var<uniform> material : MaterialUniforms;

    struct FragmentInput {
        @location(0) vUv : vec2f,
    };

    @fragment fn main(input : FragmentInput) -> @location(0) vec4f {
        return vec4f(material.uColor, 1.0);
    }
`;
