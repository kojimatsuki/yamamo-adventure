// Enemy system
const EnemyManager = {
    enemies: [],
    scene: null,

    init(scene) {
        this.scene = scene;
        this.enemies = [];
    },

    spawn(type, gx, gz) {
        const stats = ENEMY_STATS[type];
        const pos = gridToWorld(gx, gz);
        const mesh = this._createMesh(type, stats);
        mesh.position.set(pos.x, 0, pos.z);
        this.scene.add(mesh);

        const enemy = {
            type,
            mesh,
            hp: stats.hp,
            speed: stats.speed,
            color: stats.color,
            passBlock: stats.passBlock,
            passWall: stats.passWall,
            position: { x: pos.x, z: pos.z },
            gridPos: { gx, gz },
            direction: { x: 0, z: 0 },
            moveTimer: 0,
            changeTimer: Math.random() * 2,
            alive: true,
            animTime: Math.random() * Math.PI * 2,
            bombCooldown: 0,
        };

        // Set initial direction
        this._setRandomDirection(enemy);
        this.enemies.push(enemy);
        return enemy;
    },

    _createMesh(type, stats) {
        const group = new THREE.Group();
        const color = stats.color;

        switch (type) {
            case ENEMY_SLIME: {
                // Slime - blobby shape
                const bodyGeo = new THREE.SphereGeometry(0.35, 10, 8);
                bodyGeo.scale(1, 0.7, 1);
                const bodyMat = new THREE.MeshPhongMaterial({ color, emissive: new THREE.Color(color).multiplyScalar(0.2) });
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                body.position.y = 0.25;
                body.castShadow = true;
                group.add(body);
                // Eyes
                const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
                const eyeMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
                const pupilGeo = new THREE.SphereGeometry(0.03, 6, 6);
                const pupilMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
                [-0.1, 0.1].forEach(x => {
                    const eye = new THREE.Mesh(eyeGeo, eyeMat);
                    eye.position.set(x, 0.35, 0.25);
                    group.add(eye);
                    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
                    pupil.position.set(x, 0.35, 0.3);
                    group.add(pupil);
                });
                break;
            }
            case ENEMY_BAT: {
                // Bat - round body with wings
                const bodyGeo = new THREE.SphereGeometry(0.2, 8, 6);
                const bodyMat = new THREE.MeshPhongMaterial({ color, emissive: new THREE.Color(color).multiplyScalar(0.2) });
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                body.position.y = 0.6;
                body.castShadow = true;
                group.add(body);
                // Wings
                const wingGeo = new THREE.PlaneGeometry(0.4, 0.25);
                const wingMat = new THREE.MeshPhongMaterial({ color, side: THREE.DoubleSide });
                const lWing = new THREE.Mesh(wingGeo, wingMat);
                lWing.position.set(-0.3, 0.6, 0);
                lWing.rotation.y = 0.3;
                lWing.name = 'lwing';
                group.add(lWing);
                const rWing = new THREE.Mesh(wingGeo, wingMat);
                rWing.position.set(0.3, 0.6, 0);
                rWing.rotation.y = -0.3;
                rWing.name = 'rwing';
                group.add(rWing);
                // Eyes (red)
                const eyeGeo = new THREE.SphereGeometry(0.04, 6, 6);
                const eyeMat = new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0xff0000 });
                [-0.07, 0.07].forEach(x => {
                    const eye = new THREE.Mesh(eyeGeo, eyeMat);
                    eye.position.set(x, 0.63, 0.17);
                    group.add(eye);
                });
                break;
            }
            case ENEMY_GOLEM: {
                // Golem - chunky, big
                const bodyGeo = new THREE.BoxGeometry(0.5, 0.6, 0.4);
                const bodyMat = new THREE.MeshPhongMaterial({ color, emissive: new THREE.Color(color).multiplyScalar(0.15) });
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                body.position.y = 0.4;
                body.castShadow = true;
                group.add(body);
                const headGeo = new THREE.BoxGeometry(0.35, 0.3, 0.3);
                const head = new THREE.Mesh(headGeo, bodyMat);
                head.position.y = 0.85;
                head.castShadow = true;
                group.add(head);
                // Eyes
                const eyeGeo = new THREE.SphereGeometry(0.04, 6, 6);
                const eyeMat = new THREE.MeshPhongMaterial({ color: 0xffff00, emissive: 0xaaaa00 });
                [-0.08, 0.08].forEach(x => {
                    const eye = new THREE.Mesh(eyeGeo, eyeMat);
                    eye.position.set(x, 0.88, 0.14);
                    group.add(eye);
                });
                break;
            }
            case ENEMY_NINJA: {
                // Ninja - slim, dark
                const bodyGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.5, 8);
                const bodyMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                body.position.y = 0.35;
                body.castShadow = true;
                group.add(body);
                const headGeo = new THREE.SphereGeometry(0.15, 8, 6);
                const head = new THREE.Mesh(headGeo, bodyMat);
                head.position.y = 0.7;
                group.add(head);
                // Red eyes
                const eyeGeo = new THREE.SphereGeometry(0.03, 6, 6);
                const eyeMat = new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0xff0000 });
                [-0.06, 0.06].forEach(x => {
                    const eye = new THREE.Mesh(eyeGeo, eyeMat);
                    eye.position.set(x, 0.72, 0.12);
                    group.add(eye);
                });
                // Scarf
                const scarfGeo = new THREE.PlaneGeometry(0.3, 0.1);
                const scarfMat = new THREE.MeshPhongMaterial({ color: 0xcc0000, side: THREE.DoubleSide });
                const scarf = new THREE.Mesh(scarfGeo, scarfMat);
                scarf.position.set(0, 0.6, -0.15);
                group.add(scarf);
                break;
            }
            case ENEMY_GHOST: {
                // Ghost - floating, transparent
                const bodyGeo = new THREE.ConeGeometry(0.3, 0.6, 8);
                const bodyMat = new THREE.MeshPhongMaterial({
                    color: 0xccccff,
                    emissive: 0x6666aa,
                    transparent: true,
                    opacity: 0.7,
                });
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                body.position.y = 0.5;
                body.rotation.x = Math.PI;
                group.add(body);
                // Eyes
                const eyeGeo = new THREE.SphereGeometry(0.05, 6, 6);
                const eyeMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
                [-0.08, 0.08].forEach(x => {
                    const eye = new THREE.Mesh(eyeGeo, eyeMat);
                    eye.position.set(x, 0.55, 0.15);
                    group.add(eye);
                });
                break;
            }
            case ENEMY_BOMKNIGHT: {
                // Bomb Knight - armored with bomb symbol
                const bodyGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.5, 8);
                const bodyMat = new THREE.MeshPhongMaterial({ color: 0xcc4400, emissive: 0x441100 });
                const body = new THREE.Mesh(bodyGeo, bodyMat);
                body.position.y = 0.35;
                body.castShadow = true;
                group.add(body);
                const headGeo = new THREE.SphereGeometry(0.18, 8, 6);
                const headMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
                const head = new THREE.Mesh(headGeo, headMat);
                head.position.y = 0.72;
                head.castShadow = true;
                group.add(head);
                // Visor
                const visorGeo = new THREE.BoxGeometry(0.2, 0.05, 0.05);
                const visorMat = new THREE.MeshPhongMaterial({ color: 0xff4400, emissive: 0xff2200 });
                const visor = new THREE.Mesh(visorGeo, visorMat);
                visor.position.set(0, 0.74, 0.15);
                group.add(visor);
                break;
            }
        }
        return group;
    },

    _setRandomDirection(enemy) {
        const dirs = [
            { x: 1, z: 0 }, { x: -1, z: 0 },
            { x: 0, z: 1 }, { x: 0, z: -1 },
        ];
        const d = dirs[Math.floor(Math.random() * dirs.length)];
        enemy.direction = { ...d };
    },

    update(dt, map, playerPos) {
        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;

            enemy.animTime += dt;
            enemy.changeTimer -= dt;
            enemy.bombCooldown -= dt;

            // Type-specific behavior
            switch (enemy.type) {
                case ENEMY_SLIME:
                    this._moveLinear(enemy, dt, map);
                    // Bounce animation
                    enemy.mesh.children[0].position.y = 0.25 + Math.abs(Math.sin(enemy.animTime * 3)) * 0.1;
                    enemy.mesh.children[0].scale.y = 0.7 + Math.abs(Math.sin(enemy.animTime * 3)) * 0.15;
                    break;

                case ENEMY_BAT:
                    this._moveRandom(enemy, dt, map);
                    // Wing flap
                    enemy.mesh.children.forEach(c => {
                        if (c.name === 'lwing') c.rotation.z = Math.sin(enemy.animTime * 8) * 0.5;
                        if (c.name === 'rwing') c.rotation.z = -Math.sin(enemy.animTime * 8) * 0.5;
                    });
                    // Float
                    enemy.mesh.position.y = Math.sin(enemy.animTime * 2) * 0.1;
                    break;

                case ENEMY_GOLEM:
                    this._moveChase(enemy, dt, map, playerPos);
                    break;

                case ENEMY_NINJA:
                    this._moveRandom(enemy, dt, map);
                    break;

                case ENEMY_GHOST:
                    this._moveChaseGhost(enemy, dt, playerPos);
                    // Float
                    enemy.mesh.position.y = Math.sin(enemy.animTime * 1.5) * 0.15;
                    // Fade in/out
                    enemy.mesh.children[0].material.opacity = 0.4 + Math.sin(enemy.animTime) * 0.3;
                    break;

                case ENEMY_BOMKNIGHT:
                    this._moveRandom(enemy, dt, map);
                    // Place bombs occasionally
                    if (enemy.bombCooldown <= 0) {
                        const g = worldToGrid(enemy.position.x, enemy.position.z);
                        if (!BombManager.isBombAt(g.gx, g.gz) && map.isWalkable(g.gx, g.gz)) {
                            BombManager.placeBomb(g.gx, g.gz, 1, false);
                            enemy.bombCooldown = 5 + Math.random() * 3;
                        }
                    }
                    break;
            }

            // Update grid position
            const gp = worldToGrid(enemy.position.x, enemy.position.z);
            enemy.gridPos = gp;
            enemy.mesh.position.x = enemy.position.x;
            enemy.mesh.position.z = enemy.position.z;

            // Face direction
            if (enemy.direction.x !== 0 || enemy.direction.z !== 0) {
                enemy.mesh.rotation.y = Math.atan2(enemy.direction.x, enemy.direction.z);
            }
        }
    },

    _moveLinear(enemy, dt, map) {
        const newX = enemy.position.x + enemy.direction.x * enemy.speed * dt;
        const newZ = enemy.position.z + enemy.direction.z * enemy.speed * dt;

        if (this._canEnemyMove(newX, newZ, 0.3, map, enemy.passBlock, enemy.passWall)) {
            enemy.position.x = newX;
            enemy.position.z = newZ;
        } else {
            // Reverse direction or pick new
            this._snapToGrid(enemy);
            const dirs = [
                { x: 1, z: 0 }, { x: -1, z: 0 },
                { x: 0, z: 1 }, { x: 0, z: -1 },
            ];
            shuffleArray(dirs);
            let moved = false;
            for (const d of dirs) {
                const tx = enemy.position.x + d.x * 0.5;
                const tz = enemy.position.z + d.z * 0.5;
                if (this._canEnemyMove(tx, tz, 0.3, map, enemy.passBlock, enemy.passWall)) {
                    enemy.direction = { ...d };
                    moved = true;
                    break;
                }
            }
            if (!moved) {
                enemy.direction = { x: -enemy.direction.x, z: -enemy.direction.z };
            }
        }
    },

    _moveRandom(enemy, dt, map) {
        if (enemy.changeTimer <= 0) {
            this._setRandomDirection(enemy);
            enemy.changeTimer = 1 + Math.random() * 2;
        }
        this._moveLinear(enemy, dt, map);
    },

    _moveChase(enemy, dt, map, playerPos) {
        if (enemy.changeTimer <= 0) {
            // Determine direction toward player
            const dx = playerPos.x - enemy.position.x;
            const dz = playerPos.z - enemy.position.z;
            if (Math.abs(dx) > Math.abs(dz)) {
                enemy.direction = { x: dx > 0 ? 1 : -1, z: 0 };
            } else {
                enemy.direction = { x: 0, z: dz > 0 ? 1 : -1 };
            }
            enemy.changeTimer = 0.5 + Math.random();
        }
        this._moveLinear(enemy, dt, map);
    },

    _moveChaseGhost(enemy, dt, playerPos) {
        const dx = playerPos.x - enemy.position.x;
        const dz = playerPos.z - enemy.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 0.1) {
            enemy.position.x += (dx / dist) * enemy.speed * dt;
            enemy.position.z += (dz / dist) * enemy.speed * dt;
            enemy.direction = { x: dx > 0 ? 1 : -1, z: dz > 0 ? 1 : -1 };
        }
    },

    _canEnemyMove(x, z, margin, map, passBlock, passWall) {
        const corners = [
            { x: x - margin, z: z - margin },
            { x: x + margin, z: z - margin },
            { x: x - margin, z: z + margin },
            { x: x + margin, z: z + margin },
        ];
        for (const c of corners) {
            const g = worldToGrid(c.x, c.z);
            if (!isValidCell(g.gx, g.gz)) return false;
            const cell = map.grid[g.gz] && map.grid[g.gz][g.gx];
            if (cell === CELL_HARD && !passWall) return false;
            if (cell === CELL_SOFT && !passBlock) return false;
        }
        return true;
    },

    _snapToGrid(enemy) {
        const g = worldToGrid(enemy.position.x, enemy.position.z);
        const w = gridToWorld(g.gx, g.gz);
        enemy.position.x = w.x;
        enemy.position.z = w.z;
    },

    damageAt(gx, gz) {
        const killed = [];
        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;
            const eg = worldToGrid(enemy.position.x, enemy.position.z);
            if (eg.gx === gx && eg.gz === gz) {
                enemy.hp--;
                if (enemy.hp <= 0) {
                    enemy.alive = false;
                    this.scene.remove(enemy.mesh);
                    SoundManager.playEnemyDeath();
                    killed.push(enemy);
                }
            }
        }
        return killed;
    },

    getAliveCount() {
        return this.enemies.filter(e => e.alive).length;
    },

    checkCollisionWithPlayer(px, pz, margin) {
        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;
            const dx = Math.abs(enemy.position.x - px);
            const dz = Math.abs(enemy.position.z - pz);
            if (dx < margin && dz < margin) return true;
        }
        return false;
    },

    clear() {
        this.enemies.forEach(e => {
            if (e.mesh) this.scene.remove(e.mesh);
        });
        this.enemies = [];
    },
};
