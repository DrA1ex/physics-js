#version 300 es
precision highp float;

in vec4 fillColor;
out vec4 color;

void main() {
    color = fillColor;
}