export type TextAlign = 'left' | 'right' | 'center';

export interface TextOptions {
    font: object;
    text: string;
    width: number;
    align: TextAlign;
    size: number;
    letterSpacing: number;
    lineHeight: number;
    wordSpacing: number;
    wordBreak: boolean;
}

/**
 * A text geometry.
 * @see {@link https://github.com/oframe/ogl/blob/master/src/extras/Text.js | Source}
 */
export class Text {
    buffers: {
        position: Float32Array;
        uv: Float32Array;
        id: Float32Array;
        index: Uint32Array | Uint16Array;
    };
    numLines: number;
    height: number;
    width: number;

    constructor(options?: Partial<TextOptions>);

    resize(options: { width: number }): void;

    update(options: { text: string }): void;
}
