/***
 * @template T
 */
export class ObjectPool {
    static #hashKey = Symbol();

    /** @type {Map<number, T>} */
    #used = new Map();
    /** @type {Map<number, T>} */
    #free = new Map();

    #id = 0;
    #spawnFn;


    /**
     * @param {function(): T} spawnFn
     */
    constructor(spawnFn) {
        this.#spawnFn = spawnFn;
    }

    /**
     * @return {T}
     */
    get() {
        if (this.#free.size > 0) {
            const next = this.#free.entries().next();
            if (!next.done) {
                const [key, value] = next.value;

                this.#used.set(key, value);
                this.#free.delete(key);

                return value;
            }
        }

        const value = this.#spawnFn();
        value[ObjectPool.#hashKey] = this.#id++;
        this.#used.set(value[ObjectPool.#hashKey], value);

        return value;
    }

    /**
     * @param {T} object
     */
    free(object) {
        const hash = object[ObjectPool.#hashKey];
        if (hash === undefined) {
            console.warn(`Trying to free non-pool object ${object}`);
            return;
        }

        const value = this.#used.get(hash);
        if (value) {
            this.#used.delete(hash);
            this.#free.set(hash, value);
        } else if (this.#free.has(hash)) {
            console.warn(`Object with hash ${hash} already free`);
        } else {
            console.warn(`Trying to free untracked object with hash ${hash}`);
        }
    }

    detach(object) {
        const hash = object[ObjectPool.#hashKey];
        if (hash === undefined) {
            console.warn(`Trying to detach non-pool object ${object}`);
            return;
        }

        if (this.#used.has(hash)) {
            this.#used.delete(hash);
        } else if (this.#free.has(hash)) {
            this.#free.delete(hash);
        } else {
            console.warn(`Trying to detach untracked object with hash ${hash}`);
        }
    }
}