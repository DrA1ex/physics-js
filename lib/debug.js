import {Vector2} from "./utils/vector.js";

const COLORS = [
    "red", "darkkhaki", "blue", "gold", "deepskyblue", "seagreen", "orange", "violet", "navy", "lightcoral",
    "darkslategray", "brown", "aqua", "bisque", "purple", "lightseagreen", "hotpink", "slateblue", "chartreuse", "thistle"
]

export class Debug {
    /** @type {Array<{position: Vector2, size: Vector2, color: string, labeled: boolean}>}*/
    vectors = [];
    /** @type {Array<{position: Vector2, color: string, size: number}>}*/
    collisions = [];

    constructor(options = null) {
        this.showBoundary = options?.showBoundary ?? true;
        this.showBodies = options?.showBodies ?? true;
        this.showVectorLength = options?.showVectorLength ?? false;
        this.showVector = options?.showVector ?? true;
        this.showPoints = options?.showPoints ?? true;
        this.showVelocityVector = options?.showVelocityVector ?? true;
        this.showNormalVector = options?.showNormalVector ?? false;
        this.showTangentVector = options?.showTangentVector ?? false;
        this.showContactVector = options?.showContactVector ?? false;
        this.showWarmVector = options?.showWarmVector ?? false;
        this.showTree = options?.showTree ?? false;
        this.vectorArrowSize = options?.vectorArrowSize ?? 2;
        this.collisionSize = options?.collisionSize ?? 4;
    }

    /**
     * @param {Vector2} position
     * @param {Vector2} size
     * @param {string|null} [color=null]
     * @param {boolean|null} [labeled=null]
     */
    addVector(position, size, color = null, labeled = true) {
        if (!this.showVector) {
            return;
        }

        this.vectors.push({position, size, color, labeled});
    }

    /**
     * @param {Vector2} position
     * @param {string|null} [color=null]
     * @param {number|null} [size=null]
     */
    addPoint(position, color = null, size = null) {
        this.collisions.push({position, color, size});
    }

    reset() {
        this.vectors.splice(0);
        this.collisions.splice(0);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {Body[]} bodies
     * @param {SpatialTree} tree
     */
    render(ctx, bodies, tree) {
        if (this.showBoundary) {
            for (const body of bodies) {
                ctx.strokeStyle = body.active ? "#007500" : "#394d39";
                const box = body.boundary;
                ctx.strokeRect(box.left, box.top, box.right - box.left, box.bottom - box.top);
            }
        }

        ctx.font = "12px serif";
        if (this.showVector) {
            for (const vectorInfo of this.vectors) {
                ctx.strokeStyle = vectorInfo.color || "green";
                ctx.fillStyle = ctx.strokeStyle;
                this.#drawVector(ctx, vectorInfo.position, vectorInfo.size.copy(), this.vectorArrowSize, vectorInfo.labeled);
            }
        }

        if (this.showPoints) {
            for (const point of this.collisions) {
                ctx.strokeStyle = point.color || "violet";
                this.#drawPoint(ctx, point.position, point.size || this.collisionSize);
            }
        }

        if (this.showTree && tree) {
            function _drawLeafBackground(current) {
                ctx.strokeRect(current.segmentBoundary.left, current.segmentBoundary.top, current.segmentBoundary.width, current.segmentBoundary.height);
                ctx.strokeRect(current.boundary.left, current.boundary.top, current.boundary.width, current.boundary.height);

                for (const leaf of current.leafs) {
                    _drawLeafBackground(leaf);
                }
            }

            function _drawLeafForeground(current) {
                if (current.leafs.length === 0) {
                    const colorId = Math.min(...current.items.map(i => i.id));
                    ctx.strokeStyle = ctx.fillStyle = COLORS[colorId % COLORS.length];

                    for (const item of current.items) {
                        ctx.fillRect(item.position.x - 2, item.position.y - 2, 4, 4);
                    }

                    ctx.strokeRect(current.boundary.left, current.boundary.top, current.boundary.width, current.boundary.height);

                    const label = colorId.toString();
                    const measure = ctx.measureText(label);
                    ctx.fillText(label, current.boundary.left + 4, current.boundary.top + measure.fontBoundingBoxAscent)
                }

                for (const leaf of current.leafs) {
                    _drawLeafForeground(leaf);
                }
            }

            ctx.strokeStyle = "whitesmoke";
            ctx.font = "0.5rem serif";
            _drawLeafBackground(tree.root);
            _drawLeafForeground(tree.root);
        }
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {Vector2} position
     * @param {Vector2} size
     * @param {number} arrowSize
     * @param {boolean} labeled
     */
    #drawVector(ctx, position, size, arrowSize, labeled) {
        const length = size.length();
        if (length <= arrowSize) {
            return;
        }

        ctx.beginPath();
        ctx.moveTo(position.x, position.y);
        ctx.lineTo(position.x + size.x, position.y + size.y);
        ctx.stroke();

        this.#drawPoint(ctx, position.copy().add(size), arrowSize);
        if (labeled && length > 20 && this.showVectorLength) {
            const pos = size.normalized().scale(size.length() / 2).add(position);
            this.#drawLabel(ctx, pos, length.toFixed(1), arrowSize);
        }
    }

    #drawPoint(ctx, point, size) {
        ctx.strokeRect(point.x - size / 2, point.y - size / 2, size, size);
    }

    #drawLabel(ctx, pos, text, border) {
        const metrics = ctx.measureText(text);

        const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        pos.add(new Vector2(-metrics.width / 2, height / 2));

        ctx.save();
        ctx.fillStyle = "black";
        ctx.beginPath()
        ctx.rect(pos.x - border, pos.y - height - border, metrics.width + border * 2, height + border * 2);
        ctx.fill()
        ctx.stroke();
        ctx.restore();

        ctx.fillText(text, pos.x, pos.y);
    }
}