// Map generation and management
const GameMap = {
    grid: [],
    meshes: [],
    groundMesh: null,
    wallGroup: null,
    scene: null,
    world: 1,

    init(scene) {
        this.scene = scene;
        this.wallGroup = new THREE.Group();
        scene.add(this.wallGroup);
    },

    generate(world, stage, softBlockRatio) {
        this.world = world;
        this.clear();
        const theme = WORLD_THEMES[world];

        // Initialize empty grid
        this.grid = [];
        for (let z = 0; z < GRID_ROWS; z++) {
            this.grid[z] = [];
            for (let x = 0; x < GRID_COLS; x++) {
                this.grid[z][x] = CELL_EMPTY;
            }
        }

        // Place hard blocks (odd rows and columns, classic pattern)
        for (let z = 0; z < GRID_ROWS; z++) {
            for (let x = 0; x < GRID_COLS; x++) {
                // Border walls
                if (z === 0 || z === GRID_ROWS - 1 || x === 0 || x === GRID_COLS - 1) {
                    this.grid[z][x] = CELL_HARD;
                }
                // Interior pillars (even row, even col)
                else if (z % 2 === 0 && x % 2 === 0) {
                    this.grid[z][x] = CELL_HARD;
                }
            }
        }

        // Place soft blocks
        const ratio = softBlockRatio || 0.35;
        for (let z = 1; z < GRID_ROWS - 1; z++) {
            for (let x = 1; x < GRID_COLS - 1; x++) {
                if (this.grid[z][x] !== CELL_EMPTY) continue;
                // Keep player start area clear (top-left corner)
                if ((z === 1 && x === 1) || (z === 1 && x === 2) || (z === 2 && x === 1)) continue;
                if (Math.random() < ratio) {
                    this.grid[z][x] = CELL_SOFT;
                }
            }
        }

        this._buildMeshes(theme);
    },

    generateBossArena(world) {
        this.world = world;
        this.clear();
        const theme = WORLD_THEMES[world];

        // Initialize empty grid
        this.grid = [];
        for (let z = 0; z < GRID_ROWS; z++) {
            this.grid[z] = [];
            for (let x = 0; x < GRID_COLS; x++) {
                this.grid[z][x] = CELL_EMPTY;
            }
        }

        // Border walls only
        for (let z = 0; z < GRID_ROWS; z++) {
            for (let x = 0; x < GRID_COLS; x++) {
                if (z === 0 || z === GRID_ROWS - 1 || x === 0 || x === GRID_COLS - 1) {
                    this.grid[z][x] = CELL_HARD;
                }
            }
        }

        // A few interior pillars for cover
        const pillars = [[4, 3], [4, 7], [8, 3], [8, 7], [6, 5]];
        pillars.forEach(([x, z]) => {
            if (isValidCell(x, z)) this.grid[z][x] = CELL_HARD;
        });

        // Some soft blocks
        const softPositions = [[3, 2], [9, 2], [3, 8], [9, 8], [6, 3], [6, 7]];
        softPositions.forEach(([x, z]) => {
            if (isValidCell(x, z)) this.grid[z][x] = CELL_SOFT;
        });

        this._buildMeshes(theme);
    },

    _buildMeshes(theme) {
        // Ground
        const groundGeo = new THREE.PlaneGeometry(GRID_COLS, GRID_ROWS);
        const groundMat = new THREE.MeshPhongMaterial({ color: theme.ground });
        this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
        this.groundMesh.rotation.x = -Math.PI / 2;
        this.groundMesh.receiveShadow = true;
        this.wallGroup.add(this.groundMesh);

        // Build blocks
        const hardGeo = new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE);
        const hardMat = new THREE.MeshPhongMaterial({ color: theme.hardBlock });
        const softGeo = new THREE.BoxGeometry(CELL_SIZE * 0.95, CELL_SIZE * 0.95, CELL_SIZE * 0.95);
        const softMat = new THREE.MeshPhongMaterial({ color: theme.softBlock });

        for (let z = 0; z < GRID_ROWS; z++) {
            for (let x = 0; x < GRID_COLS; x++) {
                const cell = this.grid[z][x];
                if (cell === CELL_EMPTY) continue;

                const pos = gridToWorld(x, z);
                let mesh;
                if (cell === CELL_HARD) {
                    mesh = new THREE.Mesh(hardGeo, hardMat);
                } else {
                    mesh = new THREE.Mesh(softGeo, softMat.clone());
                }
                mesh.position.set(pos.x, 0.5, pos.z);
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                mesh.userData = { gx: x, gz: z, type: cell };
                this.wallGroup.add(mesh);
                this.meshes.push(mesh);
            }
        }
    },

    clear() {
        this.meshes.forEach(m => {
            this.wallGroup.remove(m);
            if (m.geometry) m.geometry.dispose();
            if (m.material) {
                if (m.material.map) m.material.map.dispose();
                m.material.dispose();
            }
        });
        if (this.groundMesh) {
            this.wallGroup.remove(this.groundMesh);
            this.groundMesh.geometry.dispose();
            this.groundMesh.material.dispose();
            this.groundMesh = null;
        }
        this.meshes = [];
        this.grid = [];
    },

    removeSoftBlock(gx, gz) {
        if (!isValidCell(gx, gz)) return false;
        if (this.grid[gz][gx] !== CELL_SOFT) return false;
        this.grid[gz][gx] = CELL_EMPTY;
        // Remove mesh
        const idx = this.meshes.findIndex(m => m.userData.gx === gx && m.userData.gz === gz && m.userData.type === CELL_SOFT);
        if (idx >= 0) {
            const mesh = this.meshes[idx];
            this.wallGroup.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
            this.meshes.splice(idx, 1);
        }
        return true;
    },

    isWalkable(gx, gz) {
        if (!isValidCell(gx, gz)) return false;
        return this.grid[gz][gx] === CELL_EMPTY;
    },

    isSolid(gx, gz) {
        if (!isValidCell(gx, gz)) return true;
        return this.grid[gz][gx] !== CELL_EMPTY;
    },

    isHard(gx, gz) {
        if (!isValidCell(gx, gz)) return true;
        return this.grid[gz][gx] === CELL_HARD;
    },

    isSoft(gx, gz) {
        if (!isValidCell(gx, gz)) return false;
        return this.grid[gz][gx] === CELL_SOFT;
    },

    // Get gimmick meshes for world-specific features
    addGimmick(type, gx, gz, data) {
        const pos = gridToWorld(gx, gz);
        let mesh;
        if (type === 'lava') {
            const geo = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE);
            const mat = new THREE.MeshPhongMaterial({ color: 0xff4400, emissive: 0xff2200, transparent: true, opacity: 0.8 });
            mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(pos.x, 0.02, pos.z);
        } else if (type === 'ice') {
            const geo = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE);
            const mat = new THREE.MeshPhongMaterial({ color: 0xaaddff, emissive: 0x335577, transparent: true, opacity: 0.6 });
            mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(pos.x, 0.02, pos.z);
        } else if (type === 'conveyor') {
            const geo = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE);
            const mat = new THREE.MeshPhongMaterial({ color: 0x888888, emissive: 0x444444 });
            mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(pos.x, 0.02, pos.z);
        } else if (type === 'electric') {
            const geo = new THREE.PlaneGeometry(CELL_SIZE, CELL_SIZE);
            const mat = new THREE.MeshPhongMaterial({ color: 0xffff00, emissive: 0xaaaa00, transparent: true, opacity: 0.5 });
            mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(pos.x, 0.02, pos.z);
        } else if (type === 'warp') {
            const geo = new THREE.RingGeometry(0.2, 0.4, 16);
            const mat = new THREE.MeshPhongMaterial({ color: 0x9900ff, emissive: 0x6600aa, side: THREE.DoubleSide });
            mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(pos.x, 0.05, pos.z);
        }
        if (mesh) {
            mesh.userData = { gimmickType: type, gx, gz, ...data };
            this.wallGroup.add(mesh);
            this.meshes.push(mesh);
            return mesh;
        }
        return null;
    },
};
