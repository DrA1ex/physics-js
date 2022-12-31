const GL = WebGL2RenderingContext;

/**
 * @abstract
 */
export class ITextureSource {
    static #lastId = 0;

    #id;
    constructor() {
        this.#id = ITextureSource.#lastId++;
    }

    get id() {return this.#id;}

    /** @type {WebGLTexture|null} */
    glTexture = null;

    glFormat = GL.RGBA;
    glInternalFormat = GL.RGBA;
    glType = GL.UNSIGNED_BYTE;

    glMin = GL.NEAREST_MIPMAP_LINEAR;
    glMag = GL.LINEAR;
    glWrapS = GL.REPEAT;
    glWrapT = GL.REPEAT;
    glGenerateMipmap = true;

    /**
     * @abstract
     * @return {boolean}
     */
    get loaded() {}

    /**
     *  @abstract
     *  @return {TexImageSource}
     **/
    get source() {}

    /**
     * @abstract
     */
    async wait() {};
}

export class ImageTexture extends ITextureSource {
    #loadPromise;
    #loaded = false;
    #image = null;

    get loaded() {return this.#loaded;}
    get source() {return this.#image;}

    /**
     * @param {string|URL} src
     */
    constructor(src) {
        super();

        this.#image = new Image();
        this.updateSource(src);
    }

    async wait() {
        if (!this.loaded) {
            return this.#loadPromise
        }
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

                this.#loaded = true;
                resolve()
            };

            this.#image.onerror = (e) => reject(new Error(e.message ?? "Unable to load image"));
        });
    }
}