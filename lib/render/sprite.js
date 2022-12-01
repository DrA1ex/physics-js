import {BodyRenderer} from "./renderer.js";

export class Sprite {
    #loadPromise;
    #loaded = false;
    #image = null;

    get loaded() {return this.#loaded;}
    get count() {return 1;}
    get image() {return this.#image;}

    /**
     * @param {string} src
     */
    constructor(src) {
        this.#image = new Image();
        this.#image.src = src;

        this.#loadPromise = new Promise((resolve, reject) => {
            this.#image.onload = () => {
                this.#image.onload = null;
                this.#image.onerror = null;
                this.#loadPromise = null;

                this.#loaded = true;
                resolve()
            };

            this.#image.onerror = (e) => reject(new Error(e.message ?? "Unable to load image"));
        });
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} index
     */
    draw(ctx, x, y, width, height, index) {
        ctx.drawImage(this.image, x, y, width, height);
    }

    async wait() {
        if (!this.loaded) {
            return this.#loadPromise
        }
    }
}

export class SpriteSeries extends Sprite {
    #cols;
    #rows;
    #count;

    #width;
    #height;
    #border;

    get count() {return this.#count;}

    /**
     * @param {string} src
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

    /**
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {number} index
     */
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

        ctx.drawImage(this.image, xOffset, yOffset, this.#width, this.#height, x, y, width, height);
    }
}

export class SpriteRenderer extends BodyRenderer {
    #sprite
    #index = 0;

    constructor(body, sprite, index = 0) {
        super(body);

        this.#sprite = sprite
        this.#index = index;
    }

    _beforeRender(ctx) {
        super._beforeRender(ctx);

        const {position, angle} = this.body;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(angle);
    }

    _afterRender(ctx) {
        super._afterRender(ctx);

        ctx.restore();
    }

    _renderBody(ctx) {
        const {boundary} = this.body;
        this.#sprite.draw(ctx, -boundary.width / 2, -boundary.height / 2, boundary.width, boundary.height, this.#index);
    }
}