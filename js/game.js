// Main game logic
const Game = {
    scene: null,
    camera: null,
    renderer: null,
    state: STATE_TITLE,
    world: 1,
    stage: 1,
    score: 0,
    highScore: 0,
    timeRemaining: STAGE_TIME_LIMIT,
    stageConfig: null,
    gimmickMeshes: [],
    gimmickTimers: {},
    titleScene: null,
    titleCamera: null,
    menuItems: [],
    selectedMenu: 0,
    menuCooldown: 0,
    stageTransitionTimer: 0,
    worldClearTimer: 0,
    pauseMenuItems: [],
    selectedPause: 0,
    savedProgress: null,
    _respawnTimerId: null,

    init() {
        // Renderer
        const canvas = document.getElementById('game-canvas');
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Main scene
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 12, 8);
        this.camera.lookAt(0, 0, 0);

        // Title scene
        this.titleScene = new THREE.Scene();
        this.titleCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
        this.titleCamera.position.set(0, 5, 10);
        this.titleCamera.lookAt(0, 2, 0);

        // Resize handler
        window.addEventListener('resize', () => this._onResize());

        // Load high score
        this.highScore = parseInt(localStorage.getItem('yamamo_highscore') || '0');
        this.savedProgress = JSON.parse(localStorage.getItem('yamamo_progress') || 'null');

        // Init subsystems
        Input.init();
        SoundManager.init();
        GameMap.init(this.scene);
        Player.init(this.scene);
        BombManager.init(this.scene);
        EnemyManager.init(this.scene);
        BossManager.init(this.scene);
        ItemManager.init(this.scene);
        Effects.init(this.scene, this.camera);

        this._setupTitleScreen();
    },

    _onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.renderer.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.titleCamera.aspect = w / h;
        this.titleCamera.updateProjectionMatrix();
    },

    _setupTitleScreen() {
        this.state = STATE_TITLE;
        HUD.hide();
        HUD.hideBossHP();

        // Clear title scene
        while (this.titleScene.children.length > 0) {
            this.titleScene.remove(this.titleScene.children[0]);
        }

        // Lighting
        const ambient = new THREE.AmbientLight(0x666666);
        this.titleScene.add(ambient);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 5);
        this.titleScene.add(dirLight);

        // Sky
        this.titleScene.background = new THREE.Color(0x87CEEB);
        this.titleScene.fog = new THREE.Fog(0x87CEEB, 15, 30);

        // Ground
        const groundGeo = new THREE.PlaneGeometry(30, 30);
        const groundMat = new THREE.MeshPhongMaterial({ color: 0x4CAF50 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        this.titleScene.add(ground);

        // Title text
        const title = create3DText('やまもの冒険', 2.0, 0xFFDD44);
        title.position.set(0, 5.5, 0);
        this.titleScene.add(title);

        // Subtitle
        const subtitle = create3DText('3D BOMBER ADVENTURE', 0.7, 0xffffff);
        subtitle.position.set(0, 3.8, 0);
        this.titleScene.add(subtitle);

        // Yamamo character on title
        const yamaGroup = new THREE.Group();
        const bodyGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.8, 8);
        const bodyMat = new THREE.MeshPhongMaterial({ color: 0xffffff });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.5;
        yamaGroup.add(body);
        const headGeo = new THREE.SphereGeometry(0.35, 12, 10);
        const headMat = new THREE.MeshPhongMaterial({ color: 0xffcc99 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.2;
        yamaGroup.add(head);
        const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
        const eyeMat = new THREE.MeshPhongMaterial({ color: 0x000000 });
        [-0.12, 0.12].forEach(x => {
            const eye = new THREE.Mesh(eyeGeo, eyeMat);
            eye.position.set(x, 1.25, 0.28);
            yamaGroup.add(eye);
        });
        yamaGroup.position.set(0, 0, 4);
        this.titleScene.add(yamaGroup);
        this._titleYamamo = yamaGroup;

        // Decorative blocks
        for (let i = 0; i < 8; i++) {
            const geo = new THREE.BoxGeometry(1, 1, 1);
            const mat = new THREE.MeshPhongMaterial({ color: [0x8B6914, 0x666666, 0x44cc44][i % 3] });
            const block = new THREE.Mesh(geo, mat);
            block.position.set(
                (Math.random() - 0.5) * 12,
                0.5,
                (Math.random() - 0.5) * 8 + 2
            );
            block.castShadow = true;
            this.titleScene.add(block);
        }

        // Menu items
        this.menuItems = [];
        const menuLabels = ['はじめから', 'つづきから', 'ステージセレクト'];
        menuLabels.forEach((label, i) => {
            const text = create3DText(label, 0.8, 0xffffff);
            text.position.set(0, 2.0 - i * 1.0, 2);
            this.titleScene.add(text);
            this.menuItems.push({ mesh: text, label });
        });
        this.selectedMenu = 0;
        this._updateMenuSelection();

        SoundManager.playTitleBGM();
    },

    _updateMenuSelection() {
        this.menuItems.forEach((item, i) => {
            const isSelected = i === this.selectedMenu;
            const mesh = item.mesh.children[0];
            if (mesh && mesh.material) {
                mesh.material.emissive.setHex(isSelected ? 0x446644 : 0x111111);
            }
            item.mesh.scale.setScalar(isSelected ? 1.2 : 1.0);
        });
    },

    _setupStageSelectScreen() {
        this.state = STATE_STAGE_SELECT;
        HUD.hide();
        HUD.hideBossHP();
        SoundManager.stopBGM();

        while (this.titleScene.children.length > 0) {
            this.titleScene.remove(this.titleScene.children[0]);
        }

        const ambient = new THREE.AmbientLight(0x666666);
        this.titleScene.add(ambient);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 5);
        this.titleScene.add(dirLight);
        this.titleScene.background = new THREE.Color(0x223344);

        const title = create3DText('ステージセレクト', 1.2, 0xffffff);
        title.position.set(0, 6, 0);
        this.titleScene.add(title);

        this.menuItems = [];
        let idx = 0;
        for (let w = 1; w <= TOTAL_WORLDS; w++) {
            for (let s = 1; s <= STAGES_PER_WORLD; s++) {
                const unlocked = this._isStageUnlocked(w, s);
                const color = unlocked ? 0x44ff44 : 0x666666;
                const label = `${w}-${s}`;
                const text = create3DText(label, 0.6, color);
                const col = (idx % 5);
                const row = Math.floor(idx / 5);
                text.position.set(-4 + col * 2, 4 - row * 1.2, 2);
                this.titleScene.add(text);
                this.menuItems.push({ mesh: text, label, world: w, stage: s, unlocked });
                idx++;
            }
        }
        // Back button
        const back = create3DText('もどる', 0.7, 0xff8844);
        back.position.set(0, -2, 2);
        this.titleScene.add(back);
        this.menuItems.push({ mesh: back, label: 'back', world: 0, stage: 0, unlocked: true });

        this.selectedMenu = 0;
        this._updateStageSelectSelection();
    },

    _updateStageSelectSelection() {
        this.menuItems.forEach((item, i) => {
            const isSelected = i === this.selectedMenu;
            const mesh = item.mesh.children[0];
            if (mesh && mesh.material) {
                mesh.material.emissive.setHex(isSelected ? 0x444444 : 0x111111);
            }
            item.mesh.scale.setScalar(isSelected ? 1.3 : 1.0);
        });
    },

    _isStageUnlocked(w, s) {
        if (w === 1 && s === 1) return true;
        if (!this.savedProgress) return false;
        const cleared = this.savedProgress.cleared || [];
        // A stage is unlocked if the previous one was cleared
        if (s > 1) return cleared.includes(`${w}-${s - 1}`);
        // First stage of a world: previous world's last stage must be cleared
        return cleared.includes(`${w - 1}-5`);
    },

    startGame(world, stage) {
        this.world = world || 1;
        this.stage = stage || 1;
        this.score = 0;
        Player.fullReset();
        this._loadStage();
    },

    continueGame() {
        if (this.savedProgress) {
            this.world = this.savedProgress.world || 1;
            this.stage = this.savedProgress.stage || 1;
            this.score = this.savedProgress.score || 0;
            Player.fullReset();
            Player.lives = this.savedProgress.lives || PLAYER_INITIAL_LIVES;
            this._loadStage();
        } else {
            this.startGame(1, 1);
        }
    },

    _loadStage() {
        this.state = STATE_PLAYING;
        this.timeRemaining = STAGE_TIME_LIMIT;
        this.stageTransitionTimer = 0;

        // Cancel any pending respawn timer
        if (this._respawnTimerId) {
            clearTimeout(this._respawnTimerId);
            this._respawnTimerId = null;
        }

        // Clear everything
        this._clearStage();

        // Get stage config
        this.stageConfig = StageData.getStageConfig(this.world, this.stage);
        const theme = WORLD_THEMES[this.world];

        // Setup scene
        this.scene.background = new THREE.Color(theme.sky);
        this.scene.fog = new THREE.Fog(theme.fog, 10, 25);

        if (this.stageConfig.fogDistance) {
            this.scene.fog = new THREE.Fog(theme.fog, this.stageConfig.fogDistance, this.stageConfig.fogDistance + 3);
        }

        // Lighting
        const ambient = new THREE.AmbientLight(0x666666);
        ambient.name = 'ambient';
        this.scene.add(ambient);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 3);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 30;
        dirLight.shadow.camera.left = -10;
        dirLight.shadow.camera.right = 10;
        dirLight.shadow.camera.top = 10;
        dirLight.shadow.camera.bottom = -10;
        dirLight.name = 'dirlight';
        this.scene.add(dirLight);

        // World-specific extra lights
        if (this.world === 2) {
            const lavaLight = new THREE.PointLight(0xff4400, 0.5, 15);
            lavaLight.position.set(0, 2, 0);
            lavaLight.name = 'lavalight';
            this.scene.add(lavaLight);
        }

        // Generate map
        if (this.stageConfig.isBoss) {
            GameMap.generateBossArena(this.world);
        } else {
            GameMap.generate(this.world, this.stage, this.stageConfig.softBlockRatio);
        }

        // Reset player ability for stage (keep powerups between stages)
        Player.activeBombs = 0;
        Player.spawn(1, 1);

        // Spawn enemies
        let totalEnemies = 0;
        for (const eConfig of this.stageConfig.enemies) {
            totalEnemies += eConfig.count;
        }
        const spawnPositions = StageData.getEnemySpawnPositions(GameMap, totalEnemies);
        let posIdx = 0;
        for (const eConfig of this.stageConfig.enemies) {
            for (let i = 0; i < eConfig.count; i++) {
                if (posIdx < spawnPositions.length) {
                    EnemyManager.spawn(eConfig.type, spawnPositions[posIdx].gx, spawnPositions[posIdx].gz);
                    posIdx++;
                }
            }
        }

        // Spawn boss
        if (this.stageConfig.isBoss) {
            // Show boss intro then spawn
            this.state = STATE_BOSS_INTRO;
            const bossData = { 1: '巨大スライム', 2: 'ファイアゴーレム', 3: 'アイスドラゴン', 4: 'メカキング', 5: '魔王オニヅカ' };
            Effects.showBossIntro(bossData[this.world], () => {
                BossManager.spawn(this.world);
                HUD.showBossHP(BossManager.boss.hp, BossManager.boss.maxHp);
                this.state = STATE_PLAYING;
            });
        }

        // Place gimmicks
        this._placeGimmicks();

        // Setup camera
        this.camera.position.set(0, 12, 8);
        this.camera.lookAt(0, 0, 0);
        Effects.updateCameraOrigPos();

        // HUD
        HUD.show();
        HUD.updateLives(Player.lives);
        HUD.updateStage(this.world, this.stage);
        HUD.updateScore(this.score);
        HUD.updateTime(this.timeRemaining);
        HUD.updatePowerups(Player);

        if (this.stageConfig.isBoss) {
            HUD.showBossHP(BossManager.boss ? BossManager.boss.hp : 0, BossManager.boss ? BossManager.boss.maxHp : 1);
        } else {
            HUD.hideBossHP();
        }

        // BGM
        SoundManager.playBGM(this.world);
    },

    _placeGimmicks() {
        this.gimmickMeshes = [];
        this.gimmickTimers = {};

        const gimmicks = this.stageConfig.gimmicks;
        const positions = StageData.getGimmickPositions(GameMap, gimmicks.length);

        gimmicks.forEach((gConfig, i) => {
            const pos = gConfig.randomPos ? positions[i] : gConfig;
            if (!pos) return;

            const mesh = GameMap.addGimmick(gConfig.type, pos.gx, pos.gz, {
                dir: gConfig.dir,
                pairId: gConfig.pairId,
                interval: gConfig.interval,
            });
            if (mesh) {
                this.gimmickMeshes.push(mesh);
                if (gConfig.interval) {
                    mesh.userData.activeTimer = gConfig.interval;
                    mesh.userData.isActive = true;
                }
            }
        });
    },

    _clearStage() {
        // Cancel pending respawn timer
        if (this._respawnTimerId) {
            clearTimeout(this._respawnTimerId);
            this._respawnTimerId = null;
        }

        // Remove lights
        ['ambient', 'dirlight', 'lavalight'].forEach(name => {
            const obj = this.scene.getObjectByName(name);
            if (obj) this.scene.remove(obj);
        });

        GameMap.clear();
        BombManager.clear();
        EnemyManager.clear();
        BossManager.clear();
        ItemManager.clear();
        Effects.clear();
        this.gimmickMeshes = [];
        this.gimmickTimers = {};
        HUD.hideBossHP();
    },

    update(dt) {
        this.menuCooldown -= dt;

        switch (this.state) {
            case STATE_TITLE:
                this._updateTitle(dt);
                break;
            case STATE_STAGE_SELECT:
                this._updateStageSelect(dt);
                break;
            case STATE_PLAYING:
                this._updatePlaying(dt);
                break;
            case STATE_PAUSED:
                this._updatePaused(dt);
                break;
            case STATE_BOSS_INTRO:
                Effects.update(dt);
                break;
            case STATE_STAGE_CLEAR:
                this._updateStageClear(dt);
                break;
            case STATE_GAME_OVER:
                this._updateGameOver(dt);
                break;
            case STATE_WORLD_CLEAR:
                this._updateWorldClear(dt);
                break;
            case STATE_ALL_CLEAR:
                this._updateAllClear(dt);
                break;
        }
    },

    _updateTitle(dt) {
        SoundManager.resume();

        // Animate yamamo
        if (this._titleYamamo) {
            this._titleYamamo.rotation.y += dt * 0.5;
            this._titleYamamo.position.y = Math.sin(Date.now() * 0.002) * 0.2;
        }

        if (this.menuCooldown > 0) return;

        const move = Input.getMove();
        if (move.z < 0 && this.menuCooldown <= 0) {
            this.selectedMenu = Math.max(0, this.selectedMenu - 1);
            this._updateMenuSelection();
            this.menuCooldown = 0.2;
            SoundManager.playMenuSelect();
        }
        if (move.z > 0 && this.menuCooldown <= 0) {
            this.selectedMenu = Math.min(this.menuItems.length - 1, this.selectedMenu + 1);
            this._updateMenuSelection();
            this.menuCooldown = 0.2;
            SoundManager.playMenuSelect();
        }

        if (Input.isBombAction() || Input.keys['Enter']) {
            Input.keys['Enter'] = false;
            SoundManager.playMenuConfirm();
            this.menuCooldown = 0.3;
            switch (this.selectedMenu) {
                case 0: // はじめから
                    this.startGame(1, 1);
                    break;
                case 1: // つづきから
                    this.continueGame();
                    break;
                case 2: // ステージセレクト
                    this._setupStageSelectScreen();
                    break;
            }
        }
    },

    _updateStageSelect(dt) {
        if (this.menuCooldown > 0) return;

        const move = Input.getMove();
        if (move.x !== 0 || move.z !== 0) {
            if (move.x > 0) this.selectedMenu = Math.min(this.menuItems.length - 1, this.selectedMenu + 1);
            if (move.x < 0) this.selectedMenu = Math.max(0, this.selectedMenu - 1);
            if (move.z > 0) this.selectedMenu = Math.min(this.menuItems.length - 1, this.selectedMenu + 5);
            if (move.z < 0) this.selectedMenu = Math.max(0, this.selectedMenu - 5);
            this._updateStageSelectSelection();
            this.menuCooldown = 0.15;
            SoundManager.playMenuSelect();
        }

        if (Input.isBombAction() || Input.keys['Enter']) {
            Input.keys['Enter'] = false;
            const item = this.menuItems[this.selectedMenu];
            if (item.label === 'back') {
                this._setupTitleScreen();
            } else if (item.unlocked) {
                SoundManager.playMenuConfirm();
                this.world = item.world;
                this.stage = item.stage;
                this.score = 0;
                Player.fullReset();
                this._loadStage();
            }
            this.menuCooldown = 0.3;
        }

        if (Input.isPauseAction()) {
            this._setupTitleScreen();
        }
    },

    _updatePlaying(dt) {
        // Pause
        if (Input.isPauseAction()) {
            this._showPauseMenu();
            return;
        }

        // Timer
        this.timeRemaining -= dt;
        if (this.timeRemaining <= 0) {
            this.timeRemaining = 0;
            if (Player.die()) {
                this._handlePlayerDeath();
            }
            return;
        }

        // Player
        Player.update(dt, GameMap, BombManager.getActiveBombs());

        // Update bomb passthrough (check if player has left bomb cells)
        BombManager.updatePassthrough(Player.position.x, Player.position.z);

        // Bomb placement
        if (Input.isBombAction() && Player.alive) {
            const g = Player.gridPos;
            if (Player.activeBombs < Player.maxBombs) {
                if (BombManager.placeBomb(g.gx, g.gz, Player.fireRange, Player.hasPenetrate, true)) {
                    Player.activeBombs++;
                }
            }
        }

        // Remote detonation
        if (Input.isRemoteAction() && Player.hasRemote && Player.alive) {
            BombManager.remoteDetonate(GameMap, (gx, gz) => this._onExplodeCell(gx, gz));
        }

        // Bombs
        BombManager.update(dt, GameMap, (gx, gz) => this._onExplodeCell(gx, gz));

        // Items
        ItemManager.update(dt);
        if (Player.alive) {
            const item = ItemManager.checkPickup(Player.position.x, Player.position.z);
            if (item) {
                Player.applyItem(item);
                this.score += SCORE_ITEM;
                const pos = gridToWorld(Player.gridPos.gx, Player.gridPos.gz);
                Effects.spawnItemParticles(pos.x, 0.5, pos.z, ITEM_COLORS[item]);
                HUD.updatePowerups(Player);
            }
        }

        // Enemies
        EnemyManager.update(dt, GameMap, Player.position);

        // Boss
        if (this.stageConfig.isBoss) {
            BossManager.update(dt, GameMap, Player.position);
            if (BossManager.boss) {
                HUD.showBossHP(BossManager.boss.hp, BossManager.boss.maxHp);
                // World 5 Phase 2: darken fog
                if (this.world === 5 && BossManager.phase === 2) {
                    this.scene.fog = new THREE.Fog(0x0a0015, 3, 6);
                }
            }
        }

        // Collision: player with enemies
        if (Player.alive && !Player.invincible) {
            if (EnemyManager.checkCollisionWithPlayer(Player.position.x, Player.position.z, 0.4)) {
                if (Player.die()) this._handlePlayerDeath();
            }
        }

        // Collision: player with boss/projectiles
        if (Player.alive && !Player.invincible && this.stageConfig.isBoss) {
            const bossHit = BossManager.checkCollisionWithPlayer(Player.position.x, Player.position.z);
            if (bossHit) {
                if (typeof bossHit === 'object' && bossHit.slowEffect) {
                    // Ice projectile slow effect
                    Player.speed = Math.max(1.0, Player.speed - 1.5);
                    Player.skullTimer = 3;
                }
                if (Player.die()) this._handlePlayerDeath();
            }
        }

        // Collision: player with explosions
        if (Player.alive && !Player.invincible) {
            if (BombManager.isExplosionAt(Player.gridPos.gx, Player.gridPos.gz)) {
                if (Player.die()) this._handlePlayerDeath();
            }
        }

        // Gimmick updates
        this._updateGimmicks(dt);

        // Check stage clear
        if (this.stageConfig.isBoss) {
            if (BossManager.boss && !BossManager.boss.alive) {
                this._handleStageClear(true);
            }
        } else {
            if (EnemyManager.getAliveCount() === 0) {
                this._handleStageClear(false);
            }
        }

        // Effects
        Effects.update(dt);

        // HUD
        HUD.updateTime(this.timeRemaining);
        HUD.updateScore(this.score);
        HUD.updateLives(Player.lives);
    },

    _onExplodeCell(gx, gz) {
        // Destroy soft block
        if (GameMap.removeSoftBlock(gx, gz)) {
            const pos = gridToWorld(gx, gz);
            Effects.spawnExplosionParticles(pos.x, 0.5, pos.z, 8, WORLD_THEMES[this.world].softBlock);
            ItemManager.spawnFromBlock(gx, gz);
            // World 3: leave ice floor when soft block is destroyed
            if (this.world === 3) {
                const iceMesh = GameMap.addGimmick('ice', gx, gz, {});
                if (iceMesh) this.gimmickMeshes.push(iceMesh);
            }
        }

        // Damage enemies
        const killed = EnemyManager.damageAt(gx, gz);
        killed.forEach(e => {
            const pos = gridToWorld(gx, gz);
            Effects.spawnDeathParticles(pos.x, 0.5, pos.z, e.color);
            this.score += SCORE_ENEMY_BASE * this.world;
        });

        // Damage boss
        if (this.stageConfig.isBoss) {
            const bossKilled = BossManager.damageAt(gx, gz);
            if (bossKilled) {
                const pos = gridToWorld(gx, gz);
                Effects.spawnDeathParticles(pos.x, 0.5, pos.z, 0xff4444);
                Effects.screenShake(0.5, 0.5);
                this.score += SCORE_BOSS_BASE * this.world;
            }
        }

        // Screen shake for explosions
        Effects.screenShake(0.15, 0.15);
    },

    _updateGimmicks(dt) {
        for (const mesh of this.gimmickMeshes) {
            const data = mesh.userData;
            if (!data.gimmickType) continue;

            switch (data.gimmickType) {
                case 'lava': {
                    if (data.interval) {
                        data.activeTimer -= dt;
                        if (data.activeTimer <= 0) {
                            data.isActive = !data.isActive;
                            data.activeTimer = data.interval;
                            mesh.visible = data.isActive;
                        }
                    }
                    if (data.isActive && Player.alive && !Player.invincible) {
                        const pg = Player.gridPos;
                        if (pg.gx === data.gx && pg.gz === data.gz) {
                            if (Player.die()) this._handlePlayerDeath();
                        }
                    }
                    // Animate
                    if (data.isActive) {
                        mesh.material.emissive.setHex(
                            Math.sin(Date.now() * 0.005) > 0 ? 0xff2200 : 0xff4400
                        );
                    }
                    break;
                }
                case 'ice': {
                    if (Player.alive) {
                        const pg = Player.gridPos;
                        if (pg.gx === data.gx && pg.gz === data.gz) {
                            if (!Player.sliding) {
                                const move = Input.getMove();
                                if (move.x !== 0 || move.z !== 0) {
                                    Player.sliding = true;
                                    Player.slideDir = { x: move.x, z: move.z };
                                }
                            }
                        }
                    }
                    break;
                }
                case 'conveyor': {
                    if (Player.alive && data.dir) {
                        const pg = Player.gridPos;
                        if (pg.gx === data.gx && pg.gz === data.gz) {
                            Player.position.x += data.dir.x * 1.5 * dt;
                            Player.position.z += data.dir.z * 1.5 * dt;
                        }
                    }
                    // Animate conveyor (rotate)
                    mesh.rotation.z += dt * 3;
                    break;
                }
                case 'electric': {
                    if (data.interval) {
                        data.activeTimer -= dt;
                        if (data.activeTimer <= 0) {
                            data.isActive = !data.isActive;
                            data.activeTimer = data.interval;
                        }
                    }
                    if (data.isActive && Player.alive && !Player.invincible) {
                        const pg = Player.gridPos;
                        if (pg.gx === data.gx && pg.gz === data.gz) {
                            if (Player.die()) this._handlePlayerDeath();
                        }
                    }
                    break;
                }
                case 'warp': {
                    if (Player.alive) {
                        const pg = Player.gridPos;
                        if (pg.gx === data.gx && pg.gz === data.gz) {
                            // Find pair warp
                            const pair = this.gimmickMeshes.find(m =>
                                m !== mesh &&
                                m.userData.gimmickType === 'warp' &&
                                m.userData.pairId === data.pairId
                            );
                            if (pair && !data._warpCooldown) {
                                const pos = gridToWorld(pair.userData.gx, pair.userData.gz);
                                Player.position.x = pos.x;
                                Player.position.z = pos.z;
                                data._warpCooldown = 1;
                                pair.userData._warpCooldown = 1;
                            }
                        }
                    }
                    // Cooldown
                    if (data._warpCooldown) {
                        data._warpCooldown -= dt;
                        if (data._warpCooldown <= 0) data._warpCooldown = 0;
                    }
                    // Animate
                    mesh.rotation.z += dt * 2;
                    break;
                }
            }
        }
    },

    _handlePlayerDeath() {
        Effects.spawnDeathParticles(Player.position.x, 0.5, Player.position.z, 0xffffff);
        Effects.screenShake(0.3, 0.3);

        if (Player.lives <= 0) {
            SoundManager.stopBGM();
            this.state = STATE_GAME_OVER;
            this.stageTransitionTimer = 2;
            SoundManager.playGameOver();
        } else {
            // Respawn after delay
            if (this._respawnTimerId) clearTimeout(this._respawnTimerId);
            this._respawnTimerId = setTimeout(() => {
                this._respawnTimerId = null;
                if (this.state !== STATE_PLAYING && this.state !== STATE_BOSS_INTRO) return;
                // Reset activeBombs to count only remaining player bombs
                Player.activeBombs = BombManager.getActiveBombs().filter(b => b.isPlayerBomb).length;
                Player.spawn(1, 1);
            }, 1500);
        }
    },

    _handleStageClear(isBoss) {
        this.state = STATE_STAGE_CLEAR;
        SoundManager.stopBGM();
        SoundManager.playStageClear();

        // Time bonus
        this.score += Math.floor(this.timeRemaining) * SCORE_TIME_BONUS;

        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('yamamo_highscore', this.highScore.toString());
        }

        // Save progress
        this._saveProgress();

        this.stageTransitionTimer = 3;

        // Show clear text in 3D
        const clearText = create3DText(isBoss ? 'BOSS DEFEATED!' : 'STAGE CLEAR!', 1.5, 0xffdd44);
        clearText.position.set(0, 5, 0);
        clearText.name = 'cleartext';
        this.scene.add(clearText);

        const scoreText = create3DText(`SCORE: ${this.score}`, 0.8, 0xffffff);
        scoreText.position.set(0, 3.5, 0);
        scoreText.name = 'scoretext';
        this.scene.add(scoreText);
    },

    _updateStageClear(dt) {
        this.stageTransitionTimer -= dt;
        Effects.update(dt);

        // Animate clear text
        const ct = this.scene.getObjectByName('cleartext');
        if (ct) ct.rotation.y += dt * 0.5;

        if (this.stageTransitionTimer <= 0 || Input.isBombAction() || Input.keys['Enter']) {
            Input.keys['Enter'] = false;
            // Remove clear text
            ['cleartext', 'scoretext'].forEach(name => {
                const obj = this.scene.getObjectByName(name);
                if (obj) this.scene.remove(obj);
            });

            if (this.stage === 5) {
                // World clear
                if (this.world === 5) {
                    this._showAllClear();
                } else {
                    this._showWorldClear();
                }
            } else {
                this.stage++;
                this._loadStage();
            }
        }
    },

    _showWorldClear() {
        this.state = STATE_WORLD_CLEAR;
        this.worldClearTimer = 5;

        const msg = StageData.getWorldClearMessage(this.world);
        const lines = msg.split('\n');
        lines.forEach((line, i) => {
            const text = create3DText(line, 0.7, 0xffffff);
            text.position.set(0, 5 - i * 1.2, 0);
            text.name = `worldclear${i}`;
            this.scene.add(text);
        });
    },

    _updateWorldClear(dt) {
        this.worldClearTimer -= dt;
        if (this.worldClearTimer <= 0 || Input.isBombAction() || Input.keys['Enter']) {
            Input.keys['Enter'] = false;
            for (let i = 0; i < 5; i++) {
                const obj = this.scene.getObjectByName(`worldclear${i}`);
                if (obj) this.scene.remove(obj);
            }
            this.world++;
            this.stage = 1;
            this._loadStage();
        }
    },

    _showAllClear() {
        this.state = STATE_ALL_CLEAR;
        this.worldClearTimer = 8;

        const texts = [
            'CONGRATULATIONS!',
            '',
            StageData.getWorldClearMessage(5),
            '',
            `FINAL SCORE: ${this.score}`,
            `HIGH SCORE: ${this.highScore}`,
        ];
        const flatTexts = texts.join('\n').split('\n');
        flatTexts.forEach((line, i) => {
            if (!line) return;
            const color = i === 0 ? 0xffdd44 : 0xffffff;
            const size = i === 0 ? 1.2 : 0.6;
            const text = create3DText(line, size, color);
            text.position.set(0, 7 - i * 1.0, 0);
            text.name = `allclear${i}`;
            this.scene.add(text);
        });
    },

    _updateAllClear(dt) {
        this.worldClearTimer -= dt;
        if (this.worldClearTimer <= 0 || Input.isBombAction() || Input.keys['Enter']) {
            Input.keys['Enter'] = false;
            for (let i = 0; i < 20; i++) {
                const obj = this.scene.getObjectByName(`allclear${i}`);
                if (obj) this.scene.remove(obj);
            }
            this._clearStage();
            this._setupTitleScreen();
        }
    },

    _showPauseMenu() {
        this.state = STATE_PAUSED;
        SoundManager.stopBGM();

        this.pauseMenuItems = [];
        const labels = ['つづける', 'リトライ', 'タイトルへ'];
        labels.forEach((label, i) => {
            const text = create3DText(label, 0.8, 0xffffff);
            text.position.set(0, 5 - i * 1.2, 0);
            text.name = `pause${i}`;
            this.scene.add(text);
        });

        // Mute button
        const muteText = create3DText(SoundManager.muted ? 'サウンド ON' : 'サウンド OFF', 0.6, 0x888888);
        muteText.position.set(0, 1, 0);
        muteText.name = 'pausemute';
        this.scene.add(muteText);
        labels.push('mute');

        this.selectedPause = 0;
        this.pauseMenuItems = labels;
        this.menuCooldown = 0.3;
    },

    _updatePaused(dt) {
        if (this.menuCooldown > 0) return;

        const move = Input.getMove();
        if (move.z !== 0 && this.menuCooldown <= 0) {
            this.selectedPause += move.z > 0 ? 1 : -1;
            this.selectedPause = clamp(this.selectedPause, 0, this.pauseMenuItems.length - 1);
            this.menuCooldown = 0.2;
            SoundManager.playMenuSelect();

            // Update visuals
            this.pauseMenuItems.forEach((label, i) => {
                const mesh = this.scene.getObjectByName(i < 3 ? `pause${i}` : 'pausemute');
                if (mesh && mesh.children[0] && mesh.children[0].material) {
                    mesh.children[0].material.emissive.setHex(i === this.selectedPause ? 0x446644 : 0x111111);
                    mesh.scale.setScalar(i === this.selectedPause ? 1.2 : 1.0);
                }
            });
        }

        if (Input.isPauseAction()) {
            this._closePauseMenu();
            this.state = STATE_PLAYING;
            SoundManager.playBGM(this.world);
            return;
        }

        if (Input.isBombAction() || Input.keys['Enter']) {
            Input.keys['Enter'] = false;
            SoundManager.playMenuConfirm();
            switch (this.selectedPause) {
                case 0: // Continue
                    this._closePauseMenu();
                    this.state = STATE_PLAYING;
                    SoundManager.playBGM(this.world);
                    break;
                case 1: // Retry
                    this._closePauseMenu();
                    Player.reset();
                    this._loadStage();
                    break;
                case 2: // Title
                    this._closePauseMenu();
                    this._clearStage();
                    this._setupTitleScreen();
                    break;
                case 3: // Mute
                    SoundManager.toggleMute();
                    const muteText = this.scene.getObjectByName('pausemute');
                    if (muteText) {
                        this.scene.remove(muteText);
                        const newText = create3DText(SoundManager.muted ? 'サウンド ON' : 'サウンド OFF', 0.6, 0x888888);
                        newText.position.set(0, 1, 0);
                        newText.name = 'pausemute';
                        this.scene.add(newText);
                    }
                    this.menuCooldown = 0.3;
                    break;
            }
        }
    },

    _closePauseMenu() {
        for (let i = 0; i < 3; i++) {
            const obj = this.scene.getObjectByName(`pause${i}`);
            if (obj) this.scene.remove(obj);
        }
        const mute = this.scene.getObjectByName('pausemute');
        if (mute) this.scene.remove(mute);
    },

    _updateGameOver(dt) {
        this.stageTransitionTimer -= dt;
        Effects.update(dt);

        if (this.stageTransitionTimer <= 0) {
            // Show game over screen
            if (!this.scene.getObjectByName('gameover')) {
                const text = create3DText('GAME OVER', 1.5, 0xff4444);
                text.position.set(0, 5, 0);
                text.name = 'gameover';
                this.scene.add(text);

                const scoreText = create3DText(`SCORE: ${this.score}`, 0.7, 0xffffff);
                scoreText.position.set(0, 3.5, 0);
                scoreText.name = 'govscore';
                this.scene.add(scoreText);

                const retry = create3DText('リトライ', 0.8, 0xffffff);
                retry.position.set(0, 2, 0);
                retry.name = 'goretry';
                this.scene.add(retry);

                const title = create3DText('タイトルへ', 0.8, 0xffffff);
                title.position.set(0, 0.8, 0);
                title.name = 'gotitle';
                this.scene.add(title);

                this.selectedPause = 0;
                this.menuCooldown = 0.3;
            }

            if (this.menuCooldown > 0) return;

            const move = Input.getMove();
            if (move.z !== 0 && this.menuCooldown <= 0) {
                this.selectedPause = this.selectedPause === 0 ? 1 : 0;
                this.menuCooldown = 0.2;
                SoundManager.playMenuSelect();
                ['goretry', 'gotitle'].forEach((name, i) => {
                    const mesh = this.scene.getObjectByName(name);
                    if (mesh && mesh.children[0] && mesh.children[0].material) {
                        mesh.children[0].material.emissive.setHex(i === this.selectedPause ? 0x446644 : 0x111111);
                        mesh.scale.setScalar(i === this.selectedPause ? 1.2 : 1.0);
                    }
                });
            }

            if (Input.isBombAction() || Input.keys['Enter']) {
                Input.keys['Enter'] = false;
                SoundManager.playMenuConfirm();
                ['gameover', 'govscore', 'goretry', 'gotitle'].forEach(name => {
                    const obj = this.scene.getObjectByName(name);
                    if (obj) this.scene.remove(obj);
                });
                if (this.selectedPause === 0) {
                    Player.fullReset();
                    this._loadStage();
                } else {
                    this._clearStage();
                    this._setupTitleScreen();
                }
            }
        }
    },

    _saveProgress() {
        const cleared = this.savedProgress ? (this.savedProgress.cleared || []) : [];
        const key = `${this.world}-${this.stage}`;
        if (!cleared.includes(key)) cleared.push(key);

        let nextWorld = this.world;
        let nextStage = this.stage + 1;
        if (nextStage > STAGES_PER_WORLD) {
            nextWorld++;
            nextStage = 1;
        }
        if (nextWorld > TOTAL_WORLDS) {
            nextWorld = TOTAL_WORLDS;
            nextStage = STAGES_PER_WORLD;
        }

        this.savedProgress = {
            world: nextWorld,
            stage: nextStage,
            score: this.score,
            lives: Player.lives,
            cleared,
        };
        localStorage.setItem('yamamo_progress', JSON.stringify(this.savedProgress));
    },

    render() {
        if (this.state === STATE_TITLE || this.state === STATE_STAGE_SELECT) {
            this.renderer.render(this.titleScene, this.titleCamera);
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    },
};
