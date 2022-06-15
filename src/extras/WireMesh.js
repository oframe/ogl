import { Mesh } from '../core/Mesh.js';
import { Program } from '../core/Program.js';
import { Geometry } from '../core/Geometry.js';
import { Vec3 } from '../math/Vec3.js';

export class WireMesh extends Mesh {
    constructor(gl, { geometry, wireColor = new Vec3(0, 0.75, 0.5), ...meshProps } = {}) {
        const wireProgram = new Program(gl, {
            vertex,
            fragment,
            uniforms: { wireColor: { value: wireColor } },
        });

        const positionArray = geometry.attributes.position.data;
        const indices = [];
        const hashSet = new Set();

        if (geometry.attributes.index) {
            const idata = geometry.attributes.index.data;

            for (let i = 0; i < idata.length; i += 3) {
                const idxs = [idata[i], idata[i + 1], idata[i + 1], idata[i + 2], idata[i + 2], idata[i]];
                for (let j = 0; j < idxs.length; j += 2) {
                    if (isUniqueEdgePosition(idxs[j] * 3, idxs[j + 1] * 3, positionArray, hashSet)) {
                        indices.push(idxs[j], idxs[j + 1]);
                    }
                }
            }
        } else {
            const numVertices = Math.floor(positionArray.length / 3);

            for (let i = 0; i < numVertices; i += 3) {
                const idxs = [i, i + 1, i + 1, i + 2, i + 2, i];
                for (let j = 0; j < idxs.length; j += 2) {
                    if (isUniqueEdgePosition(idxs[j] * 3, idxs[j + 1] * 3, positionArray, hashSet)) {
                        indices.push(idxs[j], idxs[j + 1]);
                    }
                }
            }
        }

        const indicesTyped = indices.length > 65536 ? new Uint32Array(indices) : new Uint16Array(indices);
        const wireGeometry = new Geometry(gl, {
            position: { ...geometry.attributes.position },
            index: { data: indicesTyped },
        });

        super(gl, { ...meshProps, mode: gl.LINES, geometry: wireGeometry, program: wireProgram });
    }
}

// from https://github.com/mrdoob/three.js/blob/0c26bb4bb8220126447c8373154ac045588441de/src/geometries/WireframeGeometry.js#L116
function isUniqueEdgePosition(start, end, pos, hashSet) {
    const hash1 = [pos[start], pos[start + 1], pos[start + 2], pos[end], pos[end + 1], pos[end + 2]].join('#');
    const hash2 = [pos[end], pos[end + 1], pos[end + 2], pos[start], pos[start + 1], pos[start + 2]].join('#');
    const oldSize = hashSet.size;
    hashSet.add(hash1);
    hashSet.add(hash2);
    return hashSet.size - oldSize === 2;
}

const vertex = /* glsl */ `
attribute vec3 position;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

void main() {    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragment = /* glsl */ `
precision highp float;
uniform vec3 wireColor;

void main() {    
    gl_FragColor = vec4(wireColor, 1.0);
}
`;
