// Seeded RNG utilities (Mulberry32)

export function hashStringToSeed(input) {
    let h = 1779033703 ^ input.length;
    for (let i = 0; i < input.length; i++) {
        h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^ (h >>> 16)) >>> 0;
}

export class RNG {
    constructor(seed) {
        this.seed = seed >>> 0;
    }

    next() {
        // Mulberry32
        let t = (this.seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    nextRange(min, max) {
        return min + (max - min) * this.next();
    }

    nextInt(min, maxInclusive) {
        return Math.floor(this.nextRange(min, maxInclusive + 1));
    }
}
