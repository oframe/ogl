import { Geometry } from '../core/Geometry.js';
import { Vec3 } from '../math/Vec3.js';
import { Vec2 } from '../math/Vec2.js';

// helper variables
const vertex = /* @__PURE__ */ new Vec3();
const normal = /* @__PURE__ */ new Vec3();
const uv = /* @__PURE__ */ new Vec2();
const point = /* @__PURE__ */ new Vec3();

export class Tube extends Geometry {
    constructor(gl, { path, radius = 1, tubularSegments = 64, radialSegments = 8, closed = false, attributes = {} } = {}) {
        super(gl, attributes);

        this.path = path;
        this.radius = radius;
        this.tubularSegments = tubularSegments;
        this.radialSegments = radialSegments;
        this.closed = closed;

        this.frenetFrames = path.computeFrenetFrames(tubularSegments, closed);

        const numVertices = (tubularSegments + 1) * (radialSegments + 1);
        const numIndices = tubularSegments * radialSegments * 6;
        this.positions = new Float32Array(numVertices * 3);
        this.normals = new Float32Array(numVertices * 3);
        this.uvs = new Float32Array(numVertices * 2);
        this.indices = numVertices > 65536 ? new Uint32Array(numIndices) : new Uint16Array(numIndices);

        // create buffer data
        this._generateAttributes();
        this._generateIndices();

        this.addAttribute('position', { size: 3, data: this.positions });
        this.addAttribute('normal', { size: 3, data: this.normals });
        this.addAttribute('uv', { size: 2, data: this.uvs });
        this.setIndex({ data: this.indices });
    }

    _generateAttributes() {
        for (let i = 0; i <= this.tubularSegments; i++) {
            let ci = i;
            if (i === this.tubularSegments) {
                // if the geometry is not closed, generate the last row of vertices and normals
                // at the regular position on the given path
                // if the geometry is closed, duplicate the first row of vertices and normals (uvs will differ)
                ci = this.closed ? 0 : this.tubularSegments;
            }

            this.path.getPointAt(ci / this.tubularSegments, point);
            // retrieve corresponding normal and binormal
            const N = this.frenetFrames.normals[ci];
            const B = this.frenetFrames.binormals[ci];

            // generate normals and vertices for the current segment
            for (let j = 0; j <= this.radialSegments; j++) {
                const v = (j / this.radialSegments) * Math.PI * 2;
                const sin = Math.sin(v);
                const cos = -Math.cos(v);

                const idx = i * (this.radialSegments + 1) + j;

                // normal
                normal.x = cos * N.x + sin * B.x;
                normal.y = cos * N.y + sin * B.y;
                normal.z = cos * N.z + sin * B.z;
                // normal.normalize(); // ???
                this.normals.set(normal, idx * 3);

                // vertex
                vertex.x = point.x + this.radius * normal.x;
                vertex.y = point.y + this.radius * normal.y;
                vertex.z = point.z + this.radius * normal.z;
                this.positions.set(vertex, idx * 3);

                // uv
                uv.x = i / this.tubularSegments;
                uv.y = j / this.radialSegments;
                this.uvs.set(uv, idx * 2);
            }
        }
    }

    _generateIndices() {
        for (let j = 1; j <= this.tubularSegments; j++) {
            for (let i = 1; i <= this.radialSegments; i++) {
                const a = (this.radialSegments + 1) * (j - 1) + (i - 1);
                const b = (this.radialSegments + 1) * j + (i - 1);
                const c = (this.radialSegments + 1) * j + i;
                const d = (this.radialSegments + 1) * (j - 1) + i;

                const idx = (j - 1) * this.radialSegments + (i - 1);
                this.indices.set([a, b, d, b, c, d], idx * 6);
            }
        }
    }
}
