import PostProcessor from "./PostProcessor";
import { Program, Mesh, Vec2, Camera } from "ogl";

export default class BloomPass {
  constructor(gl, { enabled = true, iteration = 5, bloomStrength = 1, threshold = 0.8 } = {}) {
    this.gl = gl;
    this.size = {
      width: innerWidth,
      height: innerHeight,
    };
    this.resolution = {value: new Vec2(this.size.width, this.size.height)}
    this.threshold = {value : threshold}
    this.bloomStrength = { value: bloomStrength}
    this.camera = new Camera(this.gl, {
      left: -this.size.width / 2,
      right: this.size.width / 2,
      top: this.size.height / 2,
      bottom: -this.size.height / 2,
    });
    this.enabled = enabled

    this.postBloom = new PostProcessor(gl, { dpr: 0.5, targetOnly: true });
    this.bloomResolution = {value : new Vec2(this.postBloom.options.width, this.postBloom.options.height)}

    const brightPass = this.postBloom.addPass({
      fragment: brightPassFragment,
      uniforms: {
        uThreshold: this.threshold
      },
    });
    // Add gaussian blur passes
    const horizontalPass = this.postBloom.addPass({
      fragment: blurFragment,
      uniforms: {
        uResolution: this.bloomResolution,
        uDirection: { value: new Vec2(2, 0) },
      },
    });
    const verticalPass = this.postBloom.addPass({
      fragment: blurFragment,
      uniforms: {
        uResolution: this.bloomResolution,
        uDirection: { value: new Vec2(0, 2) },
      },
    });
    // Re-add the gaussian blur passes several times to the array to get smoother results
    for (let i = 0; i < iteration; i++) {
      console.log('test')
      this.postBloom.passes.push(horizontalPass, verticalPass);
    }
  }

  toggleEffect(){
    this.enabled = !this.enabled
    this.pass.enabled = this.enabled
  }

  addPassRef(addPass) {
    // let program = new Program(this.gl, {
    //   fragment: compositeFragment,
    //   vertex: defaultVertex,
    //   uniforms: {
    //     uResolution: this.resolution,
    //     tBloom: {value: null},
    //     uBloomStrength: this.bloomStrength,
    //     tMap: { value: null },
    //   },
    // });
    // let mesh = new Mesh(this.gl, { geometry, program });
    //
    // const passes = [
    //   {
    //     mesh,
    //     enabled: this.enabled,
    //     textureUniform: "tMap",
    //     beforePass: ({scene, camera, texture}) => { 
    //       this.postBloom.render({texture})
    //       mesh.program.uniforms.tBloom.value = this.postBloom.uniform.value
    //     },
    //   },
    // ];
    // return passes;

    this.pass = addPass({
      fragment: compositeFragment,
      uniforms: {
        uResolution: this.resolution,
        tBloom: {value: null},
        uBloomStrength: this.bloomStrength,
      },
      enabled: this.enabled,
      textureUniform: 'tMap',
      beforePass: ({scene, camera, texture})=> {
        this.postBloom.render({texture})
        this.pass.program.uniforms.tBloom.value = this.postBloom.uniform.value
      }
    })
    return {resizeCallback: this.resize.bind(this)}
  }

  resize({ width, height }) {
    this.size = { width, height };
    this.camera.left = -this.size.width / 2;
    this.camera.right = this.size.width / 2;
    this.camera.top = this.size.height / 2;
    this.camera.bottom = -this.size.height / 2;
    this.camera.updateMatrixWorld();

    this.resolution = {value: new Vec2(this.size.width, this.size.height)}
    this.bloomResolution.value.set(this.postBloom.options.width, this.postBloom.options.height);
  }
}

const brightPassFragment = /* glsl */ `
    precision highp float;
    uniform sampler2D tMap;
    uniform float uThreshold;

    varying vec2 vUv;

    void main() {
        vec4 tex = texture2D(tMap, vUv);
        vec4 bright = tex * step(uThreshold, length(tex.rgb) / 1.73205);
        gl_FragColor = bright;
    }
`;

const blurFragment = /* glsl */ `
    precision highp float;

    // https://github.com/Jam3/glsl-fast-gaussian-blur/blob/master/5.glsl
    vec4 blur5(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
        vec4 color = vec4(0.0);
        vec2 off1 = vec2(1.3333333333333333) * direction;
        color += texture2D(image, uv) * 0.29411764705882354;
        color += texture2D(image, uv + (off1 / resolution)) * 0.35294117647058826;
        color += texture2D(image, uv - (off1 / resolution)) * 0.35294117647058826;
        return color;
    }

    // https://github.com/Jam3/glsl-fast-gaussian-blur/blob/master/9.glsl
    vec4 blur9(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
        vec4 color = vec4(0.0);
        vec2 off1 = vec2(1.3846153846) * direction;
        vec2 off2 = vec2(3.2307692308) * direction;
        color += texture2D(image, uv) * 0.2270270270;
        color += texture2D(image, uv + (off1 / resolution)) * 0.3162162162;
        color += texture2D(image, uv - (off1 / resolution)) * 0.3162162162;
        color += texture2D(image, uv + (off2 / resolution)) * 0.0702702703;
        color += texture2D(image, uv - (off2 / resolution)) * 0.0702702703;
        return color;
    }

    uniform sampler2D tMap;
    uniform vec2 uDirection;
    uniform vec2 uResolution;

    varying vec2 vUv;

    void main() {
        // Swap with blur9 for higher quality
        // gl_FragColor = blur9(tMap, vUv, uResolution, uDirection);
        gl_FragColor = blur5(tMap, vUv, uResolution, uDirection);
    }
`;

const compositeFragment = /* glsl */ `
    precision highp float;

    uniform sampler2D tMap;
    uniform sampler2D tBloom;
    uniform vec2 uResolution;
    uniform float uBloomStrength;

    varying vec2 vUv;

    void main() {
        gl_FragColor = texture2D(tMap, vUv) + texture2D(tBloom, vUv) * uBloomStrength;
        // gl_FragColor = texture2D(tBloom, vUv) * uBloomStrength;
    }
`;

const defaultVertex = /* glsl */ `
    attribute vec2 uv;
    attribute vec2 position;

    varying vec2 vUv;

    void main() {
        vUv = uv;
        gl_Position = vec4(position, 0, 1);
    }
`;
