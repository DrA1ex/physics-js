import {Vector2} from "../utils/vector.js";
import {Collider} from "../physics/collider/base.js";
import {m4} from "../render/renderer/webgl/utils/m4.js";

const COLORS = [
    "red", "darkkhaki", "blue", "gold", "deepskyblue", "seagreen", "orange", "violet", "navy", "lightcoral",
    "darkslategray", "brown", "aqua", "bisque", "purple", "lightseagreen", "hotpink", "slateblue", "chartreuse", "thistle"
]

export class Debug {
    #matrix;

    /** @type {Array<{position: Vector2, size: Vector2, color: string, labeled: boolean}>}*/
    vectors = [];
    /** @type {Array<{position: Vector2, color: string, size: number}>}*/
    collisions = [];

    /**
     * @param {DebugSettings} options
     */
    constructor(options = null) {
        this.configure(options);
    }

    configure(options = null) {
        this.showBoundary = options?.showBoundary ?? true;
        this.showBodies = options?.showBodies ?? true;
        this.showVectorLength = options?.showVectorLength ?? false;
        this.showVectors = options?.showVectors ?? true;
        this.showPoints = options?.showPoints ?? true;
        this.showVelocityVector = options?.showVelocityVector ?? true;
        this.showNormalVector = options?.showNormalVector ?? false;
        this.showTangentVector = options?.showTangentVector ?? false;
        this.showContactVector = options?.showContactVector ?? false;
        this.showWarmVector = options?.showWarmVector ?? false;
        this.debugTree = options?.debugTree ?? false;
        this.showTreeLeafs = options?.showTreeLeafs ?? true;
        this.showTreeSegments = options?.showTreeSegments ?? false;
        this.showTreeSegmentsBoundary = options?.showTreeSegmentsBoundary ?? false;
        this.showTreeBoundaryCollision = options?.showTreeBoundaryCollision ?? true;

        this.vectorArrowSize = options?.vectorArrowSize ?? 2;
        this.collisionSize = options?.collisionSize ?? 4;
    }

    setViewMatrix(matrix) {
        this.#matrix = matrix ? m4.to2d(matrix) : null;
    }

    /**
     * @param {Vector2} position
     * @param {Vector2} size
     * @param {string|null} [color=null]
     * @param {boolean|null} [labeled=null]
     */
    addVector(position, size, color = null, labeled = true) {
        if (!this.showVectors) {
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
        if (this.#matrix) {
            ctx.save();
            ctx.setTransform(
                this.#matrix[0], this.#matrix[1],
                this.#matrix[3], this.#matrix[4],
                this.#matrix[6], this.#matrix[7]
            );
            ctx.lineWidth = 2 / Math.max(this.#matrix[0], this.#matrix[4]);
        }

        if (this.showBoundary) {
            for (const body of bodies) {
                ctx.strokeStyle = body.active ? "#007500" : "#394d39";
                const box = body.boundary;
                ctx.strokeRect(box.left, box.top, box.right - box.left, box.bottom - box.top);
            }
        }

        ctx.font = "1rem serif";
        if (this.showVectors) {
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

        if (this.debugTree && tree) {
            this.#drawTreeDebug(ctx, tree);
        }

        if (this.#matrix) {
            ctx.restore();
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

    #drawTreeDebug(ctx, tree) {
        const self = this;

        function _drawLeafSegmentRect(current) {
            ctx.strokeRect(current.segmentBoundary.left, current.segmentBoundary.top, current.segmentBoundary.width, current.segmentBoundary.height);

            for (const leaf of current.leafs) {
                _drawLeafSegmentRect(leaf);
            }
        }

        function _drawLeafSegmentBoundaryRect(current) {
            ctx.strokeRect(current.boundary.left, current.boundary.top, current.boundary.width, current.boundary.height);

            for (const leaf of current.leafs) {
                _drawLeafSegmentBoundaryRect(leaf);
            }
        }

        function _drawTreeBoundaryCollisions(current) {
            for (let i = 0; i < current.leafs.length; i++) {
                const leaf1 = current.leafs[i];
                for (let j = i + 1; j < current.leafs.length; j++) {
                    const leaf2 = current.leafs[j];
                    const collision = Collider.detectBoundaryCollision(leaf1.boundary, leaf2.boundary);
                    if (collision.result) {
                        _drawTreeCollisionPoint(leaf1, leaf2, collision);
                        _drawTreeLeafCollision(leaf1, leaf2);
                    }
                }

                _drawTreeBoundaryCollisions(leaf1);
            }
        }

        function _drawTreeLeafCollision(leaf1, leaf2) {
            if (leaf1.leafs.length > 0 && leaf2.leafs.length > 0) {
                for (const l1 of leaf1.leafs) {
                    for (const l2 of leaf2.leafs) {
                        const collision = Collider.detectBoundaryCollision(l1.boundary, l2.boundary);
                        if (collision.result) {
                            _drawTreeCollisionPoint(l1, l2, collision);
                            _drawTreeLeafCollision(l1, l2);
                        }
                    }
                }
            }
        }

        function _drawTreeCollisionPoint(leaf1, leaf2, collision) {
            if (leaf1.leafs.length > 0 && leaf2.leafs.length > 0) {
                return;
            }

            if (!leaf1.items.some(i => i.active) && !leaf2.items.some(i => i.active)) {
                return;
            }

            ctx.strokeStyle = "#989898";
            ctx.setLineDash([3, 7]);
            ctx.strokeRect(leaf1.boundary.left, leaf1.boundary.top, leaf1.boundary.width, leaf1.boundary.height);
            ctx.strokeRect(leaf2.boundary.left, leaf2.boundary.top, leaf2.boundary.width, leaf2.boundary.height);

            ctx.strokeStyle = "#20222a";
            ctx.setLineDash([]);
            const vectorSize = collision.bContact.delta(collision.aContact);
            if (vectorSize.length() > 8) {
                self.#drawVector(ctx, collision.aContact, vectorSize, 8, false);
            } else {
                self.#drawPoint(ctx, collision.aContact, 8);
            }
        }

        function _drawLeafForeground(current) {
            const labelSize = 6;

            if (current.leafs.length === 0) {
                const bodyId = Math.min(...current.items.map(i => i.id));
                ctx.strokeStyle = ctx.fillStyle = COLORS[bodyId % COLORS.length];

                for (const item of current.items) {
                    ctx.beginPath();
                    ctx.arc(item.position.x, item.position.y, labelSize / 2, 0, Math.PI * 2);
                    ctx.fill();
                }

                if (self.showTreeLeafs) {
                    ctx.strokeRect(current.boundary.left, current.boundary.top, current.boundary.width, current.boundary.height);

                    const label = bodyId.toString();
                    const measure = ctx.measureText(label);

                    ctx.fillText(
                        label,
                        current.boundary.left + measure.fontBoundingBoxDescent,
                        current.boundary.top + measure.fontBoundingBoxAscent,
                        Math.max(0, Math.min(current.boundary.width, current.boundary.height) - measure.fontBoundingBoxDescent)
                    );
                }
            }

            for (const leaf of current.leafs) {
                _drawLeafForeground(leaf);
            }
        }


        ctx.save();

        if (this.showTreeSegments) {
            ctx.strokeStyle = "silver";
            _drawLeafSegmentRect(tree.root);
        }

        if (this.showTreeSegmentsBoundary) {
            ctx.strokeStyle = "#e7ecff";
            _drawLeafSegmentBoundaryRect(tree.root);
        }

        ctx.font = "0.5rem serif";
        _drawLeafForeground(tree.root);

        if (this.showTreeBoundaryCollision) {
            _drawTreeBoundaryCollisions(tree.root);
        }

        ctx.restore();
    }
}