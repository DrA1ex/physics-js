#version 300 es

uniform mat4 projection;

in vec4 point;
in vec4 color;

out vec4 point_color;

void main() {
    vec4 world_pos = point;
    gl_Position = projection * world_pos;

    point_color = color;
}