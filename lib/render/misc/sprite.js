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
    get filter() {return this.#filter;}

    /**
     * @param {string|URL} src
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

        this.#filter = {color, type: type};
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