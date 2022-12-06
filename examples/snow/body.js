import {LineBody, PolygonBody} from "../../lib/physics/body.js";
import {Vector2} from "../../lib/utils/vector.js";
import {LineRenderer, PolygonBodyRenderer} from "../../lib/render/renderer.js";
import {SnowdriftCollider, Tags, UnionPolyBody} from "./misc.js";

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

class SnowDriftRenderer extends PolygonBodyRenderer {
    constructor(body) {
        super(body);

        this.z = 3;
        this.renderDirection = false;
        this.fill = true;
        this.stroke = false;

        this.smooth = true;
        this.smoothCount = 4;
    }
}

export class SnowDriftStaticBody extends UnionPolyBody {
    renderer;

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

        this.renderer = new SnowDriftRenderer(this);
    }
}

export class RoofSnowDriftBody extends PolygonBody {
    renderer;

    constructor(x, y, width, height, segmentsCnt, onCollide) {
        const yCut = Math.PI / 180 * 30;
        const xStep = width / (segmentsCnt - 1);
        const yStep = (Math.PI - yCut * 2) / segmentsCnt;
        const yOffset = height / 2;

        const points = new Array(segmentsCnt);
        let xCurrent = -width / 2;
        let yCurrent = yCut;
        for (let i = 0; i < segmentsCnt; i++) {
            const y = Math.sin(yCurrent);
            points[i] = new Vector2(xCurrent, yOffset - y * height);

            xCurrent += xStep;
            yCurrent += yStep;
        }

        super(x, y, [
            new Vector2(-width / 2, yOffset),
            ...points,
            new Vector2(width / 2, yOffset),
        ]);

        this.setTag(Tags.snowDrift);
        this.setActive(false);

        this.collider = new SnowdriftCollider(this, onCollide);

        this.renderer = new SnowDriftRenderer(this);
        this.renderer.smooth = false;
        this.renderer.z = 2;
    }
}