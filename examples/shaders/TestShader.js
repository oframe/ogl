const vertex = `
precision highp float;
precision highp int;

attribute vec2 uv;
attribute vec3 position;
attribute vec3 normal;
attribute vec3 offset;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;

varying vec2 vUv;

void main() {
    vUv = uv;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + offset, 1.0);
}
`;

const fragment = `
precision highp float;
precision highp int;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;
uniform float uTime;
uniform sampler2D tMap;

varying vec2 vUv;

void main() {
    gl_FragColor.rgb = texture2D(tMap, vUv).rgb;
    // gl_FragColor.rgb += vec3(vUv, sin(uTime) * 0.5 + 0.5) * 0.3;
    gl_FragColor.a = 1.0;
}
`;

export default {vertex, fragment};