import {
    DIFFICULTY,
    PIPE,
    SPEED,
    DESIGN_WIDTH,
    DESIGN_HEIGHT,
} from "./config.js";
import { aabbOverlap } from "./physics.js";

export class PipePair {
    constructor(x, gapCenterY, gapSize) {
        this.x = x;
        this.gapCenterY = gapCenterY;
        this.gapSize = gapSize;
        this.passed = false;
    }

    getAABBs() {
        const topHeight = Math.max(0, this.gapCenterY - this.gapSize / 2);
        const bottomY = this.gapCenterY + this.gapSize / 2;
        const bottomHeight = Math.max(0, DESIGN_HEIGHT - bottomY);
        return {
            top: { x: this.x, y: 0, w: PIPE.width, h: topHeight },
            bottom: { x: this.x, y: bottomY, w: PIPE.width, h: bottomHeight },
        };
    }
}

export class World {
    constructor(rng) {
        this.rng = rng;
        this.pipes = [];
        this.scrollX = 0;
        this.score = 0;
        this.speed = SPEED.base;
    }

    reset() {
        this.pipes.length = 0;
        this.scrollX = 0;
        this.score = 0;
        this.speed = SPEED.base;
    }

    spawnIfNeeded(birdHeight) {
        if (this.pipes.length === 0) {
            this.pipes.push(
                this.createNextPipe(DESIGN_WIDTH * 0.75, 0, birdHeight)
            );
            return;
        }
        const last = this.pipes[this.pipes.length - 1];
        if (last && last.x + PIPE.width < DESIGN_WIDTH + DIFFICULTY.spacing) {
            const jitter = this.rng.nextRange(
                -DIFFICULTY.spacingJitter,
                DIFFICULTY.spacingJitter
            );
            const nextX = last.x + DIFFICULTY.spacing + jitter;
            this.pipes.push(this.createNextPipe(nextX, this.score, birdHeight));
        }
    }

    createNextPipe(x, score, birdHeight) {
        const gapSize = DIFFICULTY.gapAtScore(score, birdHeight);
        // Keep gap within screen margins
        const margin = 80;
        const minCenter = margin + gapSize / 2;
        const maxCenter = DESIGN_HEIGHT - margin - gapSize / 2;
        const centerY = this.rng.nextRange(minCenter, maxCenter);
        return new PipePair(x, centerY, gapSize);
    }

    step(dt, score) {
        this.speed = SPEED.base * SPEED.ramp(score);
        for (const pipe of this.pipes) {
            pipe.x -= this.speed * dt;
        }
        // Remove off-screen
        while (this.pipes.length && this.pipes[0].x + PIPE.width < -20)
            this.pipes.shift();
    }

    checkScoreAndCollisions(bird, onPass, onHit, ghostMode) {
        const birdBox = bird.getAABB();
        for (const pipe of this.pipes) {
            // Passing
            if (!pipe.passed && pipe.x + PIPE.width < bird.x) {
                pipe.passed = true;
                onPass?.();
            }
            // Collisions
            const { top, bottom } = pipe.getAABBs();
            if (
                !ghostMode &&
                (aabbOverlap(birdBox, top) || aabbOverlap(birdBox, bottom))
            ) {
                onHit?.();
                return true;
            }
        }
        // Ground collision
        if (
            !ghostMode &&
            (bird.y + bird.height >= DESIGN_HEIGHT || bird.y <= 0)
        ) {
            onHit?.();
            return true;
        }
        return false;
    }
}
