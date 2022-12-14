#version 300 es

uniform vec2 resolution;

in vec2 position;
in vec4 fill;

out vec4 fillColor;

void main() {
    vec2 translated_pos = position / resolution * 2.0 - 1.0;
    gl_Position = vec4(translated_pos * vec2(1, -1.0), 0, 1);
    gl_PointSize = 4.0;

    fillColor = vec4(fill.rgb * fill.a, fill.a);
}