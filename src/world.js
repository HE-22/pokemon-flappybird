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
    INPUT,
    PHYSICS,
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
        const insetLeft =
            HITBOX.pipeInsetLeft ?? (HITBOX.pipeInsetX ?? 0) * 0.5;
        const insetRight =
            HITBOX.pipeInsetRight ?? (HITBOX.pipeInsetX ?? 0) * 0.5;
        const insetYGap = HITBOX.pipeInsetYGap ?? 0;
        const hitboxX = this.x + insetLeft;
        const hitboxW = Math.max(0, PIPE.width - insetLeft - insetRight);
        return {
            top: {
                x: hitboxX,
                y: 0,
                w: hitboxW,
                h: Math.max(0, topHeight - insetYGap),
            },
            bottom: {
                x: hitboxX,
                y: bottomY + insetYGap,
                w: hitboxW,
                h: Math.max(0, bottomHeight - insetYGap),
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
            // Uniform distribution across the allowed range for consistent variability
            centerY = this.rng.nextRange(minCenter, maxCenter);
        }

        // Fairness clamp: ensure vertical transition between consecutive gaps is solvable
        const last = this.pipes[this.pipes.length - 1];
        if (last) {
            const dx = Math.max(0, x - last.x);
            const speedForScore = SPEED.base * SPEED.ramp(score);
            const tAvail = dx / Math.max(1e-6, speedForScore);

            const flapInterval = Math.max(
                INPUT.bufferMs / 1000,
                1 / PHYSICS.fixedHz
            );
            const g = PHYSICS.gravity;
            const vFlap = PHYSICS.flapVelocity; // negative (up)
            const vTerm = PHYSICS.terminalVelocity;

            function maxUpwardReach(seconds) {
                let remaining = seconds;
                let totalDy = 0; // positive = down, negative = up
                while (remaining > 1e-6) {
                    const dtSeg = Math.min(remaining, flapInterval);
                    // Displacement with reset initial velocity each flap
                    totalDy += vFlap * dtSeg + 0.5 * g * dtSeg * dtSeg;
                    remaining -= dtSeg;
                }
                // Return positive upward capacity in pixels
                return Math.max(0, -totalDy);
            }

            function maxDownwardReach(seconds) {
                const tToTerm = vTerm / g;
                if (seconds <= tToTerm) {
                    return 0.5 * g * seconds * seconds;
                }
                const distToTerm = 0.5 * g * tToTerm * tToTerm;
                return distToTerm + vTerm * (seconds - tToTerm);
            }

            const upCap = maxUpwardReach(tAvail);
            const downCap = maxDownwardReach(tAvail);

            const allowedMin = Math.max(minCenter, last.gapCenterY - upCap);
            const allowedMax = Math.min(maxCenter, last.gapCenterY + downCap);

            if (allowedMin <= allowedMax) {
                if (centerY < allowedMin) centerY = allowedMin;
                if (centerY > allowedMax) centerY = allowedMax;
            } else {
                // Degenerate case: fall back to closest feasible center around last gap
                centerY = Math.min(
                    maxCenter,
                    Math.max(minCenter, last.gapCenterY)
                );
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
