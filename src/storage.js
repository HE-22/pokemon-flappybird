const STORAGE_KEYS = {
    highScore: "flappy.highScore",
    settings: "flappy.settings",
    sessionCount: "flappy.sessionCount",
};

export function getHighScore() {
    return Number(localStorage.getItem(STORAGE_KEYS.highScore) || "0") || 0;
}

export function setHighScore(score) {
    const prev = getHighScore();
    if (score > prev)
        localStorage.setItem(STORAGE_KEYS.highScore, String(score));
}

const defaultSettings = {
    music: true,
    sfx: true,
    haptics: true,
    highContrast: false,
};

export function getSettings() {
    try {
        return {
            ...defaultSettings,
            ...JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || "{}"),
        };
    } catch {
        return { ...defaultSettings };
    }
}

export function setSettings(patch) {
    const merged = { ...getSettings(), ...patch };
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(merged));
    return merged;
}

export function bumpSessionCount() {
    const n =
        Number(localStorage.getItem(STORAGE_KEYS.sessionCount) || "0") || 0;
    const next = n + 1;
    localStorage.setItem(STORAGE_KEYS.sessionCount, String(next));
    return next;
}

export function getSessionCount() {
    return Number(localStorage.getItem(STORAGE_KEYS.sessionCount) || "0") || 0;
}
