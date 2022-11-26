import {BoundaryBox} from "./body.js";

class SpatialLeaf {
    /** @type{SpatialLeaf[]} */
    leafs = [];
    /** @type{BoundaryBox} */
    boundary;
    /** @type{BoundaryBox} */
    segmentBoundary;
    /** @type{Body[]} */
    items;

    id = 0;

    /**
     * @param {number} id
     * @param {Body[]} items
     * @param {BoundaryBox} boundary
     * @param {BoundaryBox} segmentBoundary
     */
    constructor(id, items, boundary, segmentBoundary = null) {
        this.id = id;
        this.items = items;
        this.boundary = boundary;
        this.segmentBoundary = segmentBoundary ?? boundary;
    }

    addLeaf(leaf) {
        this.leafs.push(leaf);
    }
}

export class SpatialTree {
    #leafId = 0;

    /** @type {SpatialLeaf} */
    root = null;
    divider = 0;
    maxCount = 0;

    /**
     * @param {Body[]} items
     * @param {number} divider
     * @param {number} maxCount
     */
    constructor(items, divider, maxCount) {
        this.divider = divider;
        this.maxCount = maxCount
        this.root = new SpatialLeaf(this.#leafId++, items, SpatialTree.#calcBoundary(items));
        this.#fillLeaf(this.root, items, this.root.boundary);
    }

    #fillLeaf(current) {
        const {items, segmentBoundary: boundary} = current;
        if (items.length <= this.maxCount) {
            return;
        }

        const xStep = boundary.width / this.divider;
        const yStep = boundary.height / this.divider;

        for (let x = 0; x < this.divider; ++x) {
            const left = boundary.left + x * xStep
            const right = (x < this.divider - 1 ? left + xStep : boundary.right + 1e-9);

            for (let y = 0; y < this.divider; ++y) {
                const top = boundary.top + y * yStep;
                const bottom = (y < this.divider - 1 ? top + yStep : boundary.bottom + 1e-9);

                const segmentBoundary = new BoundaryBox(left, right, top, bottom);
                const filteredItems = items.filter(b => SpatialTree.#isContainedByBoundary(b, segmentBoundary));

                if (filteredItems.length > 0) {
                    const leaf = new SpatialLeaf(this.#leafId++, filteredItems, SpatialTree.#calcBoundary(filteredItems), segmentBoundary);
                    current.addLeaf(leaf);
                }
            }
        }

        for (const leaf of current.leafs) {
            this.#fillLeaf(leaf);
        }
    }

    static #calcBoundary(items) {
        let left = Number.POSITIVE_INFINITY, right = Number.NEGATIVE_INFINITY;
        let top = Number.POSITIVE_INFINITY, bottom = Number.NEGATIVE_INFINITY;

        for (const item of items) {
            const b = item.boundary;

            if (b.left < left) left = b.left;
            if (b.right > right) right = b.right;

            if (b.top < top) top = b.top;
            if (b.bottom > bottom) bottom = b.bottom;
        }

        return new BoundaryBox(left, right, top, bottom);
    }

    static #isContainedByBoundary(body, boundary) {
        const {x, y} = body.position;

        return boundary.left <= x && x < boundary.right &&
            boundary.top <= y && y < boundary.bottom;
    }
}