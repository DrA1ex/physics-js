import {Vector2} from "../../lib/utils/vector.js";

export class GravityPhysics {
    bootstrap;
    settings;
    #stepDelta = 0;


    /**
     * @param {Bootstrap} bootstrap
     * @param {GravityExampleSettings} settings
     */
    constructor(bootstrap, settings) {
        this.bootstrap = bootstrap;
        this.settings = settings;
    }

    reconfigure(settings) {
        this.settings = settings;
    }

    gravityStep(delta) {
        const tree = this.bootstrap.solver.stepInfo.tree;
        this.#stepDelta = delta;

        if (tree) {
            this.#calculateTree(tree);
        }
    }

    /**
     * @param {SpatialTree} tree
     */
    #calculateTree(tree) {
        return this.#calculateLeaf(tree.root, new Vector2());
    }

    /**
     * @param {SpatialLeaf} leaf
     * @param {Vector2} pForce
     */
    #calculateLeaf(leaf, pForce) {
        const blocks = leaf.leafs;
        if (blocks.length > 0) {
            this.#calculateLeafBlock(blocks, pForce);
        } else {
            this.#calculateLeafData(leaf, pForce);
        }
    }

    /**
     *
     * @param {SpatialLeaf[]} blocks
     * @param {Vector2} pForce
     */
    #calculateLeafBlock(blocks, pForce) {
        for (let i = 0; i < blocks.length; i++) {
            const blockCenter = blocks[i].boundary.center;
            const iForce = pForce.copy();

            for (let j = 0; j < blocks.length; j++) {
                if (i === j) continue;

                const mass = blocks[j].items
                    .filter(b => b.tag === "particle")
                    .reduce((p, c) => p + c.mass, 0);

                const g = this.settings.simulation.gravity * mass;
                this.#calculateForce(blockCenter, blocks[j].boundary.center, g, iForce);
            }

            this.#calculateLeaf(blocks[i], iForce);
        }
    }

    /**
     *
     * @param {SpatialLeaf} leaf
     * @param {Vector2} pForce
     */
    #calculateLeafData(leaf, pForce) {
        const g = this.settings.simulation.gravity;

        for (let i = 0; i < leaf.items.length; i++) {
            const attractor = leaf.items[i];
            attractor.velocity.add(pForce.scaled(this.#stepDelta));

            for (let j = 0; j < leaf.items.length; j++) {
                if (i === j) continue;

                const particle = leaf.items[j];
                this.#calculateForce(particle.position, attractor.position, g * attractor.mass, particle);
            }
        }
    }

    /**
     * @param {Vector2} p1
     * @param {Vector2} p2
     * @param {number} g
     * @param {Vector2|Body} out
     */
    function
    #calculateForce(p1, p2, g, out) {
        const dx = p1.x - p2.x,
            dy = p1.y - p2.y;

        const distSquare = dx * dx + dy * dy;
        if (distSquare < this.settings.simulation.minInteractionDistanceSq) return;

        const force = -g / distSquare;
        if (out.velocity !== undefined) {
            out.velocity.x += dx * force * this.#stepDelta;
            out.velocity.y += dy * force * this.#stepDelta;
        } else {
            out.x += dx * force;
            out.y += dy * force;
        }
    }
}