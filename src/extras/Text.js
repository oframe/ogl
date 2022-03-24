export function Text({
    font,
    text,
    width = Infinity,
    align = 'left',
    size = 1,
    letterSpacing = 0,
    lineHeight = 1.4,
    wordSpacing = 0,
    wordBreak = false,
}) {
    const _this = this;
    let glyphs, buffers;
    let fontHeight, baseline, scale;

    const newline = /\n/;
    const whitespace = /\s/;

    {
        parseFont();
        createGeometry();
    }

    function parseFont() {
        glyphs = {};
        font.chars.forEach((d) => (glyphs[d.char] = d));
    }

    function createGeometry() {
        fontHeight = font.common.lineHeight;
        baseline = font.common.base;

        // Use baseline so that actual text height is as close to 'size' value as possible
        scale = size / baseline;

        // Strip spaces and newlines to get actual character length for buffers
        let chars = text.replace(/[ \n]/g, '');
        let numChars = chars.length;

        // Create output buffers
        buffers = {
            position: new Float32Array(numChars * 4 * 3),
            uv: new Float32Array(numChars * 4 * 2),
            id: new Float32Array(numChars * 4),
            index: new Uint16Array(numChars * 6),
        };

        // Set values for buffers that don't require calculation
        for (let i = 0; i < numChars; i++) {
            buffers.id.set([i, i, i, i], i * 4);
            buffers.index.set([i * 4, i * 4 + 2, i * 4 + 1, i * 4 + 1, i * 4 + 2, i * 4 + 3], i * 6);
        }

        layout();
    }

    function layout() {
        const lines = [];

        let cursor = 0;

        let wordCursor = 0;
        let wordWidth = 0;
        let line = newLine();

        function newLine() {
            const line = {
                width: 0,
                glyphs: [],
            };
            lines.push(line);
            wordCursor = cursor;
            wordWidth = 0;
            return line;
        }

        let maxTimes = 100;
        let count = 0;
        while (cursor < text.length && count < maxTimes) {
            count++;

            const char = text[cursor];

            // Skip whitespace at start of line
            if (!line.width && whitespace.test(char)) {
                cursor++;
                wordCursor = cursor;
                wordWidth = 0;
                continue;
            }

            // If newline char, skip to next line
            if (newline.test(char)) {
                cursor++;
                line = newLine();
                continue;
            }

            const glyph = glyphs[char] || glyphs[' '];

            // Find any applicable kern pairs
            if (line.glyphs.length) {
                const prevGlyph = line.glyphs[line.glyphs.length - 1][0];
                let kern = getKernPairOffset(glyph.id, prevGlyph.id) * scale;
                line.width += kern;
                wordWidth += kern;
            }

            // add char to line
            line.glyphs.push([glyph, line.width]);

            // calculate advance for next glyph
            let advance = 0;

            // If whitespace, update location of current word for line breaks
            if (whitespace.test(char)) {
                wordCursor = cursor;
                wordWidth = 0;

                // Add wordspacing
                advance += wordSpacing * size;
            } else {
                // Add letterspacing
                advance += letterSpacing * size;
            }

            advance += glyph.xadvance * scale;

            line.width += advance;
            wordWidth += advance;

            // If width defined
            if (line.width > width) {
                // If can break words, undo latest glyph if line not empty and create new line
                if (wordBreak && line.glyphs.length > 1) {
                    line.width -= advance;
                    line.glyphs.pop();
                    line = newLine();
                    continue;

                    // If not first word, undo current word and cursor and create new line
                } else if (!wordBreak && wordWidth !== line.width) {
                    let numGlyphs = cursor - wordCursor + 1;
                    line.glyphs.splice(-numGlyphs, numGlyphs);
                    cursor = wordCursor;
                    line.width -= wordWidth;
                    line = newLine();
                    continue;
                }
            }

            cursor++;
            // Reset infinite loop catch
            count = 0;
        }

        // Remove last line if empty
        if (!line.width) lines.pop();

        populateBuffers(lines);
    }

    function populateBuffers(lines) {
        const texW = font.common.scaleW;
        const texH = font.common.scaleH;

        // For all fonts tested, a little offset was needed to be right on the baseline, hence 0.07.
        let y = 0.07 * size;
        let j = 0;

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            let line = lines[lineIndex];

            for (let i = 0; i < line.glyphs.length; i++) {
                const glyph = line.glyphs[i][0];
                let x = line.glyphs[i][1];

                if (align === 'center') {
                    x -= line.width * 0.5;
                } else if (align === 'right') {
                    x -= line.width;
                }

                // If space, don't add to geometry
                if (whitespace.test(glyph.char)) continue;

                // Apply char sprite offsets
                x += glyph.xoffset * scale;
                y -= glyph.yoffset * scale;

                // each letter is a quad. axis bottom left
                let w = glyph.width * scale;
                let h = glyph.height * scale;
                buffers.position.set([x, y - h, 0, x, y, 0, x + w, y - h, 0, x + w, y, 0], j * 4 * 3);

                let u = glyph.x / texW;
                let uw = glyph.width / texW;
                let v = 1.0 - glyph.y / texH;
                let vh = glyph.height / texH;
                buffers.uv.set([u, v - vh, u, v, u + uw, v - vh, u + uw, v], j * 4 * 2);

                // Reset cursor to baseline
                y += glyph.yoffset * scale;

                j++;
            }

            y -= size * lineHeight;
        }

        _this.buffers = buffers;
        _this.numLines = lines.length;
        _this.height = _this.numLines * size * lineHeight;
        _this.width = Math.max(...lines.map((line) => line.width));
    }

    function getKernPairOffset(id1, id2) {
        for (let i = 0; i < font.kernings.length; i++) {
            let k = font.kernings[i];
            if (k.first < id1) continue;
            if (k.second < id2) continue;
            if (k.first > id1) return 0;
            if (k.first === id1 && k.second > id2) return 0;
            return k.amount;
        }
        return 0;
    }

    // Update buffers to layout with new layout
    this.resize = function (options) {
        ({ width } = options);
        layout();
    };

    // Completely change text (like creating new Text)
    this.update = function (options) {
        ({ text } = options);
        createGeometry();
    };
}
