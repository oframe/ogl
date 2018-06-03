const vertex = `
precision highp float;
precision highp int;

attribute vec2 uv;
attribute vec3 position;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec2 vUv;

void main() {
    vUv = uv;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragment = `
precision highp float;
precision highp int;

uniform float uTime;

varying vec2 vUv;

void main() {
    gl_FragColor.rgb = 0.5 + 0.3 * sin(vUv.yxx + uTime) + vec3(0.2, 0.0, 0.1);
    gl_FragColor.a = 1.0;
}
`;

export default {vertex, fragment};