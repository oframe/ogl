const vertex = `
precision highp float;
precision highp int;

attribute vec3 position;
attribute vec2 uv;
attribute vec3 normal;

uniform mat3 normalMatrix;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vMPos;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mPos = modelMatrix * vec4(position, 1.0);
    vMPos = mPos.xyz / mPos.w;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragment = `
#extension GL_OES_standard_derivatives : enable

precision highp float;
precision highp int;

uniform mat4 viewMatrix;
uniform float uTime;
uniform sampler2D tDiffuse;

uniform sampler2D tNormal;
uniform float uNormalScale;
uniform float uNormalUVScale;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vMPos;

vec3 getNormal() {
    vec3 pos_dx = dFdx(vMPos.xyz);
    vec3 pos_dy = dFdy(vMPos.xyz);
    vec2 tex_dx = dFdx(vUv);
    vec2 tex_dy = dFdy(vUv);

    vec3 t = normalize(pos_dx * tex_dy.t - pos_dy * tex_dx.t);
    vec3 b = normalize(-pos_dx * tex_dy.s + pos_dy * tex_dx.s);
    mat3 tbn = mat3(t, b, normalize(vNormal));

    vec3 n = texture2D(tNormal, vUv * uNormalUVScale).rgb * 2.0 - 1.0;
    n.xy *= uNormalScale;
    vec3 normal = normalize(tbn * n);

    // Get world normal from view normal
    return normalize((vec4(normal, 0.0) * viewMatrix).xyz);
}

void main() {
    vec3 tex = texture2D(tDiffuse, vUv).rgb;

    vec3 normal = getNormal();
    
    vec3 light = normalize(vec3(sin(uTime), 1.0, cos(uTime)));
    float shading = dot(normal, light) * 0.5;
    
    gl_FragColor.rgb = tex + shading;
    gl_FragColor.a = 1.0;
}
`;

export default {vertex, fragment};