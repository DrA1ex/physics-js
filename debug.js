import {Vector2} from "./vector.js";

export class Debug {
    /** @type {Array<{position: Vector2, size: Vector2, color: string, labeled: boolean}>}*/
    vectors = [];
    /** @type {Array<{position: Vector2, color: string, size: number}>}*/
    collisions = [];

    constructor(options = null) {
        this.showBoundary = options?.showBoundary ?? true;
        this.showVectorLength = options?.showVectorLength ?? false;
        this.showVector = options?.showVector ?? true;
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
        this.vectors.push({position, size, color, labeled});
    }

    /**
     * @param {Vector2} position
     * @param {string|null} [color=null]
     * @param {number|null} [size=null]
     */
    addCollision(position, color = null, size = null) {
        this.collisions.push({position, color, size});
    }

    reset() {
        this.vectors.splice(0);
        this.collisions.splice(0);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {Body[]} bodies
     */
    render(ctx, bodies) {
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

        for (const point of this.collisions) {
            ctx.strokeStyle = point.color || "violet";
            this.#drawPoint(ctx, point.position, point.size || this.collisionSize);
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