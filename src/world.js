import {
    DIFFICULTY,
    PIPE,
    SPEED,
    DESIGN_WIDTH,
    DESIGN_HEIGHT,
    GROUND_LEVEL,
    HITBOX,
    FLAGS,
    PIPE_TUNING,
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
            top: {
                x: this.x + HITBOX.pipeInsetX * 0.5,
                y: 0,
                w: PIPE.width - HITBOX.pipeInsetX,
                h: topHeight,
            },
            bottom: {
                x: this.x + HITBOX.pipeInsetX * 0.5,
                y: bottomY,
                w: PIPE.width - HITBOX.pipeInsetX,
                h: bottomHeight,
            },
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
            const first = this.createNextPipe(
                DESIGN_WIDTH * 0.75,
                0,
                birdHeight
            );
            this.pipes.push(first);
            if (FLAGS.DEBUG_MENU) {
                console.debug(
                    "[spawn:init] x=%d gap=%d centerY=%d count=%d",
                    first.x,
                    first.gapSize,
                    first.gapCenterY,
                    this.pipes.length
                );
            }
            return;
        }
        const last = this.pipes[this.pipes.length - 1];
        if (last && last.x + PIPE.width < DESIGN_WIDTH + DIFFICULTY.spacing) {
            const jitter = this.rng.nextRange(
                -DIFFICULTY.spacingJitter,
                DIFFICULTY.spacingJitter
            );
            const nextX = last.x + DIFFICULTY.spacing + jitter;
            const next = this.createNextPipe(nextX, this.score, birdHeight);
            this.pipes.push(next);
            if (FLAGS.DEBUG_MENU) {
                console.debug(
                    "[spawn] lastX=%d nextX=%d dx=%d gap=%d centerY=%d count=%d",
                    last.x,
                    next.x,
                    (next.x - last.x).toFixed(1),
                    next.gapSize,
                    next.gapCenterY,
                    this.pipes.length
                );
            }
        }
    }

    createNextPipe(x, score, birdHeight) {
        const gapSize = DIFFICULTY.gapAtScore(score, birdHeight);
        // Keep gap within screen margins
        const marginTop = PIPE_TUNING.marginTop ?? 60;
        const marginBottom = PIPE_TUNING.marginBottom ?? 80;
        const minCenter = marginTop + gapSize / 2;
        const maxCenter = DESIGN_HEIGHT - marginBottom - gapSize / 2;
        let centerY;
        if (PIPE_TUNING.bottomStartY != null) {
            // Force bottom pipe to start at a specific Y (its top edge)
            const bottomY = Math.max(
                minCenter + gapSize / 2,
                Math.min(maxCenter + gapSize / 2, PIPE_TUNING.bottomStartY)
            );
            centerY = bottomY - gapSize / 2;
        } else {
            // Add more variation with weighted random distribution
            const range = maxCenter - minCenter;
            const third = range / 3;

            // 40% chance for middle third (easier), 30% each for top/bottom thirds (harder)
            const rand = this.rng.nextRange(0, 1);
            if (rand < 0.4) {
                // Middle third - easier
                centerY = this.rng.nextRange(
                    minCenter + third,
                    maxCenter - third
                );
            } else if (rand < 0.7) {
                // Top third - harder
                centerY = this.rng.nextRange(minCenter, minCenter + third);
            } else {
                // Bottom third - harder
                centerY = this.rng.nextRange(maxCenter - third, maxCenter);
            }
        }
        const pipe = new PipePair(x, centerY, gapSize);
        if (FLAGS.DEBUG_MENU) {
            console.debug(
                "[pipe] score=%d gap=%d centerY=%d spacing=%d±%d",
                score,
                gapSize,
                centerY,
                DIFFICULTY.spacing,
                DIFFICULTY.spacingJitter
            );
        }
        return pipe;
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
            (bird.y + bird.height >= GROUND_LEVEL || bird.y <= 0) // Ground level based on background image
        ) {
            onHit?.();
            return true;
        }
        return false;
    }
}
