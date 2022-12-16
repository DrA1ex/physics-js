export class Node {
    list;

    /** @type {Node<T>|null} */
    previous;
    /** @type {Node<T>|null} */
    next = null;

    /** @type {T} */
    value;

    /**
     * @template T
     *
     * @param {List<T>} list
     * @param {T} value
     * @param {Node<T>|null} previous
     */
    constructor(list, value, previous) {
        this.list = list;
        this.value = value;
        this.previous = previous;
    }

    dispose() {
        this.list = null;
        this.value = null;
        this.next = null;
        this.previous = null;
    }
}

export class List {
    size;

    /** @type {Node<T>|null} */
    root = null;
    /** @type {Node<T>|null} */
    last = null;

    /**
     * @template T
     * @param {T[]} array
     */
    constructor(array) {
        this.size = array.length;
        if (this.size === 0) return;

        this.root = new Node(this, array[0], null);
        let current = this.root;
        for (let i = 1; i < array.length; i++) {
            current.next = new Node(this, array[i], current);
            current = current.next;
        }

        this.last = current;
    }

    /**
     * @param {Node<T>} node
     */
    remove(node) {
        if (node === null) throw new Error("Node cannot empty");
        if (node.list !== this) throw new Error("Trying to delete node of another tree");

        this.size -= 1;
        if (node === this.root) {
            this.root = node.next;
            if (this.root !== null) this.root.previous = null;
            if (this.root === null || this.root.next === null) this.last = null;
        } else {
            if (node.previous !== null) node.previous.next = node.next;
            if (node.next !== null) node.next.previous = node.previous;
            else this.last = node;
        }

        node.dispose();
    }

    /**
     * @param {T} value
     * @param {Node<T>|null} node
     */
    add(value, node) {
        if (this.root === null && node === null) throw new Error("For not-empty list node should be specified");

        const newNode = new Node(this, value, node);
        if (this.root === null) {
            this.root = newNode
        } else {
            newNode.next = node.next;
            newNode.previous = node;

            if (node.next !== null) node.next.previous = newNode;
            node.next = newNode;
        }

        if (newNode.next === null) this.last = newNode;
    }

    * [Symbol.iterator]() {
        let current = this.root;
        while (current !== null) {
            yield current;
            current = current.next;
        }
    }
}