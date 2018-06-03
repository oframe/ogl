<p align="center">
  <img src="https://github.com/oframe/ogl/raw/master/examples/assets/ogl.png" alt="O-GL" width="510" height="300" />
</p>

<h1 align="center">O-GL</h1>

<p align="center">
    <a href="https://npmjs.org/package/ogl">
        <img src="https://img.shields.io/npm/v/ogl.svg" alt="version" />
    </a>
    <a href="https://github.com/oframe/ogl/blob/master/LICENSE">
        <img src="https://img.shields.io/npm/l/ogl.svg" alt="license" />
    </a>

</p>

<p align="center"><b>Minimal WebGL framework.</b></p>

<br />

⚠️ *Note: currently in alpha, so expect breaking changes.*

[Examples](https://oframe.github.io/ogl/examples)

O-GL is a small, effective WebGL framework aimed at developers who like minimal layers of abstraction, and are comfortable creating their own shaders.

With 0 dependencies, the API shares many similarities with ThreeJS, however it is tightly coupled with WebGL and comes with much fewer features.

In its design, the framework does the minimum abstraction necessary, so devs should still feel comfortable using it in conjunction with native WebGL commands.

Keeping the level of abstraction low helps to make the framework easier to understand and extend, and also makes it more practical as a WebGL learning resource.

## Install

```
npm install ogl
```

**or**

Use directly in your project with es6 modules and load directly in the browser - **no dev-stack required**.

## Examples

[Show me what you got!](https://oframe.github.io/ogl/examples) - Explore a comprehensive list of examples, with comments in the source code.

## Weight

Even though the source is completely modular, as a guide, below are the complete component download sizes.

Component | Size (gzipped)
------------ | -------------:
Core | 6kb
Math | 7kb
Extras | 2kb
Total | 15kb

## Usage

Importing is done from a single point of access for simplicity. *This may cause some issues with certain bundlers when tree-shaking.*

```js

import {Renderer, Camera, Transform, Cube, Program, Mesh} from './OGL.js';
```

Below renders a spinning black cube.

```js

{
    const renderer = new Renderer({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const gl = renderer.gl;
    document.body.appendChild(gl.canvas);

    const camera = new Camera(gl, {
        fov: 35,
        aspect: gl.canvas.width / gl.canvas.height,
    });
    camera.position.z = 5;

    const scene = new Transform(gl);

    const geometry = new Cube(gl);

    const program = new Program(gl, {
        vertexShader: `
            attribute vec3 position;

            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;

            void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
            `,
        fragmentShader: `
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

## Structure

In an attempt to leep things light and modular, the framework is split up into three components: **Math**, **Core**, and **Extras**.

The **Math** component is based on a fork of gl-matrix - featuring a practical API. 7kb when gzipped, it has no dependencies and can be used separately.

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
 - [x] Cube.js
 - [x] Sphere.js
 - [ ] OrbitControls
 - [ ] Curve.js
 - [ ] Raycasting.js
 - [ ] Projection.js
 - [ ] Post.js
 - [ ] Rig.js
 - [ ] RigAnimation.js

## Examples wishlist

[Examples](https://oframe.github.io/ogl/examples)

In order to test the completeness of the framework, below is a wish-list that covers most commonly-used 3D techniques.

It is an opinionated, comprehensive list of examples for any fully-fledged WebGL framework.

Much inspired by ThreeJS' examples, they will serve as reference for how to achieve a wide range of techniques.

In order to make the framework as usable as possible, for more involved techniques, extra classes will be developed
and contained within the 'Extras' folder of the framework.

### Geometry
 - [x] Triangle Screen Shader
 - [x] Draw Modes
 - [x] Indexed vs Non-Indexed
 - [x] Load JSON (Javascript Object Notation)
 - [x] Wireframe
 - [x] Base Primitives - Plane, Cube, Sphere
 - [x] Particles
 - [x] Instancing
 - [ ] Billboard Depth Test (instances and points)
 - [ ] Frustum culling
 - [ ] LODs (Level Of Detail)
 - [ ] Thick Lines
 - [ ] Load GLTF (Graphics Language Transmission Format)

### Scene
 - [ ] Scene Graph hierarchy
 - [ ] Render Hierarchy With Transparency

### Interaction
 - [ ] Orbit controls
 - [ ] Raycasting
 - [ ] Projection (Mouse, clip space)

### Shading
 - [x] Fog
 - [ ] Textures
 - [ ] Skydome
 - [ ] Normal Maps
 - [ ] SDF Alpha test/clip (Signed Distance Fields)
 - [ ] MSDF Text Glyphs (Multichannel Signed Distance Fields)
 - [ ] Point lighting with specular highlights
 - [ ] PBR (Physically Based Rendering)

### Frame Buffer
 - [ ] Render to texture
 - [ ] MRT (Multiple Render Targets)
 - [ ] Reflections
 - [ ] Shadow maps
 - [ ] Distortion (refraction)
 - [ ] Effects - DOF (Depth Of Field) + light rays + tone mapping

### Animation
 - [ ] Skinning
 - [ ] Blendshapes

### Stencil
 - [ ] Stencil Shadows and Mirror