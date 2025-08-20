import { PHYSICS, BIRD } from "./config.js";

export class Bird {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = BIRD.width;
        this.height = BIRD.height;
        this.alive = true;
    }

    flap() {
        this.vy = PHYSICS.flapVelocity;
    }

    step(dt) {
        this.vy += PHYSICS.gravity * dt;
        if (this.vy > PHYSICS.terminalVelocity)
            this.vy = PHYSICS.terminalVelocity;
        this.y += this.vy * dt;
    }

    getAABB() {
        return { x: this.x, y: this.y, w: this.width, h: this.height };
    }
}

export function aabbOverlap(a, b) {
    return (
        a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
    );
}
