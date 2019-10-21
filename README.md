<p align="center">
  <img src="https://github.com/oframe/ogl/raw/master/examples/assets/ogl.png" alt="OGL" width="510" />
</p>

<h1 align="center">OGL</h1>

<p align="center">
    <a href="https://npmjs.org/package/ogl">
        <img src="https://img.shields.io/npm/v/ogl.svg" alt="version" />
    </a>
    <a href="https://github.com/oframe/ogl/blob/master/LICENSE">
        <img src="https://img.shields.io/npm/l/ogl.svg" alt="license" />
    </a>
    <a href="https://david-dm.org/oframe/ogl">
        <img src="https://img.shields.io/david/oframe/ogl.svg" alt="dependencies" />
    </a>
    <a href="https://bundlephobia.com/result?p=ogl">
        <img src="https://badgen.net/bundlephobia/minzip/ogl" alt="size" />
    </a>
</p>

<p align="center"><b>Minimal WebGL framework.</b></p>

<br />

⚠️ *Note: currently in alpha, so expect breaking changes.*

[See Examples](https://oframe.github.io/ogl/examples)

OGL is a small, effective WebGL framework aimed at developers who like minimal layers of abstraction, and are comfortable creating their own shaders.

With zero dependencies, the API shares many similarities with ThreeJS, however it is tightly coupled with WebGL and comes with much fewer features.

In its design, the framework does the minimum abstraction necessary, so devs should still feel comfortable using it in conjunction with native WebGL commands.

Keeping the level of abstraction low helps to make the framework easier to understand and extend, and also makes it more practical as a WebGL learning resource.

## Install

[Download](https://github.com/oframe/ogl/archive/master.zip) and [load directly in the browser](https://developers.google.com/web/fundamentals/primers/modules) using es6 modules - **no dev-stack required**.

**or**

```
npm i ogl
```

## Examples

[Show me what you got!](https://oframe.github.io/ogl/examples) - Explore a comprehensive list of examples, with comments in the source code.

## Weight

Even though the source is modular, as a guide, below are the complete component download sizes.

Component | Size (gzipped)
------------ | -------------:
Core | 6kb
Math | 7kb
Extras | 8kb
Total | 21kb

With tree-shaking applied in a build step, one can expect the final size to be much lighter than the values above.

## Usage

Importing can be done from one single entry point.

```js
import {Renderer, Camera, Program, Mesh, Box} from './src/index.js';
```

However, in the examples, two entry points are used for clarity. These are `Core.js` and `Extras.js` - which relate to the component structure outlined below.

```js
import {Renderer, Camera, Program, Mesh} from './src/Core.js';
import {Box} from './src/Extras.js';
```

For CodeSandboxes or CodePens, jsdelivr can be used to provide CDN access to the npm deployment.

```js
import {Renderer, Camera, Program, Mesh, Box} from 'https://cdn.jsdelivr.net/npm/ogl/dist/ogl.mjs';

```

Below renders a spinning white cube.

```js
{
    const renderer = new Renderer();
    const gl = renderer.gl;
    document.body.appendChild(gl.canvas);

    const camera = new Camera(gl);
    camera.position.z = 5;

    function resize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.perspective({
            aspect: gl.canvas.width / gl.canvas.height,
        });
    }
    window.addEventListener('resize', resize, false);
    resize();

    const scene = new Transform();

    const geometry = new Box(gl);

    const program = new Program(gl, {
        vertex: `
            attribute vec3 position;

            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;

            void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
            `,
        fragment: `
            void main() {
                gl_FragColor = vec4(1.0);
            }
        `,
    });

    const mesh = new Mesh(gl, {geometry, program});
    mesh.setParent(scene);

    requestAnimationFrame(update);
    function update(t) {
        requestAnimationFrame(update);

        mesh.rotation.y -= 0.04;
        mesh.rotation.x += 0.03;
        renderer.render({scene, camera});
    }
}
```

For a simpler use, such as a full-screen shader, more of the core can be omitted as a scene graph and projection matrices are not necessary. 

```js
import {Renderer, Geometry, Program, Mesh} from './src/index.js';

{
    const renderer = new Renderer({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const gl = renderer.gl;
    document.body.appendChild(gl.canvas);

    // Triangle that covers viewport, with UVs that still span 0 > 1 across viewport
    const geometry = new Geometry(gl, {
        position: {size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3])},
        uv: {size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2])},
    });

    const program = new Program(gl, {
        vertex: `
            attribute vec2 uv;
            attribute vec2 position;

            varying vec2 vUv;

            void main() {
                vUv = uv;
                gl_Position = vec4(position, 0, 1);
            }
        `,
        fragment: `
            precision highp float;

            uniform float uTime;

            varying vec2 vUv;

            void main() {
                gl_FragColor.rgb = vec3(0.8, 0.7, 1.0) + 0.3 * cos(vUv.xyx + uTime);
                gl_FragColor.a = 1.0;
            }
        `,
        uniforms: {
            uTime: {value: 0},
        },
    });

    const mesh = new Mesh(gl, {geometry, program});

    requestAnimationFrame(update);
    function update(t) {
        requestAnimationFrame(update);

        program.uniforms.uTime.value = t * 0.001;

        // Don't need a camera if camera uniforms aren't required
        renderer.render({scene: mesh});
    }
}
```

## Structure

In an attempt to keep things light and modular, the framework is split up into three components: **Math**, **Core**, and **Extras**.

The **Math** component is an extension of [gl-matrix](http://glmatrix.net/), providing instancable classes that extend Array for each of the module types. 7kb when gzipped, it has no dependencies and can be used separately.

The **Core** is made up of the following:
 - Geometry.js
 - Program.js
 - Renderer.js
 - Camera.js
 - Transform.js
 - Mesh.js
 - Texture.js
 - RenderTarget.js

Any additional layers of abstraction will be included as **Extras**, and not part of the core as to reduce bloat.

Below is an **Extras** wish-list, and is still a work-in-progress as examples are developed.
 - [x] Plane.js
 - [x] Box.js
 - [x] Sphere.js
 - [x] Cylinder.js
 - [x] Orbit.js
 - [x] Raycast.js
 - [ ] Curve.js
 - [x] Post.js
 - [x] Skin.js
 - [x] Animation.js
 - [x] Text.js
 - [x] NormalProgram.js
 - [x] Flowmap.js
 - [x] GPGPU.js
 - [x] Polyline.js
 - [x] Shadow.js

## Examples wishlist

[Examples](https://oframe.github.io/ogl/examples)

In order to test the completeness of the framework, below is a wish-list that covers most commonly-used 3D techniques.

It is an opinionated, comprehensive list of examples for any fully-fledged WebGL framework.

Inspired by the effectiveness of ThreeJS' examples, they will serve as reference for how to achieve a wide range of techniques.

For more advanced techniques, extra classes will be developed and contained within the 'Extras' folder of the framework.

### Geometry
 - [x] Triangle Screen Shader
 - [x] Draw Modes
 - [x] Indexed vs Non-Indexed
 - [x] Load JSON (Javascript Object Notation)
 - [x] Wireframe
 - [x] Base Primitives - Plane, Cube, Sphere
 - [x] Particles
 - [x] Instancing
 - [ ] Particle Depth Sort
 - [ ] LODs (Level Of Detail)
 - [x] Polylines
 - [ ] Load GLTF (Graphics Language Transmission Format)

### Scene
 - [x] Scene Graph hierarchy
 - [x] Sort Transparency
 - [x] Frustum culling

### Interaction
 - [x] Orbit controls
 - [x] Projection and Raycasting
 - [x] Mouse Flowmap

### Shading
 - [x] Fog
 - [x] Textures
 - [x] Skydome
 - [x] Normal Maps
 - [x] Flat Shading Matcap
 - [x] Wireframe Shader
 - [ ] SDF Alpha test/clip (Signed Distance Fields)
 - [x] MSDF Text Glyphs (Multichannel Signed Distance Fields)
 - [ ] Point lighting with specular highlights
 - [x] PBR (Physically Based Rendering)
 - [ ] Compressed Textures

### Frame Buffer
 - [x] Render to texture
 - [x] Post FXAA (Fast Approximate Anti-Aliasing)
 - [x] MRT (Multiple Render Targets)
 - [ ] Reflections
 - [x] Shadow maps
 - [ ] Distortion (refraction)
 - [x] Post Fluid Distortion
 - [ ] Effects - DOF (Depth Of Field) + light rays + tone mapping
 - [x] GPGPU Particles (General-Purpose computing on Graphics Processing Units)

### Animation
 - [x] Skinning
 - [ ] Blendshapes
 - [ ] Load Hierarchy Animation

### Stencil
 - [ ] Stencil Shadows and Mirror

 ### Performance
 - [x] High mesh count