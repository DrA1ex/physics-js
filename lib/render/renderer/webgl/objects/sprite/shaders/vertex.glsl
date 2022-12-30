#version 300 es

uniform mat4 projection;

in vec2 point;
in vec2 texcoord;

in vec4 position;
in vec2 size;
in vec4 color;

out vec4 v_color;
out vec2 v_texcoord;

void main() {
    vec2 rotation = vec2(cos(position.w), sin(position.w));
    vec2 r_point = rotation.xy * point.xx + rotation.yx * point.yy * vec2(1.0, -1.0);
    vec4 world_pos = vec4(position.xy + r_point * size, position.z, 1.0);

    gl_Position = projection * world_pos;

    v_color = color;
    v_texcoord = texcoord;
}