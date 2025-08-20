import { getSettings } from "./storage.js";

let audioCtx = null;
let musicGain = null;
let sfxGain = null;
let duckTimeout = null;

function ensureCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        musicGain = audioCtx.createGain();
        sfxGain = audioCtx.createGain();
        musicGain.connect(audioCtx.destination);
        sfxGain.connect(audioCtx.destination);
        applySettings();
    }
}

export function resumeAudio() {
    if (!audioCtx) return ensureCtx();
    if (audioCtx.state === "suspended") audioCtx.resume();
}

export function applySettings() {
    const { music, sfx } = getSettings();
    if (musicGain) musicGain.gain.value = music ? 0.25 : 0.0;
    if (sfxGain) sfxGain.gain.value = sfx ? 0.9 : 0.0;
}

function playBeep(freq, durationMs, type = "sine", gainNode = sfxGain) {
    if (!getSettings().sfx) return;
    ensureCtx();
    const now = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, now);
    g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(0.3, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    o.connect(g);
    g.connect(gainNode);
    o.start(now);
    o.stop(now + durationMs / 1000);
}

function duckMusic(ms = 150, amountDb = -3) {
    if (!musicGain) return;
    const base = getSettings().music ? 0.25 : 0;
    const duck = base * Math.pow(10, amountDb / 20);
    musicGain.gain.setTargetAtTime(duck, audioCtx.currentTime, 0.005);
    clearTimeout(duckTimeout);
    duckTimeout = setTimeout(() => {
        musicGain.gain.setTargetAtTime(base, audioCtx.currentTime, 0.02);
    }, ms);
}

export const SFX = {
    flap() {
        playBeep(700, 60, "square");
    },
    pass() {
        playBeep(880, 80, "triangle");
        duckMusic(150, -3);
    },
    hit() {
        playBeep(180, 200, "sawtooth");
        duckMusic(150, -3);
    },
    medal() {
        playBeep(1200, 250, "sine");
    },
    ui() {
        playBeep(500, 50, "triangle");
    },
};
