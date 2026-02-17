export class Compute {
    constructor(gpu, { shader, uniforms = {}, workgroupSize = [64, 1, 1], dataLength } = {}) {
        this.renderer = gpu.renderer || gpu;
        this.device = this.renderer.device;
        this.uniforms = uniforms;
        this.workgroupSize = workgroupSize;
        this.dataLength = dataLength;

        // Create compute shader module
        this.shaderModule = this.device.createShaderModule({ code: shader });

        // Build bind group layout entries from uniforms
        this.storageBuffers = {};
        this.uniformBuffers = {};
        this._buildBindings();

        // Compute workgroup dispatch count
        this.dispatchX = Math.ceil(dataLength / workgroupSize[0]);
        this.dispatchY = 1;
        this.dispatchZ = 1;
    }

    _buildBindings() {
        const entries = [];
        const bindGroupEntries = [];
        let binding = 0;

        for (let name in this.uniforms) {
            const uniform = this.uniforms[name];

            if (uniform.storage) {
                // Storage buffer
                const size = uniform.data ? uniform.data.byteLength : uniform.size;
                const buffer = this.device.createBuffer({
                    size,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
                    mappedAtCreation: !!uniform.data,
                });

                if (uniform.data) {
                    new uniform.data.constructor(buffer.getMappedRange()).set(uniform.data);
                    buffer.unmap();
                }

                this.storageBuffers[name] = buffer;

                entries.push({
                    binding,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: uniform.readOnly ? 'read-only-storage' : 'storage' },
                });

                bindGroupEntries.push({ binding, resource: { buffer } });
                binding++;
            } else {
                // Uniform buffer
                const data = uniform.value;
                const value = typeof data === 'number' ? new Float32Array([data]) : data;
                const bufferSize = Math.ceil(value.byteLength / 16) * 16;

                const buffer = this.device.createBuffer({
                    size: bufferSize,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                });

                this.device.queue.writeBuffer(buffer, 0, value);
                this.uniformBuffers[name] = { buffer, value };

                entries.push({
                    binding,
                    visibility: GPUShaderStage.COMPUTE,
                    buffer: { type: 'uniform' },
                });

                bindGroupEntries.push({ binding, resource: { buffer } });
                binding++;
            }
        }

        this.bindGroupLayout = this.device.createBindGroupLayout({ entries });

        this.bindGroup = this.device.createBindGroup({
            layout: this.bindGroupLayout,
            entries: bindGroupEntries,
        });

        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [this.bindGroupLayout],
        });

        this.pipeline = this.device.createComputePipeline({
            layout: pipelineLayout,
            compute: {
                module: this.shaderModule,
                entryPoint: 'main',
            },
        });
    }

    updateUniform(name, data) {
        const entry = this.uniformBuffers[name];
        if (!entry) return;
        const value = typeof data === 'number' ? new Float32Array([data]) : data;
        this.device.queue.writeBuffer(entry.buffer, 0, value);
    }

    updateStorage(name, data) {
        const buffer = this.storageBuffers[name];
        if (!buffer) return;
        this.device.queue.writeBuffer(buffer, 0, data);
    }

    async readStorage(name) {
        const buffer = this.storageBuffers[name];
        if (!buffer) return null;

        const readBuffer = this.device.createBuffer({
            size: buffer.size,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

        const commandEncoder = this.device.createCommandEncoder();
        commandEncoder.copyBufferToBuffer(buffer, 0, readBuffer, 0, buffer.size);
        this.device.queue.submit([commandEncoder.finish()]);

        await readBuffer.mapAsync(GPUMapMode.READ);
        const data = new Float32Array(readBuffer.getMappedRange().slice(0));
        readBuffer.unmap();
        readBuffer.destroy();

        return data;
    }

    dispatch(commandEncoder) {
        const pass = commandEncoder.beginComputePass();
        pass.setPipeline(this.pipeline);
        pass.setBindGroup(0, this.bindGroup);
        pass.dispatchWorkgroups(this.dispatchX, this.dispatchY, this.dispatchZ);
        pass.end();
    }

    run() {
        const commandEncoder = this.device.createCommandEncoder();
        this.dispatch(commandEncoder);
        this.device.queue.submit([commandEncoder.finish()]);
    }

    remove() {
        for (let name in this.storageBuffers) {
            this.storageBuffers[name].destroy();
        }
        for (let name in this.uniformBuffers) {
            this.uniformBuffers[name].buffer.destroy();
        }
    }
}
