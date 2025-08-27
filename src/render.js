import {
    COLORS,
    DESIGN_WIDTH,
    DESIGN_HEIGHT,
    PIPE,
    BIRD,
    FLAGS,
} from "./config.js";

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;
        this.highContrast = false;
        this.birdSkins = null; // {evo1, evo2, evo3}
        this.currentBirdSkin = null; // HTMLImageElement
        this.pipeSprites = null; // {pipe}
        this.background = null; // {bg}
    }

    setHighContrast(enabled) {
        this.highContrast = !!enabled;
    }

    clear(scrollOffsetX = 0) {
        const g = this.ctx;
        if (this.background?.bg) {
            const img = this.background.bg;
            // scale to cover height and tile horizontally
            const scale = Math.max(
                DESIGN_HEIGHT / img.height,
                DESIGN_WIDTH / img.width
            );
            const drawW = img.width * scale;
            const drawH = img.height * scale;
            const tiles = Math.ceil(DESIGN_WIDTH / drawW) + 2;
            let startX = (-((scrollOffsetX % drawW) + drawW) % drawW) - drawW;
            const dy = (DESIGN_HEIGHT - drawH) / 2;
            for (let i = 0; i < tiles; i++) {
                const dx = startX + i * drawW;
                g.drawImage(img, dx, dy, drawW, drawH);
            }
        } else {
            const grd = g.createLinearGradient(0, 0, 0, DESIGN_HEIGHT);
            grd.addColorStop(0, COLORS.daySkyTop);
            grd.addColorStop(1, COLORS.daySkyBottom);
            g.fillStyle = grd;
            g.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    drawGround() {
        // Ground is now handled by the background image
        // No need to draw a green rectangle
    }

    drawBird(bird, t = 0) {
        const g = this.ctx;
        g.save();
        g.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
        g.rotate(Math.max(-0.5, Math.min(0.6, bird.vy / 600)));
        if (this.currentBirdSkin) {
            let img = this.currentBirdSkin;
            // For evo1 only: use up-frame when flapping upward
            if (
                this.birdSkins &&
                img === this.birdSkins.evo1 &&
                bird.vy < 0 &&
                this.birdSkins.evo1_up
            ) {
                img = this.birdSkins.evo1_up;
            }
            const scaleX = BIRD.width / img.width;
            const scaleY = BIRD.height / img.height;
            const scale = Math.min(scaleX, scaleY);
            const drawW = img.width * scale;
            const drawH = img.height * scale;
            g.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
            // fallback vector bird
            g.fillStyle = this.highContrast ? "#ffffff" : "#fbbf24";
            g.strokeStyle = "#00000055";
            g.lineWidth = 2;
            g.beginPath();
            g.ellipse(
                0,
                0,
                BIRD.width * 0.45,
                BIRD.height * 0.35,
                0,
                0,
                Math.PI * 2
            );
            g.fill();
            g.stroke();
            g.fillStyle = this.highContrast ? "#000" : "#f59e0b";
            const wingYOffset = Math.sin(t * 10) * 6;
            g.beginPath();
            g.ellipse(-6, 6 + wingYOffset, 10, 6, 0, 0, Math.PI * 2);
            g.fill();
        }
        g.restore();
    }

    // Draw a pipe with a single cap and a tiled body (clone lower half only), preserving aspect ratio
    _drawPipeTiled(img, x, y, height, flipY = false) {
        const g = this.ctx;
        const scale = PIPE.width / img.width; // uniform scale to keep pixels square
        const capSrcH = Math.floor(img.height * 0.5); // top half is cap area
        const bodySrcY = capSrcH;
        const bodySrcH = img.height - capSrcH; // lower half is the tileable body
        const destCapH = capSrcH * scale;
        const destBodyUnitH = bodySrcH * scale;

        if (!flipY) {
            // Bottom pipe (upright)
            // Draw cap once at the top
            g.drawImage(
                img,
                0,
                0,
                img.width,
                capSrcH,
                x,
                y,
                PIPE.width,
                destCapH
            );
            // Fill remaining height with tiled body (clone of lower half)
            let drawn = destCapH;
            const epsilon = 0.25; // slight overlap to hide seams
            while (drawn < height - 1e-3) {
                const remaining = height - drawn;
                const dh = Math.min(destBodyUnitH, remaining);
                const ratio = dh / destBodyUnitH;
                const srcH = bodySrcH * ratio;
                g.drawImage(
                    img,
                    0,
                    bodySrcY,
                    img.width,
                    srcH,
                    x,
                    y + drawn - epsilon,
                    PIPE.width,
                    dh + epsilon
                );
                drawn += dh;
            }
        } else {
            // Top pipe (flipped vertically): draw in flipped space so math matches bottom case
            g.save();
            g.translate(x, y + height);
            g.scale(1, -1);
            // Cap at the (visual) bottom after flip
            g.drawImage(
                img,
                0,
                0,
                img.width,
                capSrcH,
                0,
                0,
                PIPE.width,
                destCapH
            );
            let drawn = destCapH;
            const epsilon = 0.25;
            while (drawn < height - 1e-3) {
                const remaining = height - drawn;
                const dh = Math.min(destBodyUnitH, remaining);
                const ratio = dh / destBodyUnitH;
                const srcH = bodySrcH * ratio;
                g.drawImage(
                    img,
                    0,
                    bodySrcY,
                    img.width,
                    srcH,
                    0,
                    drawn - epsilon,
                    PIPE.width,
                    dh + epsilon
                );
                drawn += dh;
            }
            g.restore();
        }
    }

    drawPipes(pipes) {
        const g = this.ctx;
        for (const p of pipes) {
            // Draw sprites at visual positions (no hitbox insets)
            const topHeight = Math.max(0, p.gapCenterY - p.gapSize / 2);
            const bottomY = p.gapCenterY + p.gapSize / 2;
            const bottomHeight = Math.max(0, DESIGN_HEIGHT - bottomY);

            if (this.pipeSprites?.pipe) {
                const img = this.pipeSprites.pipe;
                this._drawPipeTiled(img, p.x, bottomY, bottomHeight, false);
                this._drawPipeTiled(img, p.x, 0, topHeight, true);
                // Optional: visualize precise collider path if available
                if (FLAGS.DEBUG_HITBOX && this.pipeSprites?.pipeCollider) {
                    const path = this.pipeSprites.pipeCollider;
                    const scaleX = PIPE.width / img.width;
                    // Top pipe
                    if (topHeight > 0) {
                        this.ctx.save();
                        this.ctx.translate(p.x, 0);
                        this.ctx.scale(scaleX, topHeight / img.height);
                        this.ctx.strokeStyle = "#00ff88";
                        this.ctx.setLineDash([3, 3]);
                        this.ctx.stroke(path);
                        this.ctx.restore();
                    }
                    // Bottom pipe
                    if (bottomHeight > 0) {
                        this.ctx.save();
                        this.ctx.translate(p.x, bottomY);
                        this.ctx.scale(scaleX, bottomHeight / img.height);
                        this.ctx.strokeStyle = "#00ff88";
                        this.ctx.setLineDash([3, 3]);
                        this.ctx.stroke(path);
                        this.ctx.restore();
                    }
                }
            } else {
                // vector fallback
                g.fillStyle = this.highContrast ? "#fff" : COLORS.pipe;
                g.fillRect(p.x - 4, 0, PIPE.width + 8, topHeight);
                g.fillRect(p.x - 4, bottomY, PIPE.width + 8, bottomHeight);
            }
        }
    }

    // removed dash HUD

    drawCenteredText(text, y, size = 48) {
        const g = this.ctx;
        g.fillStyle = this.highContrast ? "#fff" : "#ffffff";
        g.strokeStyle = "#00000066";
        g.lineWidth = 6;
        g.font = `bold ${size}px 'PokemonClassic', monospace`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.strokeText(text, DESIGN_WIDTH / 2, y);
        g.fillText(text, DESIGN_WIDTH / 2, y);
    }

    // Draw hitbox borders for debugging
    drawHitbox(aabb, color = "#00ff00") {
        if (!FLAGS.DEBUG_HITBOX) return;

        const g = this.ctx;
        g.save();
        g.strokeStyle = color;
        g.lineWidth = 2;
        g.setLineDash([5, 5]); // Dashed line for better visibility
        g.strokeRect(aabb.x, aabb.y, aabb.w, aabb.h);
        g.restore();
    }

    // Draw bird hitbox
    drawBirdHitbox(bird) {
        if (!FLAGS.DEBUG_HITBOX) return;

        const birdBox = bird.getAABB();
        this.drawHitbox(birdBox, "#00ff00");
    }

    // Draw pipe hitboxes
    drawPipeHitboxes(pipes) {
        if (!FLAGS.DEBUG_HITBOX) return;

        for (const pipe of pipes) {
            const { top, bottom } = pipe.getAABBs();
            this.drawHitbox(top, "#ff0000"); // Red for top pipe
            this.drawHitbox(bottom, "#ff0000"); // Red for bottom pipe
        }
    }
}
