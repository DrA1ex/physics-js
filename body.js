import {Vector2} from "./vector.js";
import {CircleCollider, RectCollider} from "./collision.js";

/** @typedef {Body|CirceBody} BodyType */

export class BoundaryBox {
    width;
    height;

    left = 0;
    right = 0;
    top = 0;
    bottom = 0;

    constructor(left, right, top, bottom) {
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;

        this.width = this.right - this.left;
        this.height = this.bottom - this.top;
        this.center = new Vector2(this.left + this.width / 2, this.top + this.height / 2);
    }
}

export class Body {
    /** @type {Collider} */
    collider = null;

    active = true;
    position = new Vector2();
    velocity = new Vector2();
    mass = 0;

    constructor(x, y, mass) {
        this.position.x = x;
        this.position.y = y;
        this.mass = mass;

        this.collider = new RectCollider(this);
    }

    /**
     * @abstract
     * @return {BoundaryBox}
     */
    get boundary() {
        return new BoundaryBox(this.position.x, this.position.x, this.position.y, this.position.y);
    }
}

export class CirceBody extends Body {
    radius = 0;

    constructor(x, y, radius, mass) {
        super(x, y, mass);

        this.radius = radius;
        this.collider = new CircleCollider(this);
    }

    get boundary() {
        return new BoundaryBox(
            this.position.x - this.radius, this.position.x + this.radius,
            this.position.y - +this.radius, this.position.y + this.radius
        );
    }
}
