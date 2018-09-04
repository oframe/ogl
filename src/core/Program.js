// TODO: upload empty texture if null
// TODO: upload identity matrix if null
// TODO: texture units/locations
// TODO: sampler Cube

let ID = 0;

// cache of typed arrays used to flatten uniform arrays
const arrayCacheF32 = {};

export class Program {
    constructor(gl, {
        vertexShader,
        fragmentShader,
        uniforms = {},

        transparent = false,
        cullFace = gl.BACK,
        frontFace = gl.CCW,
        depthTest = true,
        depthWrite = true,
        depthFunc = gl.LESS,
    } = {}) {
        this.gl = gl;
        this.uniforms = uniforms;
        this.id = ID++;

        if (!vertexShader) console.warn('vertex shader not supplied');
        if (!fragmentShader) console.warn('fragment shader not supplied');

        // Store program state
        this.transparent = transparent;
        this.cullFace = cullFace;
        this.frontFace = frontFace;
        this.depthTest = depthTest;
        this.depthWrite = depthWrite;
        this.depthFunc = depthFunc;
        this.blendFunc = {};
        this.blendEquation = {};

        // set default blendFunc if transparent flagged
        if (this.transparent && !this.blendFunc.src) {
            if (this.gl.renderer.premultipliedAlpha) this.setBlendFunc(this.gl.ONE, this.gl.ONE_MINUS_SRC_ALPHA);
            else this.setBlendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        }

        // compile vertex shader and log errors
        this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(this.vertexShader, vertexShader);
        gl.compileShader(this.vertexShader);
        if (gl.getShaderInfoLog(this.vertexShader) !== '') {
            console.warn(`${gl.getShaderInfoLog(this.vertexShader)}\nVertex Shader\n${addLineNumbers(vertexShader)}`);
        }

        // compile fragment shader and log errors
        this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(this.fragmentShader, fragmentShader);
        gl.compileShader(this.fragmentShader);
        if (gl.getShaderInfoLog(this.fragmentShader) !== '') {
            console.warn(`${gl.getShaderInfoLog(this.fragmentShader)}\nFragment Shader\n${addLineNumbers(fragmentShader)}`);
        }

        // compile program and log errors
        this.program = gl.createProgram();
        gl.attachShader(this.program, this.vertexShader);
        gl.attachShader(this.program, this.fragmentShader);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            return console.warn(gl.getProgramInfoLog(this.program));
        }

        // Get active uniform locations
        this.uniformLocations = new Map();
        let numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (let uIndex = 0; uIndex < numUniforms; uIndex++) {
            let uniform = gl.getActiveUniform(this.program, uIndex);
            this.uniformLocations.set(uniform, gl.getUniformLocation(this.program, uniform.name));

            // trim uniforms' names to omit array declarations
            uniform.uniformName = uniform.name.split('[')[0];
        }

        // Get active attribute locations
        this.attributeLocations = new Map();
        let numAttribs = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
        for (let aIndex = 0; aIndex < numAttribs; aIndex++) {
            let attribute = gl.getActiveAttrib(this.program, aIndex);
            this.attributeLocations.set(attribute.name, gl.getAttribLocation(this.program, attribute.name));
        }
    }

    setBlendFunc(src, dst, srcAlpha, dstAlpha) {
        this.blendFunc.src = src;
        this.blendFunc.dst = dst;
        this.blendFunc.srcAlpha = srcAlpha;
        this.blendFunc.dstAlpha = dstAlpha;
        if (src) this.transparent = true;
    }

    setBlendEquation(modeRGB, modeAlpha) {
        this.blendEquation.modeRGB = modeRGB;
        this.blendEquation.modeAlpha = modeAlpha;
    }

    applyState() {
        if (this.depthTest) this.gl.renderer.enable(this.gl.DEPTH_TEST);
        else this.gl.renderer.disable(this.gl.DEPTH_TEST);

        if (this.cullFace) this.gl.renderer.enable(this.gl.CULL_FACE);
        else this.gl.renderer.disable(this.gl.CULL_FACE);

        if (this.blendFunc.src) this.gl.renderer.enable(this.gl.BLEND);
        else this.gl.renderer.disable(this.gl.BLEND);

        if (this.cullFace) this.gl.renderer.setCullFace(this.cullFace);
        this.gl.renderer.setFrontFace(this.frontFace);
        this.gl.renderer.setDepthMask(this.depthWrite);
        this.gl.renderer.setDepthFunc(this.depthFunc);
        if (this.blendFunc.src) this.gl.renderer.setBlendFunc(this.blendFunc.src, this.blendFunc.dst, this.blendFunc.srcAlpha, this.blendFunc.dstAlpha);
        if (this.blendEquation.modeRGB) this.gl.renderer.setBlendEquation(this.blendEquation.modeRGB, this.blendEquation.modeAlpha);
    }

    use({
        programActive = false,
        flipFaces = false,
    } = {}) {
        let textureUnit = -1;

        // Avoid gl call if program already in use
        if (!programActive) {
            this.gl.useProgram(this.program);
            this.gl.renderer.currentProgram = this.id;
        }

        // Set only the active uniforms found in the shader
        this.uniformLocations.forEach((location, activeUniform) => {
            const name = activeUniform.uniformName;
            
            
            // get supplied uniform
            const uniform = this.uniforms[name];
            if (!uniform) {
                return console.warn(`Active uniform ${name} has not been supplied`);
            }
            if (uniform && uniform.value === undefined) {
                return console.warn(`${name} uniform is missing a value parameter`);
            }

            if (uniform.value.texture) {
                textureUnit++;
                this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);

                // bind texture and update any unset props
                uniform.value.update();

                // set uniform using texture unit instead of value
                return setUniform(this.gl, activeUniform.type, location, textureUnit);
            }

            if (uniform.value.length && uniform.value[0].texture) {
                const textureUnits = [];
                uniform.value.forEach(value => {
                    textureUnits.push(++textureUnit);
                    this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
                    value.update();
                });
                
                // For texture arrays, pass an array of texture units
                return setUniform(this.gl, activeUniform.type, location, textureUnits);
            }

            setUniform(this.gl, activeUniform.type, location, uniform.value);
        });

        this.applyState();
        if (flipFaces) this.gl.renderer.setFrontFace(this.frontFace === this.gl.CCW ? this.gl.CW : this.gl.CCW);
    }

    remove() {
        this.gl.deleteProgram(this.program);
        this.gl.deleteShader(this.vertexShader);
        this.gl.deleteShader(this.fragmentShader);
    }
}

function setUniform(gl, type, location, value) {
    switch (type) {
        case 5126  : return value.length ? gl.uniform1fv(location, value) : gl.uniform1f(location, value); // FLOAT
        case 35664 : return gl.uniform2fv(location, value[0].length ? flatten(value) : value); // FLOAT_VEC2
        case 35665 : return gl.uniform3fv(location, value[0].length ? flatten(value) : value); // FLOAT_VEC3
        case 35666 : return gl.uniform4fv(location, value[0].length ? flatten(value) : value); // FLOAT_VEC4
        case 35670 : // BOOL
        case 5124  : // INT
        case 35678 : // SAMPLER_2D
        case 35680 : return value.length ? gl.uniform1iv(location, value) : gl.uniform1i(location, value); // SAMPLER_CUBE
        case 35671 : // BOOL_VEC2
        case 35667 : return gl.uniform2iv(location, value); // INT_VEC2
        case 35672 : // BOOL_VEC3
        case 35668 : return gl.uniform3iv(location, value); // INT_VEC3
        case 35673 : // BOOL_VEC4
        case 35669 : return gl.uniform4iv(location, value); // INT_VEC4
        case 35674 : return gl.uniformMatrix2fv(location, false, value[0].length ? flatten(value) : value); // FLOAT_MAT2
        case 35675 : return gl.uniformMatrix3fv(location, false, value[0].length ? flatten(value) : value); // FLOAT_MAT3
        case 35676 : return gl.uniformMatrix4fv(location, false, value[0].length ? flatten(value) : value); // FLOAT_MAT4
    }
}

function addLineNumbers(string) {
    let lines = string.split('\n');
    for (let i = 0; i < lines.length; i ++) {
        lines[i] = (i + 1) + ': ' + lines[i];
    }
    return lines.join('\n');
}

function flatten(array) {
    const arrayLen = array.length;
    const valueLen = array[0].length;
    const length = arrayLen * valueLen;
    let value = arrayCacheF32[length];
    if (!value) arrayCacheF32[length] = value = new Float32Array(length);
    for (let i = 0; i < arrayLen; i++) value.set(array[i], i * valueLen);
    return value;
}