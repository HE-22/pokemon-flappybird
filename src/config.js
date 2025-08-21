// Centralized configuration and build flags

export const DESIGN_WIDTH = 540; // 9:16 portrait design
export const DESIGN_HEIGHT = 960;
export const GROUND_LEVEL = 870; // Ground level based on background image

// Physics constants (units are logical pixels)
export const PHYSICS = {
    fixedHz: 60,
    gravity: 1200, // units/s^2 downward
    flapVelocity: -280, // units/s upward (negative y = up)
    terminalVelocity: 900, // units/s down cap
};

// World scroll speed
export const SPEED = {
    base: 120, // units/s
    ramp(score) {
        if (score >= 30) return 1.1;
        if (score >= 15) return 1.05;
        return 1.0;
    },
};

// Pipe and difficulty tuning
export const DIFFICULTY = {
    // Start easier and wider, shrink slowly
    initialGap: 240,
    minGapByScore: 160, // target by difficultyTargetScore
    difficultyTargetScore: 70,
    gapAtScore(score, birdHeight) {
        // Ease-in (quadratic): small change early, ramps later
        const t = Math.min(1, Math.max(0, score / this.difficultyTargetScore));
        const eased = t * t;
        const raw = (1 - eased) * this.initialGap + eased * this.minGapByScore;
        // Guarantee fair gap: never below birdHeight * 3.5
        const fairMin = birdHeight * 3.5;
        return Math.max(raw, fairMin);
    },
    spacing: 340,
    spacingJitter: 20, // ±20 for more varied pipe spacing
};

export const PIPE = {
    width: 64,
};

export const BIRD = {
    width: 48,
    height: 48,
};

// Collision hitbox tightening (in pixels)
export const HITBOX = {
    birdInsetX: 10, // shrink width by 10 px total (5 each side)
    birdInsetY: 10, // shrink height by 10 px total
    pipeInsetX: 8, // shrink pipe collision width to feel fair
};

// Optional vertical control for bottom pipe start position and safe margins
export const PIPE_TUNING = {
    // bottomStartY: 800, // Removed fixed positioning for more variation
    marginTop: 60,
    marginBottom: 80,
};

export const INPUT = {
    bufferMs: 50,
};

// Build-time flags emulated via URL/search params
const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
);
export const FLAGS = {
    DEBUG_MENU: params.has("debug") || false,
    GHOST_MODE: params.has("ghost") || false, // Zen-like no-fail
    FPS_OVERLAY: params.has("fps") || false,
    PSEUDO_LOC: params.has("pseudo") || false,
};

export const COLORS = {
    daySkyTop: "#86c5f8",
    daySkyBottom: "#bfe6ff",
    duskSkyTop: "#6279c6",
    duskSkyBottom: "#b0b9e6",
    nightSkyTop: "#0b1024",
    nightSkyBottom: "#1c2b4d",
    ground: "#7cb342",
    pipe: "#6cc04a",
    pipeDark: "#4d8c35",
    white: "#ffffff",
};
