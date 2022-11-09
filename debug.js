export class Debug {
    impulses = [];
    collisions = [];

    addImpulse(position, size, color = null) {
        this.impulses.push({color, position, size});
    }

    addCollision(position, color = null) {
        this.collisions.push({color, position});
    }

    reset() {
        this.impulses.splice(0);
        this.collisions.splice(0);
    }

    render(ctx) {
        for (const force of this.impulses) {
            ctx.strokeStyle = force.color || "green";
            this.#drawVector(ctx, force.position, force.size);
        }

        for (const force of this.collisions) {
            ctx.strokeStyle = force.color || "violet";
            this.#drawPoint(ctx, force.position);
        }
    }

    #drawVector(ctx, position, size) {
        ctx.beginPath();
        ctx.moveTo(position.x, position.y);
        ctx.lineTo(position.x + size.x, position.y + size.y);
        ctx.rect(position.x + size.x - 1, position.y + size.y - 1, 2, 2);
        ctx.stroke();
    }

    #drawPoint(ctx, point, size = 4) {
        ctx.strokeRect(point.x - size / 2, point.y - size / 2, size, size);
    }
}