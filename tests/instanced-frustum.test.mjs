import assert from 'node:assert/strict';
import test from 'node:test';
import { Transform } from '../src/core/Transform.js';
import { InstancedMesh } from '../src/extras/InstancedMesh.js';

function createMesh({ lightmap = false } = {}) {
    const matrices = new Float32Array([
        1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, 0, 0, 1,
        1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 4, 0, 0, 1,
    ]);
    const attributes = { instanceMatrix: { data: matrices, needsUpdate: false } };
    if (lightmap) attributes.lightmapScaleOffset = { data: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]), needsUpdate: false };
    const geometry = { attributes, instancedCount: 2 };
    // The CPU-side callback/data path needs no WebGL calls.
    const mesh = new InstancedMesh({ canvas: {}, TRIANGLES: 4 }, { geometry, program: {} });
    mesh.setParent(new Transform());
    return { mesh, geometry, originalMatrices: [...matrices] };
}

test('removeFrustumCull unregisters only its callback and restores all instances', () => {
    const { mesh, geometry, originalMatrices } = createMesh();
    const before = () => {};
    const after = () => {};
    mesh.onBeforeRender(before);
    mesh.addFrustumCull();
    mesh.onBeforeRender(after);
    assert.equal(mesh.beforeRenderCallbacks.length, 3);

    // Simulate a prior culling pass that compacted the instance buffer.
    geometry.instancedCount = 1;
    geometry.attributes.instanceMatrix.data.fill(0);
    mesh.removeFrustumCull();

    assert.deepEqual(mesh.beforeRenderCallbacks, [before, after]);
    assert.equal(geometry.instancedCount, 2);
    assert.deepEqual([...geometry.attributes.instanceMatrix.data], originalMatrices);
    assert.equal(geometry.attributes.instanceMatrix.needsUpdate, true);
});

test('removing the same culling callback twice preserves other callbacks', () => {
    const { mesh } = createMesh();
    mesh.addFrustumCull();
    const other = () => {};
    mesh.onBeforeRender(other);
    mesh.removeFrustumCull();
    mesh.removeFrustumCull();
    assert.deepEqual(mesh.beforeRenderCallbacks, [other]);
});

test('removeFrustumCull restores the original lightmap buffer', () => {
    const { mesh, geometry } = createMesh({ lightmap: true });
    const originalLightmap = [...geometry.attributes.lightmapScaleOffset.data];
    mesh.addFrustumCull();
    geometry.attributes.lightmapScaleOffset.data.fill(0);
    mesh.removeFrustumCull();
    assert.deepEqual([...geometry.attributes.lightmapScaleOffset.data], originalLightmap);
    assert.equal(geometry.attributes.lightmapScaleOffset.needsUpdate, true);
});
