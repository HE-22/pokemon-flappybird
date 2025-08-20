import { FLAGS } from "./config.js";

const STRINGS = {
    en: {
        title: "Flappy Bird",
        tapToPlay: "Tap to Play",
        gameOver: "Game Over",
        score: "Score",
        best: "Best",
        restart: "Restart",
        share: "Share",
        home: "Home",
        settings: "Settings",
        music: "Music",
        sfx: "SFX",
        haptics: "Haptics",
        highContrast: "High contrast UI",
        medalBronze: "Bronze",
        medalSilver: "Silver",
        medalGold: "Gold",
        medalPlatinum: "Platinum",
    },
};

let currentLocale = "en";

export function setLocale(locale) {
    currentLocale = STRINGS[locale] ? locale : "en";
}

export function t(key) {
    const s = STRINGS[currentLocale]?.[key] ?? key;
    if (!FLAGS.PSEUDO_LOC) return s;
    // simple pseudo-localization
    return (
        "⟪" +
        s.replace(
            /[aeiou]/gi,
            (c) =>
                ({
                    a: "à",
                    e: "ë",
                    i: "ï",
                    o: "õ",
                    u: "ü",
                    A: "Å",
                    E: "Ê",
                    I: "Ī",
                    O: "Ø",
                    U: "Û",
                }[c] || c)
        ) +
        "⟫"
    );
}
