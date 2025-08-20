// Centralized configuration and build flags

export const DESIGN_WIDTH = 540; // 9:16 portrait design
export const DESIGN_HEIGHT = 960;

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
    initialGap: 180,
    minGapByScore: 140, // by score 20
    gapAtScore(score, birdHeight) {
        // Linear interpolate from initialGap at score 0 to minGapByScore at score 20
        const t = Math.min(1, Math.max(0, score / 20));
        const raw = (1 - t) * this.initialGap + t * this.minGapByScore;
        // Guarantee fair gap: never below birdHeight * 3.5
        const fairMin = birdHeight * 3.5;
        return Math.max(raw, fairMin);
    },
    spacing: 260,
    spacingJitter: 10, // ±10
};

export const PIPE = {
    width: 64,
};

export const BIRD = {
    width: 48,
    height: 48,
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
