const vertex = `#version 300 es
precision highp float;
precision highp int;

in vec2 uv;
in vec3 position;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

out vec2 vUv;

void main() {
    vUv = uv;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragment = `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D tMap;

in vec2 vUv;

out vec4 color;

void main() {

    vec3 tex = texture(tMap, vUv).rgb;
    float signedDist = max(min(tex.r, tex.g), min(max(tex.r, tex.g), tex.b)) - 0.5;
    float d = fwidth(signedDist);
    float alpha = smoothstep(-d, d, signedDist);

    if (alpha < 0.01) discard;

    color.rgb = vec3(0.0);
    color.a = alpha;
}
`;

export default {vertex, fragment};