// Grid and map constants
const GRID_COLS = 13;
const GRID_ROWS = 11;
const CELL_SIZE = 1;

// Cell types
const CELL_EMPTY = 0;
const CELL_HARD = 1;
const CELL_SOFT = 2;

// Game states
const STATE_TITLE = 'title';
const STATE_STAGE_SELECT = 'stage_select';
const STATE_PLAYING = 'playing';
const STATE_PAUSED = 'paused';
const STATE_STAGE_CLEAR = 'stage_clear';
const STATE_GAME_OVER = 'game_over';
const STATE_BOSS_INTRO = 'boss_intro';
const STATE_WORLD_CLEAR = 'world_clear';
const STATE_ALL_CLEAR = 'all_clear';

// Player defaults
const PLAYER_SPEED_DEFAULT = 3.0;
const PLAYER_SPEED_UP = 0.5;
const PLAYER_SPEED_DOWN = -1.5;
const PLAYER_INITIAL_BOMBS = 1;
const PLAYER_INITIAL_FIRE = 1;
const PLAYER_INITIAL_LIVES = 3;

// Bomb
const BOMB_TIMER = 3.0;
const BOMB_BOUNCE_SPEED = 4.0;

// Item types
const ITEM_BOMB_UP = 'bomb_up';
const ITEM_FIRE_UP = 'fire_up';
const ITEM_SPEED_UP = 'speed_up';
const ITEM_REMOTE = 'remote';
const ITEM_PENETRATE = 'penetrate';
const ITEM_ONE_UP = '1up';
const ITEM_SKULL = 'skull';

// Item drop rates (cumulative)
const ITEM_DROP_TABLE = [
    { type: ITEM_BOMB_UP, rate: 0.20 },
    { type: ITEM_FIRE_UP, rate: 0.40 },
    { type: ITEM_SPEED_UP, rate: 0.55 },
    { type: ITEM_REMOTE, rate: 0.60 },
    { type: ITEM_PENETRATE, rate: 0.65 },
    { type: ITEM_ONE_UP, rate: 0.68 },
    { type: ITEM_SKULL, rate: 0.78 },
    // 22% chance no item
];

// Item colors
const ITEM_COLORS = {
    [ITEM_BOMB_UP]: 0x4444ff,
    [ITEM_FIRE_UP]: 0xff4444,
    [ITEM_SPEED_UP]: 0x44ff44,
    [ITEM_REMOTE]: 0xffff44,
    [ITEM_PENETRATE]: 0xff44ff,
    [ITEM_ONE_UP]: 0x44ffff,
    [ITEM_SKULL]: 0x884488,
};

// Item labels
const ITEM_LABELS = {
    [ITEM_BOMB_UP]: 'B',
    [ITEM_FIRE_UP]: 'F',
    [ITEM_SPEED_UP]: 'S',
    [ITEM_REMOTE]: 'R',
    [ITEM_PENETRATE]: 'P',
    [ITEM_ONE_UP]: '1',
    [ITEM_SKULL]: 'X',
};

// Enemy types
const ENEMY_SLIME = 'slime';
const ENEMY_BAT = 'bat';
const ENEMY_GOLEM = 'golem';
const ENEMY_NINJA = 'ninja';
const ENEMY_GHOST = 'ghost';
const ENEMY_BOMKNIGHT = 'bomknight';

// Enemy stats
const ENEMY_STATS = {
    [ENEMY_SLIME]: { hp: 1, speed: 1.2, color: 0x44cc44, passBlock: false, passWall: false },
    [ENEMY_BAT]: { hp: 1, speed: 2.0, color: 0x8844aa, passBlock: true, passWall: false },
    [ENEMY_GOLEM]: { hp: 2, speed: 1.0, color: 0x886644, passBlock: false, passWall: false },
    [ENEMY_NINJA]: { hp: 1, speed: 4.0, color: 0x222222, passBlock: false, passWall: false },
    [ENEMY_GHOST]: { hp: 1, speed: 2.0, color: 0xccccff, passBlock: true, passWall: true },
    [ENEMY_BOMKNIGHT]: { hp: 1, speed: 2.0, color: 0xcc4400, passBlock: false, passWall: false },
};

// Scoring
const SCORE_ENEMY_BASE = 100;
const SCORE_BOSS_BASE = 1000;
const SCORE_ITEM = 50;
const SCORE_TIME_BONUS = 10;

// Time limit
const STAGE_TIME_LIMIT = 180; // 3 minutes

// World count
const TOTAL_WORLDS = 5;
const STAGES_PER_WORLD = 5;

// Colors
const WORLD_THEMES = {
    1: {
        name: '草原',
        sky: 0x87CEEB,
        ground: 0x4CAF50,
        softBlock: 0x8B6914,
        hardBlock: 0x666666,
        fog: 0x87CEEB,
    },
    2: {
        name: '溶岩洞窟',
        sky: 0x1a0000,
        ground: 0x3d2b1f,
        softBlock: 0x555555,
        hardBlock: 0x333333,
        fog: 0x1a0000,
    },
    3: {
        name: '氷の城',
        sky: 0xc0d8ff,
        ground: 0xaaccee,
        softBlock: 0x88ccff,
        hardBlock: 0x6699bb,
        fog: 0xc0d8ff,
    },
    4: {
        name: '機械要塞',
        sky: 0x2a2a3a,
        ground: 0x555566,
        softBlock: 0x778899,
        hardBlock: 0x444455,
        fog: 0x2a2a3a,
    },
    5: {
        name: '魔王城',
        sky: 0x1a0033,
        ground: 0x2a1a3a,
        softBlock: 0x443366,
        hardBlock: 0x221133,
        fog: 0x1a0033,
    },
};
