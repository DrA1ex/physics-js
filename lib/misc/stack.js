export class ObjectStack {
    #allocated = []
    #spawnFn;

    #blockSize;
    #used = 0;
    #total = 0;

    #savedPoints = [];

    get used() {return this.#used;}
    get savedCount() {return this.#savedPoints.length;}

    constructor(spawnFn, blockSize = 1024, preallocate = false) {
        this.#spawnFn = spawnFn;
        this.#blockSize = blockSize;

        if (preallocate) {
            this.#allocateBlock(this.#blockSize);
        }
    }

    get() {
        if (this.#used >= this.#total) {
            this.#allocateBlock(this.#blockSize);
        }

        const value = this.#get(this.#used);
        this.#used += 1;

        return value;
    }

    save() {
        this.#savedPoints.push(this.#used);
        return this.#savedPoints.length - 1;
    }
    restore(index = null) {
        if (this.#savedPoints.length === 0) throw new Error("There is no saved points");
        if (index < 0 || index >= this.#savedPoints.length) throw new Error("Index out of range");

        if (index === null) index = this.#savedPoints.length - 1;

        if (index === this.#savedPoints.length - 1) {
            const pos = this.#savedPoints.pop();
            this.#free(this.#used - pos);
            for (let i = index - 1; i >= 0; i--) {
                if (this.#savedPoints[i] !== null) break;
                this.#savedPoints.pop();
            }
        } else {
            this.#savedPoints[index] = null;
        }
    }

    #free(count) {
        this.#used = Math.max(0, this.#used - count);
    }

    clear() {
        this.#savedPoints.splice(0);
        this.#free(this.#used);
    }

    #get(index) {
        const blockIndex = Math.floor(index / this.#blockSize);
        const itemIndex = index % this.#blockSize;

        if (blockIndex >= this.#allocated.length) {
            throw new Error("Index out of range");
        }

        return this.#allocated[blockIndex][itemIndex];
    }

    #allocateBlock(size) {
        const block = new Array(size);
        for (let i = 0; i < block.length; i++) {
            block[i] = this.#spawnFn();
        }

        this.#total += size;
        this.#allocated.push(block);
    }
}