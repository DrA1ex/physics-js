import {BodyRenderer} from "./renderer.js";

export class Sprite {
    #loadPromise;
    #loaded = false;
    #image = null;

    /** @type {boolean} */
    #preRenderingEnabled = false;
    #preRenderingCanvas = null;
    /** @type {CanvasRenderingContext2D}*/
    #preRenderingCtx = null;
    #preRenderingDimension = null
    #filter = null;

    get loaded() {return this.#loaded;}
    get source() {return this.#preRenderingEnabled ? this.#preRenderingCanvas : this.#image;}

    get preRenderingEnabled() {return this.#preRenderingEnabled;}

    /**
     * @param {string} src
     */
    constructor(src) {
        this.#image = new Image();
        this.updateSource(src);
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
        ctx.drawImage(this.source, x, y, width, height);
    }

    drawSegment(ctx, sx, sy, sWidth, sHeight, x, y, width, height) {
        if (this.#preRenderingEnabled && this.#preRenderingDimension.dpr !== 1) {
            const {dpr} = this.#preRenderingDimension;

            sx *= dpr;
            sy *= dpr;
            sWidth *= dpr;
            sHeight *= dpr;
        }

        ctx.drawImage(this.source, sx, sy, sWidth, sHeight, x, y, width, height);
    }

    async wait() {
        if (!this.loaded) {
            return this.#loadPromise
        }
    }

    /**
     * @param {number} width
     * @param {number} height
     * @param {boolean} [useDpr=true]
     */
    setupPreRendering(width, height, useDpr = true) {
        this.#initPreRenderingCanvas(width, height, useDpr ? window.devicePixelRatio : 1);
        this.#preRenderingEnabled = true;
    }

    /**
     * @param {string} color
     * @param {GlobalCompositeOperation} [type=null]
     */
    setupFilter(color, type = null) {
        if (!this.preRenderingEnabled) throw new Error("Filtering is supported only for pre-rendering sprites");

        this.#filter = {color, type};
        this.#refreshPreRenderingCanvas();
    }

    updateSource(src) {
        if (this.#loadPromise) {
            throw new Error("Image already updating");
        }

        this.#image.src = src;
        this.#loaded = false;
        this.#loadPromise = new Promise((resolve, reject) => {
            this.#image.onload = () => {
                this.#image.onload = null;
                this.#image.onerror = null;
                this.#loadPromise = null;

                if (this.preRenderingEnabled) {
                    this.#refreshPreRenderingCanvas();
                }

                this.#loaded = true;
                resolve()
            };

            this.#image.onerror = (e) => reject(new Error(e.message ?? "Unable to load image"));
        });
    }

    #initPreRenderingCanvas(width, height, dpr) {
        this.#preRenderingDimension = {width: width * dpr, height: height * dpr, dpr};

        this.#preRenderingCanvas = document.createElement("canvas");
        this.#preRenderingCanvas.width = this.#preRenderingDimension.width;
        this.#preRenderingCanvas.height = this.#preRenderingDimension.height;

        this.#preRenderingCtx = this.#preRenderingCanvas.getContext("2d");
        this.#refreshPreRenderingCanvas();
    }

    #refreshPreRenderingCanvas() {
        const ctx = this.#preRenderingCtx;
        const {width, height} = this.#preRenderingDimension;

        ctx.clearRect(0, 0, width, height);

        ctx.drawImage(this.#image, 0, 0, width, height);

        if (this.#filter) {
            const {color, type} = this.#filter;

            ctx.fillStyle = color;
            ctx.globalCompositeOperation = type;
            ctx.fillRect(0, 0, width, height);

            ctx.globalCompositeOperation = "destination-in";
            ctx.drawImage(this.#image, 0, 0, width, height);

            ctx.globalCompositeOperation = "source-over";
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

export class SpriteRenderer extends BodyRenderer {
    #sprite
    #index = 0;

    get sprite() {return this.#sprite;}
    get index() {return this.#index;}

    constructor(body, sprite, index = 0) {
        super(body);

        this.#sprite = sprite
        this.#index = index;
    }

    setIndex(value) {
        this.#index = value;
        return this;
    }

    _beforeRender(ctx, delta) {
        super._beforeRender(ctx, delta);

        const {position, angle} = this.body;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(angle);
    }

    _afterRender(ctx, delta) {
        super._afterRender(ctx, delta);
        ctx.restore();
    }

    _renderBody(ctx, delta) {
        const {boundary} = this.body;

        this.#sprite.draw(ctx, -boundary.width / 2, -boundary.height / 2, boundary.width, boundary.height, this.#index);
    }
}

export class AnimatedSpriteRenderer extends SpriteRenderer {
    #frameTime;
    #currentTime = 0;

    /**
     * @param {Body} body
     * @param {SpriteSeries} spriteSeries
     * @param {number} framerate
     * @param {number} [startFrame=0]
     */
    constructor(body, spriteSeries, framerate, startFrame = 0) {
        super(body, spriteSeries, startFrame);

        this.#frameTime = 1000 / framerate;
    }

    _beforeRender(ctx, delta) {
        super._beforeRender(ctx, delta);

        const frame = Math.floor(this.#currentTime / this.#frameTime) % this.sprite.count;
        if (frame !== this.index) {
            this.setIndex(frame);
        }
    }

    _afterRender(ctx, delta) {
        super._afterRender(ctx, delta);
        this.#currentTime += delta * 1000;
    }
}