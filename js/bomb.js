// Bomb system
const BombManager = {
    bombs: [],
    explosions: [],
    scene: null,

    init(scene) {
        this.scene = scene;
        this.bombs = [];
        this.explosions = [];
    },

    placeBomb(gx, gz, fireRange, penetrate, isPlayerBomb) {
        // Check if bomb already at this position
        if (this.bombs.some(b => b.gx === gx && b.gz === gz)) return false;

        const pos = gridToWorld(gx, gz);
        const group = new THREE.Group();

        // Bomb body
        const bombGeo = new THREE.SphereGeometry(0.35, 12, 10);
        const bombMat = new THREE.MeshPhongMaterial({ color: 0x222222, emissive: 0x111111 });
        const bombMesh = new THREE.Mesh(bombGeo, bombMat);
        bombMesh.position.y = 0.35;
        bombMesh.castShadow = true;
        group.add(bombMesh);

        // Fuse
        const fuseGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 6);
        const fuseMat = new THREE.MeshPhongMaterial({ color: 0xffaa00, emissive: 0xff6600 });
        const fuse = new THREE.Mesh(fuseGeo, fuseMat);
        fuse.position.y = 0.7;
        group.add(fuse);

        group.position.set(pos.x, 0, pos.z);
        this.scene.add(group);

        const bomb = {
            gx, gz,
            mesh: group,
            bombMesh,
            timer: BOMB_TIMER,
            fireRange: fireRange,
            penetrate: penetrate || false,
            exploded: false,
            isPlayerBomb: isPlayerBomb || false,
            // Player can walk through this bomb until they fully leave it
            playerPassthrough: isPlayerBomb || false,
        };
        this.bombs.push(bomb);
        SoundManager.playBombPlace();
        return true;
    },

    // Check if player has left a passthrough bomb and revoke passthrough
    updatePassthrough(playerX, playerZ) {
        const margin = 0.35;
        for (const bomb of this.bombs) {
            if (!bomb.playerPassthrough || bomb.exploded) continue;
            const bpos = gridToWorld(bomb.gx, bomb.gz);
            // Check if player's bounding box no longer overlaps bomb cell
            const overlapX = Math.abs(playerX - bpos.x) < (0.5 + margin);
            const overlapZ = Math.abs(playerZ - bpos.z) < (0.5 + margin);
            if (!overlapX || !overlapZ) {
                bomb.playerPassthrough = false;
            }
        }
    },

    update(dt, map, onExplodeCell) {
        // Update bomb animations
        for (const bomb of this.bombs) {
            if (bomb.exploded) continue;
            bomb.timer -= dt;
            // Pulsing animation
            const scale = 1 + Math.sin(bomb.timer * BOMB_BOUNCE_SPEED) * 0.1;
            bomb.bombMesh.scale.set(scale, scale, scale);
            // Color change as timer decreases
            const urgency = 1 - (bomb.timer / BOMB_TIMER);
            bomb.bombMesh.material.emissive.setRGB(urgency * 0.5, 0, 0);

            if (bomb.timer <= 0) {
                this._explode(bomb, map, onExplodeCell);
            }
        }

        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const exp = this.explosions[i];
            exp.timer -= dt;
            // Animate explosion
            exp.meshes.forEach(m => {
                const t = 1 - (exp.timer / exp.duration);
                m.material.opacity = 1 - t;
                m.scale.y = 1 + t * 0.5;
            });
            if (exp.timer <= 0) {
                exp.meshes.forEach(m => {
                    this.scene.remove(m);
                    m.geometry.dispose();
                    m.material.dispose();
                });
                this.explosions.splice(i, 1);
            }
        }

        // Remove exploded bombs
        this.bombs = this.bombs.filter(b => {
            if (b.exploded) {
                this.scene.remove(b.mesh);
                return false;
            }
            return true;
        });
    },

    _explode(bomb, map, onExplodeCell) {
        if (bomb.exploded) return;
        bomb.exploded = true;
        if (bomb.isPlayerBomb) {
            Player.activeBombs = Math.max(0, Player.activeBombs - 1);
        }

        SoundManager.playExplosion();

        const cells = this._getExplosionCells(bomb.gx, bomb.gz, bomb.fireRange, bomb.penetrate, map);
        const meshes = [];

        cells.forEach(cell => {
            const pos = gridToWorld(cell.gx, cell.gz);
            const geo = new THREE.BoxGeometry(CELL_SIZE * 0.9, CELL_SIZE * 0.9, CELL_SIZE * 0.9);
            const mat = new THREE.MeshPhongMaterial({
                color: 0xff6600,
                emissive: 0xff3300,
                transparent: true,
                opacity: 1,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(pos.x, 0.5, pos.z);
            this.scene.add(mesh);
            meshes.push(mesh);

            if (onExplodeCell) onExplodeCell(cell.gx, cell.gz);
        });

        this.explosions.push({
            cells,
            meshes,
            timer: 0.5,
            duration: 0.5,
        });

        // Chain reaction: explode other bombs in blast
        cells.forEach(cell => {
            const chainBomb = this.bombs.find(b => b.gx === cell.gx && b.gz === cell.gz && !b.exploded);
            if (chainBomb) {
                this._explode(chainBomb, map, onExplodeCell);
            }
        });
    },

    _getExplosionCells(gx, gz, range, penetrate, map) {
        const cells = [{ gx, gz }];
        const dirs = [
            { dx: 1, dz: 0 },
            { dx: -1, dz: 0 },
            { dx: 0, dz: 1 },
            { dx: 0, dz: -1 },
        ];

        for (const dir of dirs) {
            for (let i = 1; i <= range; i++) {
                const cx = gx + dir.dx * i;
                const cz = gz + dir.dz * i;
                if (!isValidCell(cx, cz)) break;
                if (map.isHard(cx, cz)) break;
                if (map.isSoft(cx, cz)) {
                    cells.push({ gx: cx, gz: cz });
                    if (!penetrate) break;
                    continue;
                }
                cells.push({ gx: cx, gz: cz });
            }
        }
        return cells;
    },

    remoteDetonate(map, onExplodeCell) {
        const remoteBombs = this.bombs.filter(b => !b.exploded);
        if (remoteBombs.length > 0) {
            this._explode(remoteBombs[0], map, onExplodeCell);
        }
    },

    isExplosionAt(gx, gz) {
        return this.explosions.some(exp =>
            exp.cells.some(c => c.gx === gx && c.gz === gz)
        );
    },

    isBombAt(gx, gz) {
        return this.bombs.some(b => b.gx === gx && b.gz === gz && !b.exploded);
    },

    clear() {
        this.bombs.forEach(b => this.scene.remove(b.mesh));
        this.explosions.forEach(exp => {
            exp.meshes.forEach(m => {
                this.scene.remove(m);
                m.geometry.dispose();
                m.material.dispose();
            });
        });
        this.bombs = [];
        this.explosions = [];
    },

    getActiveBombs() {
        return this.bombs.filter(b => !b.exploded);
    },
};
