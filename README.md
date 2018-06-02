# O-GL WebGL Framework

:warning: Currently in alpha. Working on completing Examples wishlist before moving to beta

O-GL is a minimal WebGL framework that supports both WebGL1 and WebGL2.

It's written using ES6 modules, built for use directly in supported browsers with no need for a dev stack.
Of course it can also be used in any stack that supports ES modules.

When minified, its total weight is currently 13kb gzipped.
This includes its own Math library - itself comprising 7kb gzipped, which can be used separately.

The API shares lots of similarities to Threejs, however is tightly coupled to WebGL and has much fewer features.
In its creation, it is aimed at devs who like small layers of abstraction, and are comfortable enough with WebGL to run their own shaders.
Ideally, the framework does the minimum abstraction necessary, so that devs should still feel comfortable using it in conjunction with native WebGL commands.
For an example, the way to set a clear color is to use the native call `gl.clearColor(r, g, b, a)`.
This hopefully makes it easier to extend, and to use as a WebGL learning resource.

[Go to the examples](https://oframe.github.io/ogl/examples)

The core of the framework is made up of the following
 - Geometry.js
 - Program.js
 - Renderer.js
 - Camera.js
 - Transform.js
 - Mesh.js
 - Texture.js
 - RenderTarget.js

Any extra layers of abstraction will be included as extras, and not part of the core.
These extra classes are still a work-in-progress as examples are developed, but ideally will include:
 - [x] Plane.js
 - [ ] Cube.js
 - [ ] Sphere.js
 - [ ] OrbitControls
 - [ ] Curve.js
 - [ ] Raycasting.js
 - [ ] Projection.js
 - [ ] Post.js
 - [ ] Rig.js
 - [ ] RigAnimation.js


## Examples wishlist

This is an opinionated, comprehensive list of examples for any fully-fledged WebGL framework.
The goal is to complete these as reference for users, and also to help determine which 'extras' need to be developed
so that the framework can achieve any desired effect.

### Geometry
 - [x] Triangle Screen Shader
 - [x] Draw Modes
 - [x] Indexed vs Non-Indexed
 - [x] Load JSON (Javascript Object Notation)
 - [x] Wireframe
 - [ ] Base Primitives - Plane, Cube, Sphere
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

