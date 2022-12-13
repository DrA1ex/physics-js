import {Sprite} from "./sprite.js";

export class SpriteSeries extends Sprite {
    #cols;
    #rows;
    #count;

    #width;
    #height;
    #border;

    get count() {return this.#count;}
    get width() {return this.#width;}
    get height() {return this.#height;}


    /**
     * @param {string|URL} src
     * @param {number} rows
     * @param {number} cols
     * @param {number} width
     * @param {number} height
     * @param {number} [border=0]
     */
    constructor(src, cols, rows, width, height, border = 0) {
        super(src);

        this.#cols = cols;
        this.#rows = rows;
        this.#width = width;
        this.#height = height;
        this.#border = border;

        this.#count = this.#rows * this.#cols;
    }


    draw(ctx, x, y, width, height, index) {
        if (index < 0) {
            throw new Error(`Out of bounds: index cannot be negative`);
        }

        const row = Math.floor(index / this.#cols);
        const col = index % this.#cols;

        if (row >= this.#rows) {
            throw new Error(`Out of bounds: trying to draw #${index} but sprite has only [${this.#rows}, ${this.#cols}] cells`);
        }

        const xOffset = col * this.#width + this.#border * Math.max(0, col - 1);
        const yOffset = row * this.#height + this.#border * Math.max(0, row - 1);

        this.drawSegment(ctx, xOffset, yOffset, this.#width, this.#height, x, y, width, height);
    }
}