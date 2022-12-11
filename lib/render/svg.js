export class SvgWrapper {
    /** @type{Document} */
    #doc;
    #svg;

    constructor(data) {
        const parser = new DOMParser();
        this.#doc = parser.parseFromString(data, "image/svg+xml");
        this.#svg = this.#doc.getElementsByTagName("svg")[0];
    }

    getSource() {
        return "data:image/svg+xml;base64, " + btoa(this.toString());
    }

    toString() {
        return new XMLSerializer().serializeToString(this.#doc)
    }

    setProperty(property, value) {
        this.#svg.style.setProperty(property, value);
    }


    static async fromRemote(src) {
        const data = await fetch(src);
        const text = await data.text();

        return new SvgWrapper(text);
    }
}