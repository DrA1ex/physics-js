/**
 * @abstract
 *
 * @template {Body} TBody
 */
export class IRenderObject {
    /** @type {TBody} */
    #body;

    get body() {return this.#body;}


    /**
     * @abstract
     */
    get shader() {}

    /**
     * @abstract
     */
    get geometry() {}

    /**
     * @abstract
     */
    get loader() {}

    get key() {return this.geometry.key;}

    constructor(body) {
        this.#body = body;
    }
}

