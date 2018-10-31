const vertex = `
attribute vec2 uv;
attribute vec3 position;

varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
`;

const fragment = `
precision highp float;

uniform sampler2D tMap;
varying vec2 vUv;

void main() {
    gl_FragColor = texture2D(tMap, vUv);
}
`;

const fragment2 = `
precision highp float;
precision highp int;

uniform float uTime;
uniform sampler2D tMap;

varying vec2 vUv;

void main() {
    gl_FragColor.rgb = mix(texture2D(tMap, vUv).rgb, vec3(vUv, 1.0), vUv.x);
    gl_FragColor.a = 1.0;
}
`;

export default {vertex, fragment, fragment2};