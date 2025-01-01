// TODO
// [ ] Cleanup decoder
// [ ] Point clouds
// [ ] WASM support

// https://github.com/mrdoob/three.js/tree/master/examples/jsm/libs/draco
importScripts('gltf/draco_decoder.js');

let draco;
let decoder;

let moduleReadyResolve;
const moduleReady = new Promise((res) => (moduleReadyResolve = res));

// Create the Draco decoder
// const initStartTime = performance.now();
DracoDecoderModule().then((module) => {
    draco = module;
    decoder = new draco.Decoder();
    // const elapsed = performance.now() - initStartTime;
    // console.log('worker init time', `${elapsed.toFixed(2)}ms`);
    moduleReadyResolve();
});

addEventListener('message', ({ data }) => {
    decodeGeometry(data);
});

async function decodeGeometry({ id, buffer, config }) {
    await moduleReady;

    // const startTime = performance.now();
    const array = new Int8Array(buffer);
    const { attributeIds, attributeTypes } = config;

    const dracoGeometry = new draco.Mesh();
    const decodingStatus = decoder.DecodeArrayToMesh(array, array.byteLength, dracoGeometry);

    if (!decodingStatus.ok() || dracoGeometry.ptr === 0)
        postMessage({ id, error: `Decoding failed: ${decodingStatus.error_msg()}` });

    const geometry = { index: null, attributes: [] };

    // Gather all vertex attributes
    for (const attributeName in attributeIds) {
        const attributeType = self[attributeTypes[attributeName]];
        const attribute = decoder.GetAttributeByUniqueId(dracoGeometry, attributeIds[attributeName]);
        const attributeResult = decodeAttribute(dracoGeometry, attributeName, attributeType, attribute);

        geometry.attributes.push(attributeResult);
    }

    // Add index
    geometry.index = decodeIndex(dracoGeometry);

    draco.destroy(dracoGeometry);
    // draco.destroy(decoder);

    // const elapsed = performance.now() - startTime;
    // console.log('decodeGeometry time', `${elapsed.toFixed(2)}ms`);

    // Transfer buffers
    const buffers = geometry.attributes.map((attr) => attr.array.buffer);
    if (geometry.index) buffers.push(geometry.index.array.buffer);

    postMessage(
        {
            id,
            geometry,
        },
        buffers
    );
}

// https://github.com/mrdoob/three.js/blob/master/examples/jsm/loaders/DRACOLoader.js

function decodeIndex(dracoGeometry) {
    const numFaces = dracoGeometry.num_faces();
    const numIndices = numFaces * 3;
    const byteLength = numIndices * 4;

    const ptr = draco._malloc(byteLength);
    decoder.GetTrianglesUInt32Array(dracoGeometry, byteLength, ptr);
    const index = new Uint32Array(draco.HEAPF32.buffer, ptr, numIndices).slice();
    draco._free(ptr);

    return { array: index, itemSize: 1 };
}

function decodeAttribute(dracoGeometry, attributeName, attributeType, attribute) {
    const numComponents = attribute.num_components();
    const numPoints = dracoGeometry.num_points();
    const numValues = numPoints * numComponents;
    const byteLength = numValues * attributeType.BYTES_PER_ELEMENT;
    const dataType = getDracoDataType(attributeType);

    const ptr = draco._malloc(byteLength);
    decoder.GetAttributeDataArrayForAllPoints(dracoGeometry, attribute, dataType, byteLength, ptr);
    const array = new attributeType(draco.HEAPF32.buffer, ptr, numValues).slice();
    draco._free(ptr);

    return {
        name: attributeName,
        array,
        itemSize: numComponents,
    };
}

function getDracoDataType(attributeType) {
    switch (attributeType) {
        case Float32Array:
            return draco.DT_FLOAT32;
        case Int8Array:
            return draco.DT_INT8;
        case Int16Array:
            return draco.DT_INT16;
        case Int32Array:
            return draco.DT_INT32;
        case Uint8Array:
            return draco.DT_UINT8;
        case Uint16Array:
            return draco.DT_UINT16;
        case Uint32Array:
            return draco.DT_UINT32;
    }
}
