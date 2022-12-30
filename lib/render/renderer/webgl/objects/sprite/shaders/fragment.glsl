#version 300 es

precision highp float;

out vec4 out_color;

uniform sampler2D u_texture;
in vec4 v_color;
in vec2 v_texcoord;

void main() {
    out_color = texture(u_texture, v_texcoord) * vec4(v_color.rgb * v_color.a, v_color.a);
}