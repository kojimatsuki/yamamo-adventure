// Utility functions

function gridToWorld(gx, gz) {
    return {
        x: gx - Math.floor(GRID_COLS / 2),
        z: gz - Math.floor(GRID_ROWS / 2)
    };
}

function worldToGrid(x, z) {
    return {
        gx: Math.round(x + Math.floor(GRID_COLS / 2)),
        gz: Math.round(z + Math.floor(GRID_ROWS / 2))
    };
}

function isValidCell(gx, gz) {
    return gx >= 0 && gx < GRID_COLS && gz >= 0 && gz < GRID_ROWS;
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function isMobile() {
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
        ('ontouchstart' in window && navigator.maxTouchPoints > 0);
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Create a simple 3D text mesh using planes with canvas textures
function createTextSprite(text, fontSize, color, bgColor) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `bold ${fontSize}px Arial`;
    const metrics = ctx.measureText(text);
    const width = Math.ceil(metrics.width) + 20;
    const height = fontSize + 20;
    canvas.width = width;
    canvas.height = height;

    if (bgColor) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);
    }

    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = color || '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(width / 100, height / 100, 1);
    return sprite;
}

// Create 3D text using geometry (simple box-based letters for truly 3D feel)
function create3DText(text, size, color) {
    const group = new THREE.Group();
    const material = new THREE.MeshPhongMaterial({ color: color || 0xffffff, emissive: color ? new THREE.Color(color).multiplyScalar(0.3) : 0x333333 });

    // Use canvas texture on a 3D box for each character approach
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const fontSize = 64;
    ctx.font = `bold ${fontSize}px Arial`;
    const totalWidth = ctx.measureText(text).width;
    canvas.width = Math.ceil(totalWidth) + 20;
    canvas.height = fontSize + 20;

    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = '#' + new THREE.Color(color || 0xffffff).getHexString();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const geo = new THREE.BoxGeometry(
        (canvas.width / canvas.height) * size,
        size,
        size * 0.2
    );
    const mat = new THREE.MeshPhongMaterial({
        map: texture,
        transparent: true,
        emissive: color ? new THREE.Color(color).multiplyScalar(0.2) : 0x111111,
    });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
    return group;
}
