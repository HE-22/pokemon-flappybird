import { getSettings } from "./storage.js";

export function vibrate(pattern) {
    if (!getSettings().haptics) return;
    if (navigator.vibrate) navigator.vibrate(pattern);
}

export function tapLight() {
    vibrate(10);
}

export function hitHeavy() {
    vibrate([10, 40, 10]);
}
