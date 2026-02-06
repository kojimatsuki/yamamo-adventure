// Stage definitions
const StageData = {
    getStageConfig(world, stage) {
        const isBoss = stage === 5;
        const config = {
            world,
            stage,
            isBoss,
            softBlockRatio: 0.3 + (world - 1) * 0.02,
            enemies: [],
            gimmicks: [],
            bossType: null,
            fogDistance: null,
        };

        if (isBoss) {
            config.softBlockRatio = 0;
            config.bossType = world;
        }

        // Enemy configuration per world/stage
        switch (world) {
            case 1:
                config.enemies = this._getW1Enemies(stage);
                break;
            case 2:
                config.enemies = this._getW2Enemies(stage);
                config.gimmicks = this._getW2Gimmicks(stage);
                break;
            case 3:
                config.enemies = this._getW3Enemies(stage);
                config.gimmicks = this._getW3Gimmicks(stage);
                break;
            case 4:
                config.enemies = this._getW4Enemies(stage);
                config.gimmicks = this._getW4Gimmicks(stage);
                break;
            case 5:
                config.enemies = this._getW5Enemies(stage);
                config.gimmicks = this._getW5Gimmicks(stage);
                config.fogDistance = stage >= 3 ? 4 : null;
                break;
        }

        return config;
    },

    _getW1Enemies(stage) {
        switch (stage) {
            case 1: return [{ type: ENEMY_SLIME, count: 2 }];
            case 2: return [{ type: ENEMY_SLIME, count: 3 }];
            case 3: return [{ type: ENEMY_SLIME, count: 2 }, { type: ENEMY_BAT, count: 1 }];
            case 4: return [{ type: ENEMY_SLIME, count: 2 }, { type: ENEMY_BAT, count: 2 }];
            case 5: return []; // Boss stage
        }
    },

    _getW2Enemies(stage) {
        switch (stage) {
            case 1: return [{ type: ENEMY_GOLEM, count: 1 }, { type: ENEMY_SLIME, count: 2 }];
            case 2: return [{ type: ENEMY_GOLEM, count: 1 }, { type: ENEMY_BAT, count: 2 }];
            case 3: return [{ type: ENEMY_GOLEM, count: 2 }, { type: ENEMY_SLIME, count: 2 }];
            case 4: return [{ type: ENEMY_GOLEM, count: 2 }, { type: ENEMY_BAT, count: 2 }, { type: ENEMY_SLIME, count: 1 }];
            case 5: return [];
        }
    },

    _getW2Gimmicks(stage) {
        if (stage === 5) return [];
        // Lava tiles
        const gimmicks = [];
        const count = stage + 2;
        for (let i = 0; i < count; i++) {
            gimmicks.push({ type: 'lava', randomPos: true, interval: 3 + Math.random() * 2 });
        }
        return gimmicks;
    },

    _getW3Enemies(stage) {
        switch (stage) {
            case 1: return [{ type: ENEMY_NINJA, count: 1 }, { type: ENEMY_GOLEM, count: 1 }];
            case 2: return [{ type: ENEMY_NINJA, count: 1 }, { type: ENEMY_GHOST, count: 1 }, { type: ENEMY_GOLEM, count: 1 }];
            case 3: return [{ type: ENEMY_NINJA, count: 2 }, { type: ENEMY_GHOST, count: 1 }];
            case 4: return [{ type: ENEMY_NINJA, count: 2 }, { type: ENEMY_GHOST, count: 2 }, { type: ENEMY_GOLEM, count: 1 }];
            case 5: return [];
        }
    },

    _getW3Gimmicks(stage) {
        if (stage === 5) return [];
        const gimmicks = [];
        // Ice patches
        const count = stage * 2 + 2;
        for (let i = 0; i < count; i++) {
            gimmicks.push({ type: 'ice', randomPos: true });
        }
        return gimmicks;
    },

    _getW4Enemies(stage) {
        switch (stage) {
            case 1: return [{ type: ENEMY_BOMKNIGHT, count: 1 }, { type: ENEMY_NINJA, count: 1 }];
            case 2: return [{ type: ENEMY_BOMKNIGHT, count: 1 }, { type: ENEMY_NINJA, count: 2 }];
            case 3: return [{ type: ENEMY_BOMKNIGHT, count: 2 }, { type: ENEMY_GHOST, count: 1 }];
            case 4: return [{ type: ENEMY_BOMKNIGHT, count: 2 }, { type: ENEMY_NINJA, count: 1 }, { type: ENEMY_GHOST, count: 2 }];
            case 5: return [];
        }
    },

    _getW4Gimmicks(stage) {
        if (stage === 5) return [];
        const gimmicks = [];
        // Conveyor belts
        const dirs = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }];
        const count = stage + 1;
        for (let i = 0; i < count; i++) {
            const d = dirs[i % dirs.length];
            gimmicks.push({ type: 'conveyor', randomPos: true, dir: d });
        }
        // Electric traps
        for (let i = 0; i < stage; i++) {
            gimmicks.push({ type: 'electric', randomPos: true, interval: 2 + Math.random() * 2 });
        }
        return gimmicks;
    },

    _getW5Enemies(stage) {
        switch (stage) {
            case 1: return [{ type: ENEMY_SLIME, count: 1 }, { type: ENEMY_NINJA, count: 1 }, { type: ENEMY_GHOST, count: 1 }];
            case 2: return [{ type: ENEMY_GOLEM, count: 1 }, { type: ENEMY_BOMKNIGHT, count: 1 }, { type: ENEMY_BAT, count: 2 }];
            case 3: return [{ type: ENEMY_NINJA, count: 2 }, { type: ENEMY_GHOST, count: 2 }, { type: ENEMY_BOMKNIGHT, count: 1 }];
            case 4: return [{ type: ENEMY_GOLEM, count: 1 }, { type: ENEMY_NINJA, count: 2 }, { type: ENEMY_GHOST, count: 1 }, { type: ENEMY_BOMKNIGHT, count: 2 }];
            case 5: return [];
        }
    },

    _getW5Gimmicks(stage) {
        if (stage === 5) return [];
        const gimmicks = [];
        // Warp zones
        if (stage >= 2) {
            gimmicks.push({ type: 'warp', randomPos: true, pairId: 0 });
            gimmicks.push({ type: 'warp', randomPos: true, pairId: 0 });
        }
        if (stage >= 4) {
            gimmicks.push({ type: 'warp', randomPos: true, pairId: 1 });
            gimmicks.push({ type: 'warp', randomPos: true, pairId: 1 });
        }
        return gimmicks;
    },

    // Get available spawn positions for enemies (away from player start)
    getEnemySpawnPositions(map, count) {
        const positions = [];
        for (let z = 1; z < GRID_ROWS - 1; z++) {
            for (let x = 1; x < GRID_COLS - 1; x++) {
                if (map.grid[z][x] !== CELL_EMPTY) continue;
                // Must be far enough from player start (1,1)
                if (Math.abs(x - 1) + Math.abs(z - 1) < 5) continue;
                positions.push({ gx: x, gz: z });
            }
        }
        shuffleArray(positions);
        return positions.slice(0, count);
    },

    // Get gimmick positions (empty cells not near player)
    getGimmickPositions(map, count) {
        const positions = [];
        for (let z = 2; z < GRID_ROWS - 2; z++) {
            for (let x = 2; x < GRID_COLS - 2; x++) {
                if (map.grid[z][x] !== CELL_EMPTY) continue;
                if (Math.abs(x - 1) + Math.abs(z - 1) < 4) continue;
                positions.push({ gx: x, gz: z });
            }
        }
        shuffleArray(positions);
        return positions.slice(0, count);
    },

    // World clear messages
    getWorldClearMessage(world) {
        const messages = {
            1: 'やまもは草原を抜け、\n次なる試練が待つ溶岩洞窟へ向かった...',
            2: '灼熱の洞窟を超え、\nやまもは氷に包まれた城へと足を踏み入れた...',
            3: '氷の城を攻略し、\nやまもは機械要塞の前に立った...',
            4: '鉄の要塞を突破し、\nやまもはついに魔王城への扉を開いた...',
            5: '魔王オニヅカを倒し、世界に平和が戻った！\nやまもの冒険は伝説となった...',
        };
        return messages[world] || '';
    },
};
