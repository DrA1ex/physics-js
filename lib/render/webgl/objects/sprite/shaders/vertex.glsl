#version 300 es

uniform vec2 resolution;

in vec2 point;

in vec2 position;
in vec2 size;
in vec4 fill;

in sampler2D sprite_tex;

out vec4 fillColor;

void main() {
    vec2 world_pos = position + point * size;
    vec2 translated_pos = world_pos / resolution * 2.0 - 1.0;

    gl_Position = vec4(translated_pos * vec2(1, -1.0), 0, 1);
    fillColor = vec4(fill.rgb * fill.a, fill.a);
}