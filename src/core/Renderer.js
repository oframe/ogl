import {Mat4} from '../math/Mat4.js';
import {Vec3} from '../math/Vec3.js';

// TODO: culling
// TODO: cnv.addEventListener('webglcontextlost', contextLost, false);
// TODO: cnv.addEventListener('webglcontextrestored', contextRestore, false);

// Not automatic - devs to use these methods manually
// gl.colorMask( colorMask, colorMask, colorMask, colorMask );
// gl.clearColor( r, g, b, a );
// gl.stencilMask( stencilMask );
// gl.stencilFunc( stencilFunc, stencilRef, stencilMask );
// gl.stencilOp( stencilFail, stencilZFail, stencilZPass );
// gl.clearStencil( stencil );

const projMat4 = new Mat4();
const tempVec3 = new Vec3();

export class Renderer {
    constructor({
        canvas = document.createElement('canvas'),
        width = 300,
        height = 150,
        dpr = 1,
        alpha = false,
        depth = true,
        stencil = false,
        antialias = false,
        premultipliedAlpha = false,
        preserveDrawingBuffer = false,
        powerPreference = 'default',
        autoClear = true,
        sort = true,
    } = {}) {
        const attributes = {alpha, depth, stencil, antialias, premultipliedAlpha, preserveDrawingBuffer, powerPreference};
        this.dpr = dpr;
        this.alpha = alpha;
        this.color = true;
        this.depth = depth;
        this.stencil = stencil;
        this.premultipliedAlpha = premultipliedAlpha;
        this.autoClear = autoClear;
        this.sort = sort;

        // Attempt WebGL2, otherwise fallback to WebGL1
        this.gl = canvas.getContext('webgl2', attributes);
        this.isWebgl2 = !!this.gl;
        if (!this.gl) {
            this.gl = canvas.getContext('webgl', attributes) || canvas.getContext('experimental-webgl', attributes);
        }

        // Attach renderer to gl so that all classes have access to internal state functions
        this.gl.renderer = this;

        // initialise size values
        this.setSize(width, height);

        // gl state stores to avoid redundant calls on methods used internally
        this.state = {};
        this.state.blendFunc = {src: this.gl.ONE, dst: this.gl.ZERO};
        this.state.blendEquation = {modeRGB: this.gl.FUNC_ADD};
        this.state.cullFace = null;
        this.state.frontFace = this.gl.CCW;
        this.state.depthMask = true;
        this.state.depthFunc = this.gl.LESS;
        this.state.framebuffer = null;
        this.state.viewport = {width: null, height: null};

        // store requested extensions
        this.extensions = {};

        if (!this.isWebgl2) {

            // Initialise extra format types
            this.getExtension('OES_texture_float');
            this.getExtension('OES_texture_float_linear');
            this.getExtension('OES_texture_half_float');
            this.getExtension('OES_element_index_uint');
            this.getExtension('OES_standard_derivatives');
            this.getExtension('EXT_sRGB');
            this.getExtension('WEBGL_depth_texture');
        }

        // Create method aliases using extension or native if available
        this.vertexAttribDivisor = this.gl.renderer.getExtension('ANGLE_instanced_arrays', 'vertexAttribDivisor', 'vertexAttribDivisorANGLE');
        this.drawArraysInstanced = this.gl.renderer.getExtension('ANGLE_instanced_arrays', 'drawArraysInstanced', 'drawArraysInstancedANGLE');
        this.drawElementsInstanced = this.gl.renderer.getExtension('ANGLE_instanced_arrays', 'drawElementsInstanced', 'drawElementsInstancedANGLE');
        this.createVertexArray = this.gl.renderer.getExtension('OES_vertex_array_object', 'createVertexArray', 'createVertexArrayOES');
        this.bindVertexArray = this.gl.renderer.getExtension('OES_vertex_array_object', 'bindVertexArray', 'bindVertexArrayOES');
        this.deleteVertexArray = this.gl.renderer.getExtension('OES_vertex_array_object', 'deleteVertexArray', 'deleteVertexArrayOES');
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;

        this.gl.canvas.width = width * this.dpr;
        this.gl.canvas.height = height * this.dpr;

        Object.assign(this.gl.canvas.style, {
            width: width + 'px',
            height: height + 'px',
        });
    }

    setViewport(width, height) {
        if (this.state.viewport.width === width && this.state.viewport.height === height) return;
        this.state.viewport.width = width;
        this.state.viewport.height = height;
        this.gl.viewport(0, 0, width, height);
    }

    enable(id) {
        if (this.state[id] === true) return;
        this.gl.enable(id);
        this.state[id] = true;
    }

    disable(id) {
        if (this.state[id] === false) return;
        this.gl.disable(id);
        this.state[id] = false;
    }

    setBlendFunc(src, dst, srcAlpha, dstAlpha) {
        if (this.state.blendFunc.src === src &&
            this.state.blendFunc.dst === dst &&
            this.state.blendFunc.srcAlpha === srcAlpha &&
            this.state.blendFunc.dstAlpha === dstAlpha) return;
        this.state.blendFunc.src = src;
        this.state.blendFunc.dst = dst;
        this.state.blendFunc.srcAlpha = srcAlpha;
        this.state.blendFunc.dstAlpha = dstAlpha;
        if (srcAlpha !== undefined) this.gl.blendFuncSeparate(src, dst, srcAlpha, dstAlpha);
        else this.gl.blendFunc(src, dst);
    }

    setBlendEquation(modeRGB, modeAlpha) {
        if (this.state.blendEquation.modeRGB === modeRGB &&
            this.state.blendEquation.modeAlpha === modeAlpha) return;
        this.state.blendEquation.modeRGB = modeRGB;
        this.state.blendEquation.modeAlpha = modeAlpha;
        if (modeAlpha !== undefined) this.gl.blendEquationSeparate(modeRGB, modeAlpha);
        else this.gl.blendEquation(modeRGB);
    }

    setCullFace(value) {
        if (this.state.cullFace === value) return;
        this.state.cullFace = value;
        this.gl.cullFace(value);
    }

    setFrontFace(value) {
        if (this.state.frontFace === value) return;
        this.state.frontFace = value;
        this.gl.frontFace(value);
    }

    setDepthMask(value) {
        if (this.state.depthMask === value) return;
        this.state.depthMask = value;
        this.gl.depthMask(value);
    }

    setDepthFunc(value) {
        if (this.state.depthFunc === value) return;
        this.state.depthFunc = value;
        this.gl.depthFunc(value);
    }

    bindFramebuffer({target = this.gl.FRAMEBUFFER, buffer = null} = {}) {
        if (this.state.framebuffer === buffer) return;
        this.state.framebuffer = buffer;
        this.gl.bindFramebuffer(target, buffer);
    }

    getExtension(extension, webgl2Func, extFunc) {

        // if webgl2 function supported, return func bound to gl context
        if (webgl2Func && this.gl[webgl2Func]) return this.gl[webgl2Func].bind(this.gl);

        // fetch extension once only
        if (!this.extensions[extension]) {
            this.extensions[extension] = this.gl.getExtension(extension);
        }

        // return extension if no function requested
        if (!webgl2Func) return this.extensions[extension];

        // return extension function, bound to extension
        return this.extensions[extension][extFunc].bind(this.extensions[extension]);
    }

    drawOpaque(scene, camera) {
        const opaque = [];
        scene.traverse(node => {
            if (!node.program || node.program.transparent) return;
            opaque.splice(getRenderOrder(node), 0, node);
        });

        function getRenderOrder(node) {
            node.worldMatrix.getTranslation(tempVec3);
            tempVec3.applyMatrix4(projMat4);

            node.zDepth = tempVec3.z;
            for (let i = 0; i < opaque.length; i++) {
                if (node.zDepth <= opaque[i].zDepth) return i;
            }
            return opaque.length;
        }

        for (let i = 0; i < opaque.length; i++) {
            opaque[i].draw({camera});
        }
    }

    drawTransparent(scene, camera) {
        const transparent = [];
        const custom = [];
        scene.traverse(node => {
            if (!node.program || !node.program.transparent) return;

            // If manual order set, add to queue last
            if (node.renderOrder !== undefined) return custom.push(node);
            transparent.splice(getRenderOrder(node), 0, node);
        });

        function getRenderOrder(node) {
            node.worldMatrix.getTranslation(tempVec3);
            tempVec3.applyMatrix4(projMat4);

            node.zDepth = tempVec3.z;
            for (let i = 0; i < transparent.length; i++) {
                if (node.zDepth >= transparent[i].zDepth) return i;
            }
            return transparent.length;
        }

        // Add manually ordered nodes
        for (let i = 0; i < custom.length; i++) {
            transparent.splice(custom[i].renderOrder, 0, custom[i]);
        }

        for (let i = 0; i < transparent.length; i++) {
            transparent[i].draw({camera});
        }
    }

    render({
        scene,
        camera,
        target = null,
        update = true,
    }) {

        if (target === null) {

            // make sure no render target bound so draws to canvas
            this.bindFramebuffer();
            this.setViewport(this.width * this.dpr, this.height * this.dpr);
        } else {

            // bind supplied render target and update viewport
            this.bindFramebuffer(target);
            this.setViewport(target.width, target.height);
        }

        if (this.autoClear) {

            // Ensure depth buffer writing is enabled so it can be cleared
            if (this.depth) {
                this.enable(this.gl.DEPTH_TEST);
                this.setDepthMask(true);
            }
            this.gl.clear((this.color ? this.gl.COLOR_BUFFER_BIT : 0) | (this.depth ? this.gl.DEPTH_BUFFER_BIT : 0) | (this.stencil ? this.gl.STENCIL_BUFFER_BIT : 0));
        }

        // updates all scene graph matrices
        if (update) scene.updateMatrixWorld();

        // Update camera separately if not in scene graph
        if (camera && camera.parent === null) camera.updateMatrixWorld();

        // can only sort if camera available
        if (this.sort && camera) {
            projMat4.multiply(camera.projectionMatrix, camera.viewMatrix);
            this.drawOpaque(scene, camera);
            this.drawTransparent(scene, camera);
        } else {
            scene.traverse(node => {
                if (!node.draw) return;
                node.draw({camera});
            });
        }

        // SORTING using a proj matrix to get distance from cam
        // _projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
        // _frustum.setFromMatrix( _projScreenMatrix );
        // culling
    }
}