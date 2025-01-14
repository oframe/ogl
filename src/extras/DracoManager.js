let id = 0;

export class DracoManager {
    constructor(workerSrc) {
        this.onMessage = this.onMessage.bind(this);
        this.queue = new Map();
        this.initWorker(workerSrc);
    }

    initWorker(workerSrc) {
        this.worker = new Worker(workerSrc);
        this.worker.onmessage = this.onMessage;
    }

    onMessage({ data }) {
        const { id, error, geometry } = data;
        if (error) {
            console.log(error, id);
            return;
        }
        const geometryResolve = this.queue.get(id);
        this.queue.delete(id);
        geometryResolve(geometry);
    }

    decodeGeometry(buffer, config) {
        id++;
        this.worker.postMessage({
            id,
            buffer,
            config,
        });
        let geometryResolve;
        const promise = new Promise((res) => (geometryResolve = res));
        this.queue.set(id, geometryResolve);
        return promise;
    }
}
