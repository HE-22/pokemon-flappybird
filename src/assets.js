export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = (e) => {
            console.error("[assets] failed to load image", src, e);
            reject(e);
        };
        img.src = src;
    });
}

export async function preloadBirdSkins() {
    const [evo1, evo1_up, evo2, evo3] = await Promise.all([
        loadImage("/assets/char/evo1.png"),
        loadImage("/assets/char/evo1_up.png"),
        loadImage("/assets/char/evo2.png"),
        loadImage("/assets/char/evo3.png"),
    ]);
    return { evo1, evo1_up, evo2, evo3 };
}

export async function preloadPipes() {
    const pipe = await loadImage("/assets/obs/pipe.png");
    let pipeCollider = null;
    try {
        const { extractColliderPath2D } = await import(
            "./utils/alphaCollider.js"
        );
        pipeCollider = extractColliderPath2D(pipe, {
            threshold: 10,
            simplifyEpsilon: 1.2,
        });
    } catch (e) {
        console.debug("[assets] collider extraction skipped:", e?.message || e);
    }
    return { pipe, pipeCollider };
}

export async function preloadBackground() {
    const bg = await loadImage("/assets/env/bg.png");
    console.debug("[assets] background loaded", bg.width, bg.height);
    return { bg };
}
