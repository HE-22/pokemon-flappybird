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
    // Dash timings used by game loop (speed multiplier based dash)
    dashDuration: 0.15, // seconds dash lasts
    dashCooldown: 2.0, // seconds between dashes
};

// Determine hard mode from URL path
const pathName =
    typeof window !== "undefined" ? window.location.pathname || "" : "";
export const HARD_MODE = pathName.replace(/\/+$/, "") === "/hardmode";

// World scroll speed
export const SPEED = {
    base: HARD_MODE ? 220 : 120, // units/s
    ramp(score) {
        if (score >= 30) return HARD_MODE ? 1.2 : 1.1;
        if (score >= 15) return HARD_MODE ? 1.1 : 1.05;
        return 1.0;
    },
    dashMultiplier: 2.0, // speed multiplier while dashing
};

// Pipe and difficulty tuning
export const DIFFICULTY = {
    // Start with small gap and get even smaller in hard mode
    initialGap: HARD_MODE ? 100 : 120,
    minGapByScore: HARD_MODE ? 70 : 80,
    difficultyTargetScore: HARD_MODE ? 20 : 30,
    gapAtScore(score, birdHeight) {
        // Steep progression from small to tiny
        const t = Math.min(1, Math.max(0, score / this.difficultyTargetScore));
        const eased = t * t * t; // cubic easing for steep curve
        const raw = (1 - eased) * this.initialGap + eased * this.minGapByScore;
        // Guarantee fair gap: never below birdHeight * factor
        const fairMinFactor = HARD_MODE ? 1.6 : 2.0;
        const fairMin = birdHeight * fairMinFactor;
        return Math.max(raw, fairMin);
    },
    spacing: HARD_MODE ? 300 : 340,
    spacingJitter: 6, // ±6 for more consistent posts
};

export const PIPE = {
    width: 80, // Increased from 64 to make pipes thicker
};

export const BIRD = {
    width: 48,
    height: 48,
};

// Collision hitbox tightening (in pixels)
export const HITBOX = {
    birdInsetX: 10, // shrink width by 10 px total (5 each side)
    birdInsetY: 10, // shrink height by 10 px total
    // Legacy symmetric inset (kept for backward compatibility)
    pipeInsetX: 28,
    // Preferred: control each side precisely to avoid lateral offset
    pipeInsetLeft: 28,
    pipeInsetRight: 28,
    // Trim at gap ends to avoid extra height near the caps
    pipeInsetYGap: 8,
};

// Optional vertical control for bottom pipe start position and safe margins
export const PIPE_TUNING = {
    // bottomStartY: 800, // Removed to restore variance
    marginTop: 60,
    marginBottom: 150, // Balanced to keep pipes higher but allow variance
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
    DEBUG_HITBOX: params.has("hitbox") || false, // Show green hitbox borders
    PRECISE_COLLISION: params.has("precise") || false,
    GHOST_MODE: params.has("ghost") || false, // Zen-like no-fail
    FPS_OVERLAY: params.has("fps") || false,
    PSEUDO_LOC: params.has("pseudo") || false,
    HARD_MODE,
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
