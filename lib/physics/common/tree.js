import {ObjectStack} from "../../misc/stack.js";
import {BoundaryBox} from "./boundary.js";

const EPSILON = 1e-9;

/** @type{ObjectStack<BoundaryBox>} */
const BoundaryBoxPool = new ObjectStack(() => BoundaryBox.empty());

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
     * @param {BoundaryBox} [segmentBoundary=null]
     * @param {Boolean} [containsActive=true]
     */
    constructor(id, items, boundary, segmentBoundary = null, containsActive = true) {
        this.id = id;
        this.items = items;
        this.boundary = boundary;
        this.segmentBoundary = segmentBoundary ?? boundary;
        this.containsActive = containsActive;
    }

    addLeaf(leaf) {
        this.leafs.push(leaf);
    }
}

export class SpatialTree {
    #leafId = 0;
    #savedStackPosition;

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

        this.#savedStackPosition = BoundaryBoxPool.save();

        this.root = new SpatialLeaf(this.#leafId++, items, BoundaryBox.fromBodies(items, BoundaryBoxPool));
        this.#fillLeaf(this.root, items, this.root.boundary);
    }

    #fillLeaf(current) {
        if (current.items.length <= this.maxCount) return;

        for (const segmentBoundary of this.#iterateSegments(current.segmentBoundary)) {
            const leaf = this.#createLeaf(current, segmentBoundary, current.items);
            if (leaf !== null) {
                current.addLeaf(leaf)
            }
        }

        for (const leaf of current.leafs) {
            this.#fillLeaf(leaf);
        }
    }

    #createLeaf(parent, segmentBoundary, items) {
        const filteredItems = items.filter(b => !b.static && SpatialTree.#isContainedByBoundary(b, segmentBoundary));
        if (filteredItems.length <= 0) return null;

        const boundaryBox = BoundaryBox.fromBodies(filteredItems, BoundaryBoxPool);
        const containsActive = parent.containsActive && filteredItems.some(b => b.active);

        return new SpatialLeaf(this.#leafId++, filteredItems, boundaryBox, segmentBoundary, containsActive);
    }

    * #iterateSegments(boundary) {
        if (boundary.width <= EPSILON && boundary.height <= EPSILON) {
            return;
        }

        const xStep = boundary.width / this.divider;
        const yStep = boundary.height / this.divider;

        for (let x = 0; x < this.divider; ++x) {
            const left = boundary.left + x * xStep
            const right = (x < this.divider - 1 ? left + xStep : boundary.right + EPSILON);

            for (let y = 0; y < this.divider; ++y) {
                const top = boundary.top + y * yStep;
                const bottom = (y < this.divider - 1 ? top + yStep : boundary.bottom + EPSILON);

                yield BoundaryBoxPool.get().update(left, right, top, bottom);
            }
        }
    }

    free() {
        BoundaryBoxPool.restore(this.#savedStackPosition);
    }

    static #isContainedByBoundary(body, boundary) {
        const {x, y} = body.position;

        return boundary.left <= x && x < boundary.right &&
            boundary.top <= y && y < boundary.bottom;
    }
}