import * as Boundary from "./boundary/mesh.js";
import * as Circle from "./circle/mesh.js";
import * as Poly from "./poly/mesh.js";
import * as Line from "./line/mesh.js";

export const Meshes = {
    [Boundary.Mesh.key]: Boundary.Mesh,
    [Circle.Mesh.key]: Circle.Mesh,
    [Line.Mesh.key]: Line.Mesh,
    [Poly.Mesh.key]: Poly.Mesh,
}

export const MeshesOrder = [
    Circle.Mesh.key,
    Line.Mesh.key,
    Poly.Mesh.key,
    Boundary.Mesh.key,
]

export const Configs = [
    Boundary.Config,
    Circle.Config,
    Line.Config,
    Poly.Config,
]