// language=Glsl
export const BoundaryVertex = `
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
`;

// language=Glsl
export const CircleVertex = `
    #version 300 es

    uniform mat4 projection;

    in vec2 point;

    in vec4 position;
    in float radius;
    in vec4 color;

    out vec4 point_color;

    void main() {
        vec4 world_pos = vec4(position.xy + point * radius, position.zw);
        gl_Position = projection * world_pos;

        point_color = color;
    }
`;

// language=Glsl
export const LineVertex = `
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
`;

// language=Glsl
export const PolyVertex = `
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
`;

// language=Glsl
export const SpriteVertex = `
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
`;

// language=Glsl
export const SpriteFragment = `
    #version 300 es

    precision highp float;

    out vec4 out_color;

    uniform sampler2D u_texture;
    in vec4 v_color;
    in vec2 v_texcoord;

    void main() {
        out_color = texture(u_texture, v_texcoord) * vec4(v_color.rgb * v_color.a, v_color.a);
    }
`;