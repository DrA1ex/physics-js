# physics-js

Yet another physics engine implementation.

![image](https://user-images.githubusercontent.com/1194059/203562067-41b3fcb0-a169-46e8-bcb9-04db29d6e556.png)

## Showcase
### Snow
<img width="1400" alt="image" src="https://user-images.githubusercontent.com/1194059/206975949-c1e56c28-7e7f-47d7-b970-ab6d9d81af5d.png">

This demo project showcases the capabilities of a physics engine and built-in canvas renderer, with a focus on real-time snow physics. Additionally, a snowdrift feature has been implemented, which grows as snow particles accumulate on it, and a smoke particle system, which [interacts](https://dra1ex.github.io/physics-js/examples/particles) with the environment in a realistic way.

The terrain is procedurally generated, ensuring that each scene is unique. To further enhance the visual experience, there are six different themes available for each time of day. By utilizing geoposition access, the theme can be automatically synchronized with the local sun position, creating an immersive and dynamic experience.

The demo has been designed to be used as a live desktop wallpaper or screensaver, and is compatible with popular customization tools such as Wallpaper Engine and Plash. Configuration options are available to further customize the experience to your liking.

While the demo can run without user interactions, users can click or touch the screen to play with the snowdrift and make it grow. The snow and smoke particles use an impulse-based physics solver, resulting in accurate physical interactions with the environment.

### Features:
1. Real-time snow physics.
2. Snowdrift that grows as snow falls on it.
3. Real-time smoke particle system with physics interactions (e.g., repelled by a snowdrift).
4. Procedurally generated terrain.
5. Six different themes for each time of day.
6. Theme synchronization corresponding to the local sun position (requires geoposition access).
7. Can be used as a desktop live wallpaper (compatible with Wallpaper Engine, Plash, etc.).
8. Configurable [options.](https://github.com/DrA1ex/physics-js/blob/master/examples/snow/settings.js#L44)

### Themes (click to open demo)

[<img width="30%" src="https://user-images.githubusercontent.com/1194059/206976857-8bc9a591-ea12-4a24-b026-6550cf7e9a4c.jpg">](https://dra1ex.github.io/physics-js/examples/snow/?sun=fixed&theme=dawn)
[<img width="30%" src="https://user-images.githubusercontent.com/1194059/206976858-7f5c77ac-3ba7-4427-a032-256bc0a43e84.jpg">](https://dra1ex.github.io/physics-js/examples/snow/?sun=fixed&theme=twilight)
[<img width="30%" src="https://user-images.githubusercontent.com/1194059/206976859-8dd54630-bf8b-4e1c-a91b-5860ba4242cb.jpg">](https://dra1ex.github.io/physics-js/examples/snow/?sun=fixed&theme=day)

[<img width="30%" src="https://user-images.githubusercontent.com/1194059/206976864-6ab6085c-d89f-4aad-9c80-80ae2a17bdb8.jpeg">](https://dra1ex.github.io/physics-js/examples/snow/?sun=fixed&theme=sunset)
[<img width="30%" src="https://user-images.githubusercontent.com/1194059/206976852-2fb476d7-b7c1-4180-b525-0a94b5f7b927.jpeg">](https://dra1ex.github.io/physics-js/examples/snow/?sun=fixed&theme=dusk)
[<img width="30%" src="https://user-images.githubusercontent.com/1194059/206976856-423e9df8-e97a-41ac-b204-a2d0f9dbad9e.jpg">](https://dra1ex.github.io/physics-js/examples/snow/?sun=fixed&theme=night)

### Links
- Theme synchronization mode: [link](https://dra1ex.github.io/physics-js/examples/snow/)
- Custom geoposition with sun sync: [link](https://dra1ex.github.io/physics-js/examples/snow/?gps=0&lat=-33.865189&lon=151.2158)
- Periodic theme change mode: [continuosly](https://dra1ex.github.io/physics-js/examples/snow/?sun=periodic&sun_interval=0&theme_easing=linear) / [every 5 minutes](https://dra1ex.github.io/physics-js/examples/snow/?sun=periodic&sun_interval=300) / [every hour](https://dra1ex.github.io/physics-js/examples/snow/?sun=periodic&sun_interval=3600)
- Different graphics presets: [Microwave](https://dra1ex.github.io/physics-js/examples/snow/?preset=microwave) / [Low](https://dra1ex.github.io/physics-js/examples/snow/?preset=low) / [Medium](https://dra1ex.github.io/physics-js/examples/snow/?preset=medium) / [High](https://dra1ex.github.io/physics-js/examples/snow/?preset=high) / [Ultra](https://dra1ex.github.io/physics-js/examples/snow/?preset=ultra)
- Debug mode: [link](https://dra1ex.github.io/physics-js/examples/snow/?stats=1&debug=1)
- Tree debug mode: [link](https://dra1ex.github.io/physics-js/examples/snow/?stats=1&debug=1&debug_tree=1&debug_velocity=0&debug_boundary=1&smoke_interval=500&snow_emit=200)

### Gravity
<img width="1400" alt="image" src="https://github.com/DrA1ex/physics-js/assets/1194059/39f0701b-d09f-4e5b-a40d-32b508ba01e1">


This is a gravity N-Body simulation, similar to my other project available on [GitHub](https://github.com/DrA1ex/JS_ParticleSystem). However, this simulation includes collision physics using a pretty accurate impulse-based physics solver.

The simulation models the interactions between multiple bodies in a gravitational field. Each body has its own position, velocity, and mass. The simulation calculates the gravitational forces between the bodies based on their relative positions and masses, and uses this information to update their velocities and positions over time.
In addition to the gravitational forces, this simulation also models collisions between bodies. When two bodies collide, their velocities are adjusted based on the laws of conservation of momentum and energy. This ensures that the simulation is physically accurate and can generate realistic outcomes.

The simulation can run in real-time as it utilizes WebGL for image rendering, resulting in an image that closely resembles a lava lamp. It can be used as a screensaver or wallpaper. However, if you desire a more complex simulation, you can modify the simulation settings (the button is located in the lower-right corner) and increase the particle count or make other parameter changes.

### Links:
- 300 particles: [link](https://dra1ex.github.io/physics-js/examples/gravity/)
- 1000 particles: [link](https://dra1ex.github.io/physics-js/examples/gravity/?count=1000&min_size=40&max_size=100&friction=0&restitution=0&gravity=110&w_scale=80)
- 5000 particles: [link](https://dra1ex.github.io/physics-js/examples/gravity/?count=5000&min_size=100&max_size=200&friction=0.1&restitution=0.85&gravity=80&min_distance=100&p_scale=15&w_scale=400&tree_cnt=16)
- Debug mode: [link](https://dra1ex.github.io/physics-js/examples/gravity/?count=100&min_size=10&max_size=20&p_scale=10&w_scale=20&debug=true&debug_boundary=false)

## Examples

- Particles (WebGL): [link](https://dra1ex.github.io/physics-js/examples/particles)
- Ramp: [link](https://dra1ex.github.io/physics-js/examples/ramp)
- Friction: [link](https://dra1ex.github.io/physics-js/examples/friction)
- Tower: [link](https://dra1ex.github.io/physics-js/examples/tower)
- Falling bodies: [link](https://dra1ex.github.io/physics-js/examples/falling)
- Crusher: [link](https://dra1ex.github.io/physics-js/examples/crusher)
- Sprite (WebGL): [link](https://dra1ex.github.io/physics-js/examples/sprite)
- Z-Index (WebGL): [link](https://dra1ex.github.io/physics-js/examples/z-index)
- Collision: [link](https://dra1ex.github.io/physics-js/examples/collision)
- Collision 2: [link](https://dra1ex.github.io/physics-js/examples/collision2)
- Momentum Conservation: [link](https://dra1ex.github.io/physics-js/examples/momentum_conservation)

## Debugging
- Optimization Tree visualization: [link](https://dra1ex.github.io/physics-js/examples/tower/?debug=1&debug_vector=0&debug_velocity=1&debug_tree=1&debug_body=0&debug_point=0&debug_boundary=0&debug_contact=0&tree_cnt=7)
- Optimization Tree visualization 2: [link](https://dra1ex.github.io/physics-js/examples/ramp/?debug=1&debug_tree=1&debug_tree_leafs=0)
- Optimization Tree visualization 3: [link](https://dra1ex.github.io/physics-js/examples/collision/?debug=1&debug_tree=1&debug_body=1&debug_velocity=0&debug_boundary=0&debug_point=0)
- Warming visualization: [link](https://dra1ex.github.io/physics-js/examples/tower/?debug=1&debug_normal=0&debug_tangent=1&debug_warming=1&debug_boundary=0&debug_velocity=0&debug_point=0)
