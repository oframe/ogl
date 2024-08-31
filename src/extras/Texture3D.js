import { Texture } from "../core/Texture.js";

export class Texture3D extends Texture {
    constructor(gl, args) {

        super(gl, {
            ...args,
            target: gl.TEXTURE_3D,
            width: args.width ? args.width : 2,
            height: args.height ? args.height : 2,
        });

        const image = new Image();
        image.crossOrigin = "*";
        image.src = args.src;

        image.onload = () => {

            let canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;

            let ctx = canvas.getContext('2d');
            ctx.scale(1, -1);
            ctx.translate(0, -image.height);
            ctx.drawImage(image, 0, 0);
            const imageData = ctx.getImageData(0, 0, image.width, image.height).data;

            canvas = null;
            ctx = null;
            let elementCount;

            switch (this.format) {
                case gl.RED: elementCount = 1
                    break
                case gl.RG: elementCount = 2
                    break
                case gl.RGB: elementCount = 3
                    break
                default: elementCount = 4
                    break
            }

            const dataCount = this.width * this.height * this.length * elementCount;
            const data = this.type === gl.UNSIGNED_BYTE ? new Uint8Array(dataCount) : new Float32Array(dataCount);

            let dataIterator = 0;

            for (let z = 0; z < this.length; z++) {
                for (let y = 0; y < this.height; y++) {
                    for (let x = 0; x < this.width; x++) {

                        let zOffsetX = (z % args.tileCountX) * this.width;
                        let zOffsetY = Math.floor(z / args.tileCountX) * (this.width * this.height * args.tileCountX);
                        let index = (x + zOffsetX) + ((y * image.width) + zOffsetY);

                        const r = imageData[index * 4];
                        const g = imageData[index * 4 + 1];
                        const b = imageData[index * 4 + 2];
                        const a = imageData[index * 4 + 3];

                        let texel = [r, g, b, a];

                        for (let i = 0; i < elementCount; i++) {
                            if (this.type === this.gl.UNSIGNED_BYTE) {
                                data[dataIterator++] = texel[i];
                            } else {
                                data[dataIterator++] = texel[i] / 255;
                            }

                        }

                    }
                }
            }

            this.image = data;
            this.needsUpdate = true;

        }
    }
}