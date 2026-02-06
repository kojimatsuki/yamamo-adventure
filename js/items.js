// Item system
const ItemManager = {
    items: [],
    scene: null,

    init(scene) {
        this.scene = scene;
        this.items = [];
    },

    spawnFromBlock(gx, gz) {
        const rand = Math.random();
        let type = null;
        for (const entry of ITEM_DROP_TABLE) {
            if (rand < entry.rate) {
                type = entry.type;
                break;
            }
        }
        if (!type) return null;

        const pos = gridToWorld(gx, gz);
        const mesh = this._createItemMesh(type);
        mesh.position.set(pos.x, 0.3, pos.z);
        this.scene.add(mesh);

        const item = {
            type,
            gx, gz,
            mesh,
            collected: false,
            animTime: Math.random() * Math.PI * 2,
        };
        this.items.push(item);
        return item;
    },

    _createItemMesh(type) {
        const group = new THREE.Group();
        const color = ITEM_COLORS[type] || 0xffffff;

        // Base: glowing cube
        const geo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const mat = new THREE.MeshPhongMaterial({
            color,
            emissive: new THREE.Color(color).multiplyScalar(0.4),
            transparent: true,
            opacity: 0.9,
        });
        const cube = new THREE.Mesh(geo, mat);
        group.add(cube);

        // Label on top using a small 3D element
        const label = ITEM_LABELS[type];
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#' + new THREE.Color(color).getHexString();
        ctx.fillRect(0, 0, 64, 64);
        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 32, 32);
        const tex = new THREE.CanvasTexture(canvas);
        const topGeo = new THREE.PlaneGeometry(0.3, 0.3);
        const topMat = new THREE.MeshPhongMaterial({ map: tex, transparent: true });
        const topMesh = new THREE.Mesh(topGeo, topMat);
        topMesh.rotation.x = -Math.PI / 2;
        topMesh.position.y = 0.21;
        group.add(topMesh);

        return group;
    },

    update(dt) {
        for (const item of this.items) {
            if (item.collected) continue;
            item.animTime += dt;
            // Floating and rotating animation
            item.mesh.position.y = 0.3 + Math.sin(item.animTime * 2) * 0.1;
            item.mesh.rotation.y += dt * 2;
        }
    },

    checkPickup(px, pz) {
        const pg = worldToGrid(px, pz);
        for (const item of this.items) {
            if (item.collected) continue;
            if (item.gx === pg.gx && item.gz === pg.gz) {
                item.collected = true;
                this.scene.remove(item.mesh);
                return item.type;
            }
        }
        return null;
    },

    clear() {
        this.items.forEach(item => {
            if (item.mesh) this.scene.remove(item.mesh);
        });
        this.items = [];
    },
};
