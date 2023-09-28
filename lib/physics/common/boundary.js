import {Vector2} from "../../utils/vector.js";

export class BoundaryBox {
    #points = null;

    width;
    height;
    center = new Vector2()

    left = 0;
    right = 0;
    top = 0;
    bottom = 0;

    /**
     * @param {number} left
     * @param {number} right
     * @param {number} top
     * @param {number} bottom
     */
    constructor(left, right, top, bottom) {
        this.update(left, right, top, bottom);
    }

    points() {
        if (this.#points === null) {
            this.#points = new Array(4);
        }

        this.#points[0] = new Vector2(this.left, this.top);
        this.#points[1] = new Vector2(this.right, this.top);
        this.#points[2] = new Vector2(this.right, this.bottom);
        this.#points[3] = new Vector2(this.left, this.bottom);

        return this.#points;
    }

    /**
     * @param {number} left
     * @param {number} right
     * @param {number} top
     * @param {number} bottom
     * @return {BoundaryBox}
     */
    update(left, right, top, bottom) {
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;

        this.width = this.right - this.left;
        this.height = this.bottom - this.top;

        this.center.x = this.left + this.width / 2
        this.center.y = this.top + this.height / 2;

        return this;
    }

    /**
     * @param {Vector2[]} points
     * @return {BoundaryBox}
     */
    updateFromPoints(points) {
        let left = points[0].x, right = points[0].x, top = points[0].y, bottom = points[0].y;
        for (let i = 1; i < points.length; i++) {
            const point = points[i];

            if (left > point.x) left = point.x;
            if (right < point.x) right = point.x;
            if (top > point.y) top = point.y;
            if (bottom < point.y) bottom = point.y;
        }

        return this.update(left, right, top, bottom);
    }

    copy() {
        return new BoundaryBox(this.left, this.right, this.top, this.bottom);
    }

    static empty() {
        return new BoundaryBox(0, 0, 0, 0);
    }

    static fromDimensions(x, y, width = 1, height = 1) {
        return new BoundaryBox(x, x + width, y, y + height);
    }

    static fromPoints(points) {
        return BoundaryBox.empty().updateFromPoints(points);
    }

    /**
     * @param {Body[]} items
     * @param {ObjectStack<BoundaryBox>} [pool=null]
     * @return {BoundaryBox}
     */
    static fromBodies(items, pool = null) {
        let left = Number.POSITIVE_INFINITY, right = Number.NEGATIVE_INFINITY;
        let top = Number.POSITIVE_INFINITY, bottom = Number.NEGATIVE_INFINITY;

        for (const item of items) {
            const b = item.boundary;

            if (b.left < left) left = b.left;
            if (b.right > right) right = b.right;

            if (b.top < top) top = b.top;
            if (b.bottom > bottom) bottom = b.bottom;
        }

        if (pool) {
            return pool.get().update(left, right, top, bottom);
        }

        return new BoundaryBox(left, right, top, bottom);
    }
}