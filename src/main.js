import {
    DESIGN_WIDTH,
    DESIGN_HEIGHT,
    INPUT,
    FLAGS,
    PHYSICS,
    BIRD,
} from "./config.js";
import { RNG, hashStringToSeed } from "./utils/rng.js";
import { Bird } from "./physics.js";
import { World } from "./world.js";
import { Renderer } from "./render.js";
import {
    SFX,
    resumeAudio,
    applySettings,
    playMusic,
    stopMusic,
} from "./audio.js";
import { tapLight, hitHeavy } from "./haptics.js";
import {
    getHighScore,
    setHighScore,
    getSettings,
    setSettings,
    bumpSessionCount,
    getSessionCount,
} from "./storage.js";
import { t, setLocale } from "./localization.js";
import { preloadBirdSkins, preloadPipes, preloadBackground } from "./assets.js";

// Canvas scaling / letterboxing for portrait 9:16
const canvas = document.getElementById("game");
const g = canvas.getContext("2d");
const renderer = new Renderer(canvas);
let skins = null;
let currentSkinName = "evo1";

function fitCanvas() {
    const root = document.querySelector(".root");
    const pr = window.devicePixelRatio || 1;
    const w = root.clientWidth;
    const h = root.clientHeight;
    const targetAspect = DESIGN_WIDTH / DESIGN_HEIGHT;
    let drawW = w;
    let drawH = Math.floor(w / targetAspect);
    if (drawH > h) {
        drawH = h;
        drawW = Math.floor(h * targetAspect);
    }
    canvas.style.width = `${drawW}px`;
    canvas.style.height = `${drawH}px`;
    canvas.width = Math.floor(DESIGN_WIDTH * pr);
    canvas.height = Math.floor(DESIGN_HEIGHT * pr);
    g.setTransform(pr, 0, 0, pr, 0, 0);
}
window.addEventListener("resize", fitCanvas);
fitCanvas();

// UI refs
const ui = {
    hudScore: document.getElementById("hudScore"),
    titlePanel: document.getElementById("titlePanel"),
    gameOverPanel: document.getElementById("gameOverPanel"),
    settingsPanel: document.getElementById("settingsPanel"),
    btnPlay: document.getElementById("btnPlay"),
    btnSkins: document.getElementById("btnSkins"),
    btnLeaderboard: document.getElementById("btnLeaderboard"),
    btnSettings: document.getElementById("btnSettings"),
    btnSettingsClose: document.getElementById("btnSettingsClose"),
    btnRestart: document.getElementById("btnRestart"),
    btnShare: document.getElementById("btnShare"),
    btnHome: document.getElementById("btnHome"),
    fpsOverlay: document.getElementById("fpsOverlay"),
    titleText: document.getElementById("titleText"),
    subtitleText: document.getElementById("subtitleText"),
    finalScore: document.getElementById("finalScore"),
    bestScore: document.getElementById("bestScore"),
    medalText: document.getElementById("medalText"),
    toggleMusic: document.getElementById("toggleMusic"),
    toggleSfx: document.getElementById("toggleSfx"),
    toggleHaptics: document.getElementById("toggleHaptics"),
    toggleHighContrast: document.getElementById("toggleHighContrast"),
};

// Localization init
setLocale("en");
ui.titleText.textContent = t("title");
ui.subtitleText.textContent = t("tapToPlay");
ui.btnSettings.textContent = t("settings");
ui.btnRestart.textContent = t("restart");
ui.btnShare.textContent = t("share");
ui.btnHome.textContent = t("home");
ui.gameOverPanel.querySelector("h2").textContent = t("gameOver");
ui.toggleMusic.nextSibling.textContent = " Music";
ui.toggleSfx.nextSibling.textContent = " SFX";
ui.toggleHaptics.nextSibling.textContent = " Haptics";
ui.toggleHighContrast.nextSibling.textContent = " High contrast UI";

// Settings init
const settings = getSettings();
ui.toggleMusic.checked = settings.music;
ui.toggleSfx.checked = settings.sfx;
ui.toggleHaptics.checked = settings.haptics;
ui.toggleHighContrast.checked = settings.highContrast;
renderer.setHighContrast(settings.highContrast);
applySettings();

ui.toggleMusic.addEventListener("change", () => {
    setSettings({ music: ui.toggleMusic.checked });
    applySettings();
    SFX.ui();
});
ui.toggleSfx.addEventListener("change", () => {
    setSettings({ sfx: ui.toggleSfx.checked });
    applySettings();
});
ui.toggleHaptics.addEventListener("change", () => {
    setSettings({ haptics: ui.toggleHaptics.checked });
    SFX.ui();
});
ui.toggleHighContrast.addEventListener("change", () => {
    const v = ui.toggleHighContrast.checked;
    setSettings({ highContrast: v });
    renderer.setHighContrast(v);
    SFX.ui();
});

// Game state
const State = { Boot: 0, Title: 1, Run: 2, Dying: 3, GameOver: 4 };
let state = State.Boot;
let seed = 0;
let rng = null;
let world = null;
let bird = null;
let score = 0;
let inputBuffered = false;
let lastInputTime = -1;
let lastFrameTime = performance.now();
let accumulator = 0;
const fixedDt = 1 / PHYSICS.fixedHz;
let animT = 0; // for wing animation

function setState(next) {
    state = next;
    ui.titlePanel.style.display = next === State.Title ? "block" : "none";
    ui.gameOverPanel.style.display = next === State.GameOver ? "block" : "none";
    ui.settingsPanel.style.display = "none";
}

function newRun(newSeed) {
    seed = newSeed ?? Math.floor(Math.random() * 2 ** 32) >>> 0;
    rng = new RNG(seed);
    world = new World(rng);
    world.reset();
    const startY = DESIGN_HEIGHT * 0.45;
    bird = new Bird(DESIGN_WIDTH * 0.28, startY);
    score = 0;
    ui.hudScore.textContent = "0";
    accumulator = 0;
    animT = 0;
    currentSkinName = "evo1";
    renderer.currentBirdSkin = skins?.evo1 || null;
}

function computeMedalText(s) {
    if (s >= 50) return t("medalPlatinum");
    if (s >= 30) return t("medalGold");
    if (s >= 20) return t("medalSilver");
    if (s >= 10) return t("medalBronze");
    return "";
}

// Input handling with 50 ms buffer
function bufferInput() {
    inputBuffered = true;
    lastInputTime = performance.now();
    resumeAudio();
    SFX.ui();
}

window.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    bufferInput();
});
window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") bufferInput();
});

ui.btnPlay.addEventListener("click", () => {
    bufferInput();
    startRun();
});
ui.btnRestart.addEventListener("click", () => {
    bufferInput();
    startRun();
});
ui.btnHome.addEventListener("click", () => {
    bufferInput();
    setState(State.Title);
});
ui.btnSettings.addEventListener("click", () => {
    ui.settingsPanel.style.display = "block";
    SFX.ui();
});
ui.btnSettingsClose.addEventListener("click", () => {
    ui.settingsPanel.style.display = "none";
    SFX.ui();
});
ui.btnShare.addEventListener("click", async () => {
    SFX.ui();
    try {
        await navigator.share?.({
            title: "Flappy Bird",
            text: `Score: ${score}`,
            url: location.href,
        });
    } catch {}
});

function startRun() {
    const daily = false; // placeholder for Daily Challenge mode
    const runSeed = daily
        ? hashStringToSeed(new Date().toISOString().slice(0, 10))
        : (Math.random() * 2 ** 32) >>> 0;
    newRun(runSeed);
    setState(State.Run);
    resumeAudio();
    playMusic();
}

// Session count for ad gating, analytics stub
const sessions = bumpSessionCount();

// FPS overlay
ui.fpsOverlay.style.display = FLAGS.FPS_OVERLAY ? "block" : "none";
let fpsSamples = [];
function updateFps(dt) {
    const fps = 1 / dt;
    fpsSamples.push(fps);
    if (fpsSamples.length > 30) fpsSamples.shift();
    const avg = fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length;
    ui.fpsOverlay.textContent = `FPS: ${avg.toFixed(0)}`;
}

// Main loop with fixed-timestep physics
function loop(now) {
    const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
    lastFrameTime = now;
    accumulator += dt;
    animT += dt;
    if (FLAGS.FPS_OVERLAY) updateFps(dt);

    // Process buffered input with 50 ms window at physics boundary
    while (accumulator >= fixedDt) {
        if (state === State.Run) {
            if (
                inputBuffered &&
                performance.now() - lastInputTime <= INPUT.bufferMs
            ) {
                bird.flap();
                SFX.flap();
                tapLight();
            }
            inputBuffered = false;

            bird.step(fixedDt);
            world.spawnIfNeeded(bird.height);
            world.step(fixedDt, score);

            const hit = world.checkScoreAndCollisions(
                bird,
                () => {
                    score += 1;
                    ui.hudScore.textContent = String(score);
                    SFX.pass();
                    // Skin upgrades at 10 and 20
                    if (skins) {
                        if (score >= 20 && currentSkinName !== "evo3") {
                            currentSkinName = "evo3";
                            renderer.currentBirdSkin = skins.evo3;
                        } else if (score >= 10 && currentSkinName === "evo1") {
                            currentSkinName = "evo2";
                            renderer.currentBirdSkin = skins.evo2;
                        }
                    }
                },
                () => {
                    /* onHit handled below */
                },
                FLAGS.GHOST_MODE
            );
            if (hit) {
                SFX.hit();
                SFX.death();
                hitHeavy();
                // Nose dive: set vertical velocity downwards and small forward tilt via vy
                bird.vy = Math.max(bird.vy, 400);
                setState(State.Dying);
                stopMusic();
            }
        } else if (state === State.Dying) {
            // Continue falling each fixed step until ground
            bird.step(fixedDt);
            if (bird.y + bird.height >= DESIGN_HEIGHT - 40) {
                bird.y = DESIGN_HEIGHT - 40 - bird.height;
                setHighScore(score);
                ui.finalScore.textContent = `${t("score")}: ${score}`;
                ui.bestScore.textContent = `${t("best")}: ${getHighScore()}`;
                ui.medalText.textContent = computeMedalText(score);
                setState(State.GameOver);
            }
        }
        accumulator -= fixedDt;
    }

    // Render
    renderer.clear();
    if (state === State.Boot || state === State.Title) {
        // idle hover bird
        if (!bird) bird = new Bird(DESIGN_WIDTH * 0.28, DESIGN_HEIGHT * 0.45);
        bird.y = DESIGN_HEIGHT * 0.45 + Math.sin(now / 400) * 6;
        renderer.drawBird(bird, animT);
        renderer.drawGround();
    } else if (
        state === State.Run ||
        state === State.Dying ||
        state === State.GameOver
    ) {
        renderer.drawPipes(world.pipes);
        renderer.drawBird(bird, animT);
        renderer.drawGround();
    }

    requestAnimationFrame(loop);
}

// Boot → Title and preload assets
Promise.all([preloadBirdSkins(), preloadPipes(), preloadBackground()])
    .then(([loadedSkins, loadedPipes, loadedBg]) => {
        skins = loadedSkins;
        renderer.birdSkins = skins;
        renderer.currentBirdSkin = skins.evo1;
        renderer.pipeSprites = loadedPipes;
        renderer.background = loadedBg;
        console.debug("[assets] bg ready", !!renderer.background?.bg);
    })
    .catch(() => {
        // proceed without assets
    })
    .finally(() => {
        setState(State.Title);
        requestAnimationFrame(loop);
    });
