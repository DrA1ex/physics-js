import {Vector2} from "./vector.js";

export class Debug {
    /** @type {Array<{position: Vector2, size: Vector2, color: string}>}*/
    vectors = [];
    /** @type {Array<{position: Vector2, color: string}>}*/
    collisions = [];

    constructor(options = null) {
        this.showVectorLength = options?.showVectorLength ?? false;
        this.showVector = options?.showVector ?? true;
        this.vectorArrowSize = options?.vectorArrowSize ?? 2;
        this.collisionSize = options?.collisionSize ?? 4;
    }

    /**
     * @param {Vector2} position
     * @param {Vector2} size
     * @param {string|null} [color=null]
     */
    addVector(position, size, color = null) {
        this.vectors.push({position, size, color});
    }

    /**
     * @param {Vector2} position
     * @param {string|null} [color=null]
     */
    addCollision(position, color = null) {
        this.collisions.push({position, color});
    }

    reset() {
        this.vectors.splice(0);
        this.collisions.splice(0);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    render(ctx) {
        ctx.font = "12px serif";

        if (this.showVector) {
            for (const force of this.vectors) {
                ctx.strokeStyle = force.color || "green";
                ctx.fillStyle = ctx.strokeStyle;
                this.#drawVector(ctx, force.position, force.size.copy(), this.vectorArrowSize);
            }
        }

        for (const force of this.collisions) {
            ctx.strokeStyle = force.color || "violet";
            this.#drawPoint(ctx, force.position, this.collisionSize);
        }
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {Vector2} position
     * @param {Vector2} size
     * @param {number} arrowSize
     */
    #drawVector(ctx, position, size, arrowSize) {
        ctx.beginPath();
        ctx.moveTo(position.x, position.y);
        ctx.lineTo(position.x + size.x, position.y + size.y);
        ctx.stroke();

        this.#drawPoint(ctx, position.copy().add(size), arrowSize);

        const length = size.length();
        if (this.showVectorLength && length > 10) {
            const angle = Math.atan2(size.y, size.x);
            const pos = new Vector2(Math.cos(angle), Math.sin(angle)).scale(size.length() / 2).add(position);
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