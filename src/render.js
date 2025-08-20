import { COLORS, DESIGN_WIDTH, DESIGN_HEIGHT, PIPE, BIRD } from "./config.js";

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.highContrast = false;
        this.birdSkins = null; // {evo1, evo2, evo3}
        this.currentBirdSkin = null; // HTMLImageElement
    }

    setHighContrast(enabled) {
        this.highContrast = !!enabled;
    }

    clear() {
        const g = this.ctx;
        const grd = g.createLinearGradient(0, 0, 0, DESIGN_HEIGHT);
        grd.addColorStop(0, COLORS.daySkyTop);
        grd.addColorStop(1, COLORS.daySkyBottom);
        g.fillStyle = grd;
        g.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGround() {
        const g = this.ctx;
        g.fillStyle = COLORS.ground;
        g.fillRect(0, DESIGN_HEIGHT - 40, DESIGN_WIDTH, 40);
    }

    drawBird(bird, t = 0) {
        const g = this.ctx;
        g.save();
        g.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
        g.rotate(Math.max(-0.5, Math.min(0.6, bird.vy / 600)));
        if (this.currentBirdSkin) {
            const img = this.currentBirdSkin;
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

    drawPipes(pipes) {
        const g = this.ctx;
        for (const p of pipes) {
            const { top, bottom } = p.getAABBs();
            // Pipe bodies
            g.fillStyle = this.highContrast ? "#fff" : COLORS.pipe;
            g.fillRect(top.x - 4, top.y, PIPE.width + 8, top.h); // slight outline pad
            g.fillRect(bottom.x - 4, bottom.y, PIPE.width + 8, bottom.h);

            // Pokémon-themed details: stripes and top caps resembling Pokéball motif
            const capHeight = 20;
            const stripeH = 6;
            // Top cap
            g.fillStyle = this.highContrast ? "#000" : COLORS.pipeDark;
            g.fillRect(
                top.x - 6,
                top.h - capHeight,
                PIPE.width + 12,
                capHeight
            );
            // Bottom cap
            g.fillRect(bottom.x - 6, bottom.y, PIPE.width + 12, capHeight);

            // Red stripe near cap
            g.fillStyle = "#ef4444";
            g.fillRect(
                top.x - 6,
                top.h - capHeight - stripeH - 2,
                PIPE.width + 12,
                stripeH
            );
            g.fillRect(
                bottom.x - 6,
                bottom.y + capHeight + 2,
                PIPE.width + 12,
                stripeH
            );

            // Pokéball circle detail on caps
            g.fillStyle = "#111827";
            const circleR = 6;
            g.beginPath();
            g.arc(
                top.x + PIPE.width / 2,
                top.h - capHeight / 2,
                circleR,
                0,
                Math.PI * 2
            );
            g.fill();
            g.beginPath();
            g.arc(
                bottom.x + PIPE.width / 2,
                bottom.y + capHeight / 2,
                circleR,
                0,
                Math.PI * 2
            );
            g.fill();
        }
    }

    drawCenteredText(text, y, size = 48) {
        const g = this.ctx;
        g.fillStyle = this.highContrast ? "#fff" : "#ffffff";
        g.strokeStyle = "#00000066";
        g.lineWidth = 6;
        g.font = `bold ${size}px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.strokeText(text, DESIGN_WIDTH / 2, y);
        g.fillText(text, DESIGN_WIDTH / 2, y);
    }
}
