<p align="center">
  <img src="https://github.com/oframe/ogl/raw/master/examples/assets/ogl.png" alt="O-GL" width="510" />
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

[See Examples](https://oframe.github.io/ogl/examples)

O-GL is a small, effective WebGL framework aimed at developers who like minimal layers of abstraction, and are comfortable creating their own shaders.

With zero dependencies, the API shares many similarities with ThreeJS, however it is tightly coupled with WebGL and comes with much fewer features.

In its design, the framework does the minimum abstraction necessary, so devs should still feel comfortable using it in conjunction with native WebGL commands.

Keeping the level of abstraction low helps to make the framework easier to understand and extend, and also makes it more practical as a WebGL learning resource.

## Install

[Download](https://github.com/oframe/ogl/archive/master.zip) and [load directly in the browser](https://developers.google.com/web/fundamentals/primers/modules) using es6 modules - **no dev-stack required**.

**or**

```
npm install ogl
```

## Examples

[Show me what you got!](https://oframe.github.io/ogl/examples) - Explore a comprehensive list of examples, with comments in the source code.

## Weight

Even though the source is completely modular, as a guide, below are the complete component download sizes.

Component | Size (gzipped)
------------ | -------------:
Core | 6kb
Math | 7kb
Extras | 4kb
Total | 17kb

## Usage

Importing can be done from two points of access for simplicity. These are `Core.js` and `Extras.js` - which relate to the component structure detailed below. *Note: this may cause some issues with certain bundlers when tree-shaking.*

```js

import {Renderer, Camera, Transform, Program, Mesh} from './Core.js';
import {Cube} from './Extras.js';
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

    const scene = new Transform();

    const geometry = new Cube(gl);

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

## Structure

In an attempt to keep things light and modular, the framework is split up into three components: **Math**, **Core**, and **Extras**.

The **Math** component is based on [gl-matrix](http://glmatrix.net/), however also includes classes that extend Float32Array for each of the module types. This technique was shown to me by [@damienmortini](https://twitter.com/damienmortini), and it creates a very efficient, yet still highly practical way of dealing with Math. 7kb when gzipped, it has no dependencies and can be used separately.

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
 - [x] Orbit.js
 - [ ] Curve.js
 - [x] Raycast.js
 - [ ] Post.js
 - [x] Skin.js
 - [x] Animation.js
 - [x] Text.js

## Examples wishlist

[Examples](https://oframe.github.io/ogl/examples)

In order to test the completeness of the framework, below is a wish-list that covers most commonly-used 3D techniques.

It is an opinionated, comprehensive list of examples for any fully-fledged WebGL framework.

Much inspired by ThreeJS' examples, they will serve as reference for how to achieve a wide range of techniques.

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
 - [ ] Frustum culling
 - [ ] LODs (Level Of Detail)
 - [ ] Thick Lines
 - [ ] Load GLTF (Graphics Language Transmission Format)

### Scene
 - [x] Scene Graph hierarchy
 - [x] Sort Transparency
 - [ ] Load Hierarchy Animation

### Interaction
 - [x] Orbit controls
 - [x] Projection and Raycasting
 - [ ] Mouse Flowmap

### Shading
 - [x] Fog
 - [x] Textures
 - [x] Skydome
 - [x] Normal Maps
 - [ ] Flat Shading
 - [ ] Wireframe Shader
 - [ ] SDF Alpha test/clip (Signed Distance Fields)
 - [x] MSDF Text Glyphs (Multichannel Signed Distance Fields)
 - [ ] Point lighting with specular highlights
 - [x] PBR (Physically Based Rendering)
 - [ ] Compressed Textures

### Frame Buffer
 - [x] Render to texture
 - [ ] MRT (Multiple Render Targets)
 - [ ] Reflections
 - [ ] Shadow maps
 - [ ] Distortion (refraction)
 - [ ] Effects - DOF (Depth Of Field) + light rays + tone mapping

### Animation
 - [x] Skinning
 - [ ] Blendshapes

### Stencil
 - [ ] Stencil Shadows and Mirror