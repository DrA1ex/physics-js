#version 300 es

uniform vec2 resolution;

in vec2 point;

in vec3 position;
in vec2 size;
in vec4 color;

out vec4 point_color;

void main() {
    vec2 world_pos = position.xy + point * size;
    vec2 translated_pos = world_pos / resolution * 2.0 - 1.0;

    gl_Position = vec4(translated_pos * vec2(1, -1.0), position.z, 1);
    point_color = vec4(color.rgb * color.a, color.a);
}