// Extract a vector collider from an image's alpha channel using marching squares,
// then simplify with Ramer–Douglas–Peucker.

export function extractColliderPath2D(img, options = {}) {
    const threshold = options.threshold ?? 16; // alpha > threshold considered solid
    const simplifyEpsilon = options.simplifyEpsilon ?? 1.5;

    const off = document.createElement("canvas");
    off.width = img.width;
    off.height = img.height;
    const g = off.getContext("2d");
    g.drawImage(img, 0, 0);
    const { data, width, height } = g.getImageData(0, 0, img.width, img.height);

    const isSolid = (x, y) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return false;
        const idx = (y * width + x) * 4 + 3; // alpha channel
        return data[idx] > threshold;
    };

    // Marching squares to trace the external contour
    const visited = new Set();
    const key = (x, y) => `${x},${y}`;

    // Find a starting solid pixel
    let sx = -1,
        sy = -1;
    outer: for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (isSolid(x, y)) {
                sx = x;
                sy = y;
                break outer;
            }
        }
    }
    if (sx < 0) return new Path2D();

    // Edge-following (clockwise) using simple contour tracing
    // Directions: R, D, L, U
    const dirs = [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1],
    ];
    let dir = 0; // start moving right

    // Start at the leftmost boundary of the first solid pixel
    let x = sx - 1,
        y = sy;
    const points = [];

    // Helper to test if edge between cells crosses solid
    const isInside = (cx, cy) => isSolid(cx, cy);

    // Max steps guard
    const maxSteps = width * height * 8;
    for (let steps = 0; steps < maxSteps; steps++) {
        // Record current corner
        points.push([x, y]);

        // Right-hand rule: try turn right, else straight, else left, else back
        let turned = false;
        for (let k = 0; k < 4; k++) {
            const ndir = (dir + 3 + k) % 4; // try right first
            const [dx, dy] = dirs[ndir];
            // Determine if moving along this edge keeps solid on the right
            const rx = x + (ndir === 0 ? 1 : ndir === 2 ? 0 : 0);
            const ry = y + (ndir === 1 ? 1 : ndir === 3 ? 0 : 0);
            const solidRight = isInside(rx, ry);
            const solidLeft = isInside(rx - 1, ry - 1);
            if (solidRight && !solidLeft) {
                dir = ndir;
                x += dx;
                y += dy;
                turned = true;
                break;
            }
        }
        if (!turned) {
            // Fallback move forward
            const [dx, dy] = dirs[dir];
            x += dx;
            y += dy;
        }
        if (x === sx - 1 && y === sy) break; // closed loop
    }

    const simplified = simplifyRDP(points, simplifyEpsilon);
    const path = new Path2D();
    if (simplified.length) {
        path.moveTo(simplified[0][0], simplified[0][1]);
        for (let i = 1; i < simplified.length; i++) {
            path.lineTo(simplified[i][0], simplified[i][1]);
        }
        path.closePath();
    }
    return path;
}

// Ramer–Douglas–Peucker simplification
function simplifyRDP(points, epsilon) {
    if (points.length < 3) return points.slice();
    const dmax = { d: 0, i: 0 };
    const [p0x, p0y] = points[0];
    const [p1x, p1y] = points[points.length - 1];
    for (let i = 1; i < points.length - 1; i++) {
        const d = perpendicularDistance(points[i], [p0x, p0y], [p1x, p1y]);
        if (d > dmax.d) {
            dmax.d = d;
            dmax.i = i;
        }
    }
    if (dmax.d > epsilon) {
        const rec1 = simplifyRDP(points.slice(0, dmax.i + 1), epsilon);
        const rec2 = simplifyRDP(points.slice(dmax.i), epsilon);
        return rec1.slice(0, -1).concat(rec2);
    }
    return [points[0], points[points.length - 1]];
}

function perpendicularDistance(p, a, b) {
    const [px, py] = p;
    const [ax, ay] = a;
    const [bx, by] = b;
    const dx = bx - ax;
    const dy = by - ay;
    if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
    const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
    const qx = ax + t * dx;
    const qy = ay + t * dy;
    return Math.hypot(px - qx, py - qy);
}
