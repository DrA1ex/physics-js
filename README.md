# physics-js

Yet another physics engine implementation.

![image](https://user-images.githubusercontent.com/1194059/203562067-41b3fcb0-a169-46e8-bcb9-04db29d6e556.png)

## Showcase
### Snow
<img width="1498" alt="image" src="https://user-images.githubusercontent.com/1194059/206975949-c1e56c28-7e7f-47d7-b970-ab6d9d81af5d.png">

### Features
- Realtime snow physics
- Snowdrift grows as snow falls on it
- Realtime smoke particle system with enabled physics interactions (e.g. it is repelled by a snowdrift)
- Procedurally generated terrain
- 6 different themes for each time of day
- Theme synchronization corresponsing to local sun position (need to allow geoposition access)
- Can be used as Desktop live wallpapper (using Wallpaper Engine, Plash, etc.)
- [Configurable](https://github.com/DrA1ex/physics-js/blob/master/examples/snow/settings.js#L44)

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
