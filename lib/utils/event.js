/**
 * @template TSender, TEvent
 * @typedef {sender: TSender, data: TEvent} EventHandler
 */

/***
 * @template TEvent
 */
export class Event {
    #emitter;
    #type;

    get type() {return this.#type;}

    /**
     * @param {EventEmitter} emitter
     * @param {string} type
     */
    constructor(emitter, type) {
        this.#emitter = emitter;
        this.#type = type;
    }

    /**
     * @param {object} subscriber
     * @param {EventHandler<EventEmitter, TEvent>} handler
     */
    subscribe(subscriber, handler) {
        this.#emitter.subscribe(subscriber, this.type, handler);
    }

    /**
     * @param {object} subscriber
     */
    unsubscribe(subscriber) {
        this.#emitter.unsubscribe(subscriber, this.type);
    }

    /**
     * @param {TEvent} data
     */
    emit(data) {
        this.#emitter.emitEvent(this.type, data);
    }
}

export class EventEmitter {
    #subscribers = new Map();

    /**
     * @param {string} type
     * @param {*|null} data
     */
    emitEvent(type, data = null) {
        for (let subscriptions of this.#subscribers.values()) {
            const handler = subscriptions[type];
            if (handler) {
                handler(this, data);
            }
        }
    }

    /**
     * @param {object} subscriber
     * @param {string} type
     * @param {function} handler
     */
    subscribe(subscriber, type, handler) {
        if (!this.#subscribers.has(subscriber)) {
            this.#subscribers.set(subscriber, {});
        }

        const subscription = this.#subscribers.get(subscriber);
        subscription[type] = handler;
    }

    /**
     * @param {object} subscriber
     * @param {string} type
     */
    unsubscribe(subscriber, type) {
        const subscription = this.#subscribers.has(subscriber) ? this.#subscribers.get(subscriber) : null;
        if (subscription && subscription.hasOwnProperty(type)) {
            delete subscription[type];
        }
    }

    /**
     * @protected
     */
    createEvent(type) {
        return new Event(this, type);
    }
}