#version 300 es

uniform vec2 resolution;

in vec3 point;
in vec4 color;

out vec4 point_color;

void main() {
    vec2 world_pos = point.xy;
    vec2 translated_pos = world_pos / resolution * 2.0 - 1.0;

    gl_Position = vec4(translated_pos * vec2(1, -1.0), point.z, 1);
    point_color = color;
}