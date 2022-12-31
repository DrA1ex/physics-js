/**
 * @abstract
 *
 * @template {Body} TBody
 */
export class IRenderObject {
    /** @type {TBody} */
    #body;

    get body() {return this.#body;}

    /** @description Value within interval [-1;1] */
    z = 1;

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
    get group() {return this.constructor.name;}

    get isIOpaque() {return true;}

    constructor(body) {
        this.#body = body;
    }
}

