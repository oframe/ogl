let nagaModule = null;

export class NagaTranspiler {
    static async init(wasmUrl) {
        if (nagaModule) return;

        const response = await fetch(wasmUrl);
        const wasmBytes = await response.arrayBuffer();
        const { instance } = await WebAssembly.instantiate(wasmBytes);
        nagaModule = instance.exports;
    }

    static glslToWgsl(source, stage = 'vertex') {
        if (!nagaModule) {
            throw new Error('NagaTranspiler not initialized. Call NagaTranspiler.init(wasmUrl) first.');
        }

        // Encode GLSL source string to WASM memory
        const encoder = new TextEncoder();
        const encoded = encoder.encode(source);

        const stageId = stage === 'vertex' ? 0 : stage === 'fragment' ? 1 : 2;

        // Allocate memory in WASM
        const inputPtr = nagaModule.alloc(encoded.length + 1);
        const inputView = new Uint8Array(nagaModule.memory.buffer, inputPtr, encoded.length + 1);
        inputView.set(encoded);
        inputView[encoded.length] = 0; // null terminator

        // Call transpile
        const resultPtr = nagaModule.glsl_to_wgsl(inputPtr, encoded.length, stageId);

        // Read result string
        const resultView = new Uint8Array(nagaModule.memory.buffer);
        let end = resultPtr;
        while (resultView[end] !== 0) end++;

        const decoder = new TextDecoder();
        const wgsl = decoder.decode(resultView.slice(resultPtr, end));

        // Free memory
        nagaModule.dealloc(inputPtr, encoded.length + 1);
        nagaModule.dealloc(resultPtr, end - resultPtr + 1);

        if (wgsl.startsWith('ERROR:')) {
            throw new Error('GLSL to WGSL transpilation failed: ' + wgsl);
        }

        return wgsl;
    }
}
