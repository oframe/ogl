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
#extension GL_OES_standard_derivatives : enable

precision highp float;
precision highp int;

uniform sampler2D tMap;

varying vec2 vUv;

void main() {

    vec3 tex = texture2D(tMap, vUv).rgb;
    float signedDist = max(min(tex.r, tex.g), min(max(tex.r, tex.g), tex.b)) - 0.5;
    float d = fwidth(signedDist);
    float alpha = smoothstep(-d, d, signedDist);

    if (alpha < 0.01) discard;

    gl_FragColor.rgb = vec3(0.0);
    gl_FragColor.a = alpha;
}
`;

export default {vertex, fragment};