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
            g.fillStyle = this.highContrast ? "#fff" : COLORS.pipe;
            g.fillRect(top.x, top.y, PIPE.width, top.h);
            g.fillRect(bottom.x, bottom.y, PIPE.width, bottom.h);
            g.fillStyle = this.highContrast ? "#000" : COLORS.pipeDark;
            g.fillRect(top.x, top.h - 8, PIPE.width, 8);
            g.fillRect(bottom.x, bottom.y, PIPE.width, 8);
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
