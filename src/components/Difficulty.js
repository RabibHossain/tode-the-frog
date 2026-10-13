import { ENEMY_SPAWN_DELAY, ENEMY_SPEED } from './Enemy.js';
import { MOVE_SPEED } from './Player.js';
import { ATTACK_COOLDOWN, ATTACK_RADIUS } from './Attack.js';

// How much the difficulty factor grows per point of score.
// At 0.005 the factor reaches 1 at a score of 200.
const DIFFICULTY_GROWTH_RATE = 0.005;

// How strongly each parameter reacts to the difficulty factor.
// With a factor of 1, a growth of 1 doubles the parameter and 0.25 adds a quarter.
// Enemy values are higher than player values, so the threat always grows faster than the hero.
const ENEMY_SPAWN_GROWTH = 1;
const ENEMY_SPEED_GROWTH = 1;
const PLAYER_SPEED_GROWTH = 0.25;
const ATTACK_COOLDOWN_GROWTH = 0.5;
const ATTACK_RADIUS_GROWTH = 0.25;
// The music speeds up too, so the rising pressure can be heard
const MUSIC_TEMPO_GROWTH = 0.25;

// Enemies never spawn faster than this, in seconds
const MIN_ENEMY_SPAWN_DELAY = 0.3;
// The music never plays faster than this many times its starting tempo
const MAX_MUSIC_TEMPO = 1.75;

const difficulty = {
  enemySpawnDelay: ENEMY_SPAWN_DELAY,
  enemySpeed: ENEMY_SPEED,
  playerSpeed: MOVE_SPEED,
  attackCooldown: ATTACK_COOLDOWN,
  attackRadius: ATTACK_RADIUS,
  musicTempo: 1,
};

// Recalculates the game parameters for the current score.
// Speeds and ranges are multiplied, delays are divided, so they shrink without ever reaching zero.
export function updateDifficulty(score) {
  const factor = score * DIFFICULTY_GROWTH_RATE;

  difficulty.enemySpawnDelay = Math.max(
    ENEMY_SPAWN_DELAY / (1 + factor * ENEMY_SPAWN_GROWTH),
    MIN_ENEMY_SPAWN_DELAY
  );
  difficulty.enemySpeed = ENEMY_SPEED * (1 + factor * ENEMY_SPEED_GROWTH);
  difficulty.playerSpeed = MOVE_SPEED * (1 + factor * PLAYER_SPEED_GROWTH);
  difficulty.attackCooldown = ATTACK_COOLDOWN / (1 + factor * ATTACK_COOLDOWN_GROWTH);
  difficulty.attackRadius = ATTACK_RADIUS * (1 + factor * ATTACK_RADIUS_GROWTH);
  difficulty.musicTempo = Math.min(1 + factor * MUSIC_TEMPO_GROWTH, MAX_MUSIC_TEMPO);

  return difficulty;
}
