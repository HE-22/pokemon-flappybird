export function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => resolve(img);
        img.onerror = reject;
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
    return { pipe };
}
