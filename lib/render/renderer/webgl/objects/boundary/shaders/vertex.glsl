#version 300 es

uniform mat4 projection;

in vec2 point;

in vec4 position;
in vec2 size;
in vec4 color;

out vec4 point_color;

void main() {
    vec4 world_pos = vec4(position.xy + point * size, position.zw);
    gl_Position = projection * world_pos;

    point_color = color;
}