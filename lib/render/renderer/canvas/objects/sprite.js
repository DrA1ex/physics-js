import {BodyRenderer} from "./base.js";

export class SpriteRenderer extends BodyRenderer {
    /** @type {Sprite} */
    #sprite
    #index = 0;

    get sprite() {return this.#sprite;}
    get index() {return this.#index;}

    /**
     * @param {Body} body
     * @param {Sprite} sprite
     * @param {number} [index=0]
     */
    constructor(body, sprite, index = 0) {
        super(body);

        this.#sprite = sprite
        this.#index = index;
    }

    setIndex(value) {
        this.#index = value;
        return this;
    }

    _beforeRender(ctx, delta) {
        super._beforeRender(ctx, delta);

        const {position, angle} = this.body;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(angle);
    }

    _afterRender(ctx, delta) {
        super._afterRender(ctx, delta);
        ctx.restore();
    }

    _renderBody(ctx, delta) {
        const {boundary} = this.body;

        this.#sprite.draw(ctx, -boundary.width / 2, -boundary.height / 2, boundary.width, boundary.height, this.#index);
    }
}

export class AnimatedSpriteRenderer extends SpriteRenderer {
    #frameTime;
    #currentTime = 0;

    /**
     * @param {Body} body
     * @param {SpriteSeries} spriteSeries
     * @param {number} framerate
     * @param {number} [startFrame=0]
     */
    constructor(body, spriteSeries, framerate, startFrame = 0) {
        super(body, spriteSeries, startFrame);

        this.#frameTime = 1000 / framerate;
    }

    _beforeRender(ctx, delta) {
        super._beforeRender(ctx, delta);

        const frame = Math.floor(this.#currentTime / this.#frameTime) % this.sprite.count;
        if (frame !== this.index) {
            this.setIndex(frame);
        }
    }

    _afterRender(ctx, delta) {
        super._afterRender(ctx, delta);
        this.#currentTime += delta * 1000;
    }
}