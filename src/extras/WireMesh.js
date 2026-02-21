import { Mesh } from '../core/Mesh.js';
import { Program } from '../core/Program.js';
import { Geometry } from '../core/Geometry.js';
import { Color } from '../math/Color.js';

export class WireMesh extends Mesh {
    constructor(gpu, { geometry, wireColor = new Color(0, 0.75, 0.5), ...meshProps } = {}) {
        const wireProgram = new Program(gpu, {
            vertex,
            fragment,
            uniforms: { wireColor: { value: wireColor } },
            topology: 'line-list',
            cullFace: false,
        });

        const positionArray = geometry.attributes.position.data;
        const indices = [];
        const hashSet = new Set();

        function addUniqueIndices(idx) {
            for (let i = 0; i < idx.length; i += 2) {
                if (isUniqueEdgePosition(idx[i] * 3, idx[i + 1] * 3, positionArray, hashSet)) {
                    indices.push(idx[i], idx[i + 1]);
                }
            }
        }

        if (geometry.attributes.index) {
            const idata = geometry.attributes.index.data;

            for (let i = 0; i < idata.length; i += 3) {
                // For every triangle, make three line pairs (start, end)
                // prettier-ignore
                addUniqueIndices([
                    idata[i], idata[i + 1],
                    idata[i + 1], idata[i + 2],
                    idata[i + 2], idata[i]
                ]);
            }
        } else {
            const numVertices = Math.floor(positionArray.length / 3);

            for (let i = 0; i < numVertices; i += 3) {
                addUniqueIndices([i, i + 1, i + 1, i + 2, i + 2, i]);
            }
        }

        const indicesTyped = indices.length > 65536 ? new Uint32Array(indices) : new Uint16Array(indices);
        const wireGeometry = new Geometry(gpu, {
            position: { ...geometry.attributes.position },
            index: { data: indicesTyped },
        });

        super(gpu, { ...meshProps, geometry: wireGeometry, program: wireProgram });
    }
}

// from https://github.com/mrdoob/three.js/blob/0c26bb4bb8220126447c8373154ac045588441de/src/geometries/WireframeGeometry.js#L116
function isUniqueEdgePosition(start, end, pos, hashSet) {
    // prettier-ignore
    const hash1 = [
        pos[start], pos[start + 1], pos[start + 2],
        pos[end], pos[end + 1], pos[end + 2]
    ].join('#');

    // coincident edge
    // prettier-ignore
    const hash2 = [
        pos[end], pos[end + 1], pos[end + 2],
        pos[start], pos[start + 1], pos[start + 2]
    ].join('#');

    const oldSize = hashSet.size;
    hashSet.add(hash1);
    hashSet.add(hash2);
    return hashSet.size - oldSize === 2;
}

const vertex = /* wgsl */ `
struct MaterialUniforms {
    wireColor : vec3f,
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

const fragment = /* wgsl */ `
struct MaterialUniforms {
    wireColor : vec3f,
};
@group(0) @binding(0) var<uniform> material : MaterialUniforms;

@fragment fn main() -> @location(0) vec4f {
    return vec4f(material.wireColor, 1.0);
}
`;
