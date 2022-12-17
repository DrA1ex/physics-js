export class ListNode {
    list;

    /** @type {ListNode<T>|null} */
    previous;
    /** @type {ListNode<T>|null} */
    next = null;

    /** @type {T} */
    value;

    /**
     * @template T
     *
     * @param {List<T>} list
     * @param {T} value
     * @param {ListNode<T>|null} previous
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

    /** @type {ListNode<T>|null} */
    first = null;
    /** @type {ListNode<T>|null} */
    last = null;

    /**
     * @template T
     * @param {T[]} array
     */
    constructor(array) {
        this.size = array.length;
        if (this.size === 0) return;

        this.first = new ListNode(this, array[0], null);
        let current = this.first;
        for (let i = 1; i < array.length; i++) {
            current.next = new ListNode(this, array[i], current);
            current = current.next;
        }

        this.last = current;
    }

    /**
     * @param {ListNode<T>} node
     */
    remove(node) {
        this.#throwIfNodeInvalid(node);

        if (node.previous === null) this.first = node.next;
        else node.previous.next = node.next;

        if (node.next === null) this.last = node.previous;
        else node.next.previous = node.previous;

        this.size -= 1;
        node.dispose();
    }

    /**
     * @param {T} value
     * @param {ListNode<T>|null} node
     */
    add(value, node) {
        if (this.first === null && node === null) throw new Error("For not-empty list node should be specified");
        this.#throwIfNodeInvalid(node);

        const newNode = new ListNode(this, value, node);
        if (this.first === null) {
            this.first = newNode
        } else {
            newNode.next = node.next;
            newNode.previous = node;

            if (node.next !== null) node.next.previous = newNode;
            node.next = newNode;
        }

        if (newNode.next === null) this.last = newNode;
    }


    /**
     * @param  {ListNode<T>} node
     * @return {ListNode<T>}
     */
    next(node) {
        this.#throwIfNodeInvalid(node);
        return node.next ?? this.first;
    }

    /**
     * @param  {ListNode<T>} node
     * @return {ListNode<T>}
     */
    previous(node) {
        this.#throwIfNodeInvalid(node);
        return node.previous ?? this.last;
    }

    * [Symbol.iterator]() {
        let current = this.first;
        while (current !== null) {
            yield current;
            current = current.next;
        }
    }


    #throwIfNodeInvalid(node) {
        if (node === null) throw new Error("Node can't be null");
        if (node.list !== this) throw new Error("Node from different list");
    }
}
