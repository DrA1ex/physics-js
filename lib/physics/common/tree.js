import {BoundaryBox} from "./boundary.js";

const EPSILON = 1e-9;

class SpatialLeaf {
    /** @type{SpatialLeaf[]} */
    leafs = [];
    /** @type{BoundaryBox} */
    boundary;
    /** @type{BoundaryBox} */
    segmentBoundary;
    /** @type{Body[]} */
    items;
    containsActive = true;

    id = 0;

    /**
     * @param {number} id
     * @param {Body[]} items
     * @param {BoundaryBox} boundary
     * @param {BoundaryBox} segmentBoundary
     * @param {Boolean} containsActive
     */
    constructor(id, items, boundary, segmentBoundary, containsActive) {
        this.id = id;
        this.items = items;
        this.boundary = boundary;
        this.segmentBoundary = segmentBoundary;
        this.containsActive = containsActive;
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
        this.maxCount = maxCount;

        const boundary = BoundaryBox.fromBodies(items);
        const segmentBoundary = this.#createLevelBoundary(boundary);

        this.root = new SpatialLeaf(this.#leafId++, items, BoundaryBox.fromBodies(items), segmentBoundary, true);

        this.#fillLeaf(this.root);
    }

    #fillLeaf(leaf) {
        if (leaf.items.length <= this.maxCount) return;

        for (const segment of this.#iterateSegments(leaf.segmentBoundary)) {
            const child = this.#createLeaf(leaf, segment);
            if (child) leaf.addLeaf(child);
        }

        for (const child of leaf.leafs) {
            this.#fillLeaf(child);
        }
    }

    #createLeaf(parent, segmentBoundary) {
        const {items} = parent;
        const filteredItems = items.filter(b => !b.static && SpatialTree.#isContainedByBoundary(b, segmentBoundary));
        if (filteredItems.length <= 0) return null;

        const boundaryBox = BoundaryBox.fromBodies(filteredItems);
        const containsActive = parent.containsActive && filteredItems.some(b => b.active);

        return new SpatialLeaf(this.#leafId++, filteredItems, boundaryBox, segmentBoundary, containsActive);
    }

    * #iterateSegments(segmentBoundary) {
        const step = segmentBoundary.width / this.divider;
        if (step <= EPSILON) return;

        for (let i = 0; i < this.divider; i++) {
            for (let j = 0; j < this.divider; j++) {
                const left = segmentBoundary.left + i * step;
                const top = segmentBoundary.top + j * step

                yield new BoundaryBox(left, left + step, top, top + step);
            }
        }
    }

    #createLevelBoundary(boundary) {
        const maxDim = Math.max(...[
            boundary.left, boundary.right, boundary.top, boundary.bottom
        ].map(v => Math.abs(v)));

        const level = Math.ceil(Math.log(maxDim) / Math.log(this.divider));
        const dim = Math.pow(this.divider, level);
        return new BoundaryBox(-dim, dim, -dim, dim);
    }

    static #isContainedByBoundary(body, boundary) {
        const {x, y} = body.position;

        return boundary.left <= x && x < boundary.right &&
            boundary.top <= y && y < boundary.bottom;
    }
}