import { PHYSICS, BIRD, HITBOX } from "./config.js";

export class Bird {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vy = 0;
        this.width = BIRD.width;
        this.height = BIRD.height;
        this.alive = true;
    }

    flap() {
        this.vy = PHYSICS.flapVelocity;
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vy = 0;
        this.alive = true;
    }

    step(dt) {
        this.vy += PHYSICS.gravity * dt;
        if (this.vy > PHYSICS.terminalVelocity)
            this.vy = PHYSICS.terminalVelocity;
        this.y += this.vy * dt;
    }

    getAABB() {
        // Tighten hitbox
        const insetX = HITBOX.birdInsetX;
        const insetY = HITBOX.birdInsetY;
        return {
            x: this.x + insetX * 0.5,
            y: this.y + insetY * 0.5,
            w: this.width - insetX,
            h: this.height - insetY,
        };
    }
}

export function aabbOverlap(a, b) {
    return (
        a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
    );
}
