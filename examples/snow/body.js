import {LineBody} from "../../lib/physics/body.js";
import {Vector2} from "../../lib/utils/vector.js";
import {LineRenderer, PolygonBodyRenderer} from "../../lib/render/renderer.js";
import {SnowCloud, Tags} from "./snow.js";
import {SnowdriftCollider, UnionPolyBody} from "./misc.js";

export class SnowDriftSegmentBody extends LineBody {
    #renderer;

    get renderer() {return this.#renderer;}

    constructor(parent, xLast, yLast, x, y) {
        super(xLast, yLast, x, y);

        this.collider = new SnowdriftCollider(this, parent.onCollide.bind(parent));

        this.#renderer = new LineRenderer(this);
        this.#renderer.stroke = false;

        this.setTag(Tags.snowDrift);
        this.setActive(false);
        this.setFriction(0.3);
    }
}

export class SnowDriftStaticBody extends UnionPolyBody {
    #renderer;

    get renderer() {return this.#renderer;}

    constructor(segments, worldBox) {
        const pFirst = segments[0].points;
        const pLast = segments[segments.length - 1].points;

        const closedSegments = [
            new LineBody(worldBox.left, worldBox.bottom, worldBox.left, worldBox.bottom),
            new LineBody(worldBox.left, worldBox.bottom, pFirst[0].x, pFirst[0].y),
            ...segments,
            new LineBody(pLast[1].x, pLast[1].y, worldBox.right, worldBox.bottom),
            new LineBody(worldBox.right, worldBox.bottom, worldBox.right, worldBox.bottom),
        ];

        super(worldBox.center.x, worldBox.bottom, closedSegments)
            .setScale(new Vector2(1, 1.1))
            .setStatic(true);

        this.#renderer = new PolygonBodyRenderer(this);
        this.#renderer.z = 3;
        this.#renderer.renderDirection = false;
        this.#renderer.fill = true;
        this.#renderer.stroke = false;
        this.#renderer.fillStyle = SnowCloud.SnowColor;

        this.#renderer.smooth = true;
        this.#renderer.smoothCount = 4;
    }
}