#version 300 es

precision highp float;

in vec4 point_color;
out vec4 out_color;

void main() {
    out_color = point_color;
}