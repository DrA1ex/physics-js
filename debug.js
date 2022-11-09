export class Debug {
    impulses = [];

    addImpulse(position, size, color = null) {
        this.impulses.push({color, position, size});
    }

    reset() {
        this.impulses.splice(0);
    }

    render(ctx) {
        for (const force of this.impulses) {
            ctx.strokeStyle = force.color || "green";
            this.#drawVector(ctx, force.position, force.size);
        }
    }

    #drawVector(ctx, position, size) {
        ctx.beginPath();
        ctx.moveTo(position.x, position.y);
        ctx.lineTo(position.x + size.x, position.y + size.y);
        ctx.rect(position.x + size.x - 1, position.y + size.y - 1, 2, 2);
        ctx.stroke();
    }
}