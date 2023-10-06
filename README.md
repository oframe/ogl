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
    <a href="https://bundlephobia.com/result?p=ogl">
        <img src="https://badgen.net/bundlephobia/minzip/ogl" alt="size" />
    </a>
</p>

<p align="center"><b>Minimal WebGL library.</b></p>

<br />

[See the Examples!](https://oframe.github.io/ogl/examples)

OGL is a small, effective WebGL library aimed at developers who like minimal layers of abstraction, and are interested in creating their own shaders.

Written in es6 modules with zero dependencies, the API shares many similarities with ThreeJS, however it is tightly coupled with WebGL and comes with much fewer features.

In its design, the library does the minimum abstraction necessary, so devs should still feel comfortable using it in conjunction with native WebGL commands.

Keeping the level of abstraction low helps to make the library easier to understand, extend, and also makes it more practical as a WebGL learning resource.

## Install

[Download](https://github.com/oframe/ogl/archive/master.zip)

**or**

```
npm i ogl
```

**or**

```
yarn add ogl
```

## Examples

[Show me what you got!](https://oframe.github.io/ogl/examples) - Explore a comprehensive list of examples, with comments in the source code.

Inspired by the effectiveness of ThreeJS' examples, they will hopefully serve as reference for how to use the library, and to achieve a wide range of techniques.

## Weight

Even though the source is modular, as a guide, below are the complete component download sizes.

| Component | Size (minzipped) |
| --------- | ---------------: |
| Core      |              8kb |
| Math      |              6kb |
| Extras    |             15kb |
| Total     |             29kb |

With tree-shaking applied in a build step, one can expect the final size to be much lighter than the values above.

## Usage

If installed amongst your project files, importing can be done from one single entry point.

```js
import { ... } from './path/to/src/index.js';
```

Else if using a bundler or import maps with node modules, then import directly from the installed node module.

```js
import { ... } from 'ogl';
```

By default, the ES source modules are loaded (`src/index.js`).

As another alternative, you could load from a CDN, using either the jsdelivr, unpkg or skypack services.

```js
import { ... } from 'https://cdn.jsdelivr.net/npm/ogl';
import { ... } from 'https://unpkg.com/ogl';
import { ... } from 'https://cdn.skypack.dev/ogl';
```

If you take this route, I would highly recommend defining a specific version (append `@x.x.x`) to avoid code breaking, rather than fetching the latest version, as per the above links.

As a basic API example, below renders a spinning white cube.

```js
import { Renderer, Camera, Transform, Box, Program, Mesh } from 'ogl';

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
        vertex: /* glsl */ `
            attribute vec3 position;

            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;

            void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragment: /* glsl */ `
            void main() {
                gl_FragColor = vec4(1.0);
            }
        `,
    });

    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);

    requestAnimationFrame(update);
    function update(t) {
        requestAnimationFrame(update);

        mesh.rotation.y -= 0.04;
        mesh.rotation.x += 0.03;

        renderer.render({ scene, camera });
    }
}
```

Here you can play with the above template live in a codesandbox
https://codesandbox.io/s/ogl-5i69p

For a simpler use, such as a full-screen shader, more of the core can be omitted as a scene graph (Transform) and projection matrices (Camera) are not necessary. We'll also show how to easily create custom geometry.

```js
import { Renderer, Geometry, Program, Mesh } from 'ogl';

{
    const renderer = new Renderer({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const gl = renderer.gl;
    document.body.appendChild(gl.canvas);

    // Triangle that covers viewport, with UVs that still span 0 > 1 across viewport
    const geometry = new Geometry(gl, {
        position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
        uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) },
    });
    // Alternatively, you could use the Triangle class.

    const program = new Program(gl, {
        vertex: /* glsl */ `
            attribute vec2 uv;
            attribute vec2 position;

            varying vec2 vUv;

            void main() {
                vUv = uv;
                gl_Position = vec4(position, 0, 1);
            }
        `,
        fragment: /* glsl */ `
            precision highp float;

            uniform float uTime;

            varying vec2 vUv;

            void main() {
                gl_FragColor.rgb = vec3(0.8, 0.7, 1.0) + 0.3 * cos(vUv.xyx + uTime);
                gl_FragColor.a = 1.0;
            }
        `,
        uniforms: {
            uTime: { value: 0 },
        },
    });

    const mesh = new Mesh(gl, { geometry, program });

    requestAnimationFrame(update);
    function update(t) {
        requestAnimationFrame(update);

        program.uniforms.uTime.value = t * 0.001;

        // Don't need a camera if camera uniforms aren't required
        renderer.render({ scene: mesh });
    }
}
```

## Structure

In an attempt to keep things light and modular, the library is split up into three components: **Math**, **Core**, and **Extras**.

The **Math** component is an extension of [gl-matrix](http://glmatrix.net/), providing instancable classes that extend Array for each of the module types. 8kb when gzipped, it has no dependencies and can be used separately.

The **Core** is made up of the following:

-   Geometry.js
-   Program.js
-   Renderer.js
-   Camera.js
-   Transform.js
-   Mesh.js
-   Texture.js
-   RenderTarget.js

Any additional layers of abstraction will be included as **Extras**, and not part of the core as to reduce bloat. These provide a wide breadth of functionality, ranging from simple to advanced.

## Unlicense

This is free and unencumbered software released into the public domain.

Anyone is free to copy, modify, publish, use, compile, sell, or
distribute this software, either in source code form or as a compiled
binary, for any purpose, commercial or non-commercial, and by any
means.

In jurisdictions that recognize copyright laws, the author or authors
of this software dedicate any and all copyright interest in the
software to the public domain. We make this dedication for the benefit
of the public at large and to the detriment of our heirs and
successors. We intend this dedication to be an overt act of
relinquishment in perpetuity of all present and future rights to this
software under copyright law.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

For more information, please refer to <https://unlicense.org>
