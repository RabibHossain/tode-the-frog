import * as THREE from 'three';
import './style.css';
import {
  clearPlayerInput,
  createPlayer,
  placePlayer,
  PLAYER_CAUGHT,
  resetPlayer,
  stopPlayer,
  takeQueuedDirection,
  updatePlayer,
} from './components/Player.js';
import {
  createShelters,
  enterHouse,
  EXIT_PUSH_RADIUS,
  isHiding,
  isHouseOpen,
  leaveHouse,
  resetShelters,
  updateShelters,
} from './components/Shelter.js';
import {
  ANIMATION_FLY,
  ANIMATION_IDLE,
  ANIMATION_HEADBUTT,
  createEnemy,
  damageEnemy,
  faceEnemyToward,
  knockBackEnemy,
  pickEnemyType,
  playEnemyDeath,
  setEnemyAnimation,
  updateEnemy,
  updateEnemyAnimation,
} from './components/Enemy.js';
import {
  clearAttackRequest,
  createAttack,
  resetAttack,
  updateAttack,
} from './components/Attack.js';
import { updateDifficulty } from './components/Difficulty.js';
import { createMap, MAP_HALF_SIZE, TILE_SIZE } from './components/Map.js';
import { createHouses } from './components/House.js';
import { createScenery } from './components/Scenery.js';
import { createDecoration } from './components/Decoration.js';
import { createFence } from './components/Fence.js';
import { createCamera } from './components/Camera.js';
import { createRenderer } from './components/Renderer.js';
import {
  createScore,
  getHighScore,
  getScore,
  resetHighScore,
  resetScore,
  saveHighScore,
  updateScore,
} from './components/Score.js';
import {
  createPowerUps,
  getActivePowerUps,
  getPowerUpModifiers,
  resetPowerUps,
  updatePowerUps,
  useShield,
} from './components/PowerUp.js';
import { createPowerUpDisplay, updatePowerUpDisplay } from './components/PowerUpDisplay.js';
import {
  clearGameOverBest,
  createGameOver,
  hideGameOver,
  showGameOver,
} from './components/GameOver.js';
import {
  HINT_CONFIRM,
  HINT_DONE,
  HINT_IDLE,
  updateHighScoreHints,
} from './components/HighScoreHint.js';
import { createStartScreen, hideStartScreen } from './components/StartScreen.js';
import { createPause, hidePause, showPause } from './components/Pause.js';
import { createTouchControls, isPortrait, onTurnedPortrait } from './components/Touch.js';
import {
  closeSettings,
  createSettings,
  isSettingsOpen,
  openSettings,
} from './components/Settings.js';
import {
  createSound,
  pauseAudio,
  playDefeat,
  playEnemyHurt,
  playEnterHouse,
  playGameOver,
  playHighScore,
  playLeaveHouse,
  playHit,
  playShieldBreak,
  playStart,
  resumeAudio,
} from './components/Sound.js';
import { setMusicTempo, startMusic, stopMusic, updateMusic } from './components/Music.js';

const scene = new THREE.Scene();

const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(-100, -100, 200);
scene.add(directionalLight);

const map = createMap();
scene.add(map);
map.add(createFence());

const player = createPlayer();
scene.add(player);

const camera = createCamera();
player.add(camera);

createPowerUps(player);

const attack = createAttack(player);

const renderer = createRenderer();

createScore();
createPowerUpDisplay();
createGameOver();
createPause();
createStartScreen();
createSound();
createTouchControls();
createSettings(toggleSettings);
updateHighScoreHints(getHighScore(), HINT_IDLE);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// The centres of the four corner tiles
const SPAWN_DISTANCE = MAP_HALF_SIZE - TILE_SIZE / 2;
const SPAWN_POINTS = [
  { x: -SPAWN_DISTANCE, y: -SPAWN_DISTANCE },
  { x: SPAWN_DISTANCE, y: -SPAWN_DISTANCE },
  { x: SPAWN_DISTANCE, y: SPAWN_DISTANCE },
  { x: -SPAWN_DISTANCE, y: SPAWN_DISTANCE },
];

// Houses stay clear of the player's starting point and the enemy spawn points
const houses = createHouses(map, [player.position, ...SPAWN_POINTS]);
const scenery = createScenery(map, houses, [player.position, ...SPAWN_POINTS]);
// Everything that blocks movement. Only the houses can also be hidden in.
const obstacles = [...houses, ...scenery];
createDecoration(map, houses, scenery);
createShelters(scene);

const enemies = [];
let spawnTimer = 0;
let nextSpawnIndex = 0;

// Without a `type`, a normal enemy is spawned
function spawnEnemy(spawnPoint, type) {
  const enemy = createEnemy(spawnPoint.x, spawnPoint.y, type);
  enemies.push(enemy);
  scene.add(enemy);
}

// Enemies that were hit and are still playing their death animation.
// They are no longer in `enemies`, so they can't block, hurt, or be hit again.
const dyingEnemies = [];

function defeatEnemy(enemy) {
  const duration = playEnemyDeath(enemy);
  if (duration === 0) {
    scene.remove(enemy);
    return;
  }

  enemy.userData.deathRemaining = duration;
  dyingEnemies.push(enemy);
}

// Runs on every frame, in every game state, so enemies keep hovering on the start and "Game Over" screens
function updateAnimations(delta) {
  for (const enemy of enemies) {
    updateEnemyAnimation(enemy, delta);
  }

  // Going backwards so removing an enemy doesn't skip the next one
  for (let i = dyingEnemies.length - 1; i >= 0; i--) {
    const enemy = dyingEnemies[i];
    updateEnemyAnimation(enemy, delta);

    enemy.userData.deathRemaining -= delta;
    if (enemy.userData.deathRemaining <= 0) {
      scene.remove(enemy);
      dyingEnemies.splice(i, 1);
    }
  }
}

function setEnemyAnimations(name) {
  for (const enemy of enemies) {
    setEnemyAnimation(enemy, name);
  }
}

// Start with one enemy in every corner, hovering in place behind the start screen
SPAWN_POINTS.forEach((spawnPoint) => spawnEnemy(spawnPoint));
setEnemyAnimations(ANIMATION_IDLE);

// When an enemy catches Tode, it headbutts him before the "Game Over" screen comes up.
// Seconds into the headbutt at which it lands and Tode disappears.
// In the animation the enemy leans back first and strikes at about 0.3 seconds.
const HEADBUTT_HIT_TIME = 0.3;
// Seconds until the "Game Over" screen appears, so the headbutt can be seen (it is over after about 0.55)
const GAME_OVER_SCREEN_DELAY = 0.8;
// Seconds the "Game Over" screen ignores Space, so a late attack press doesn't restart by accident
const RESET_DELAY = 0.5;

// The game is always in one of these states: start → playing → game over → playing → ...
// Playing can be paused and continued at any time.
const STATE_START = 'start';
const STATE_PLAYING = 'playing';
const STATE_PAUSED = 'paused';
const STATE_GAME_OVER = 'gameOver';

let gameState = STATE_START;
let gameOverTime = 0;
let isGameOverScreenShown = false;
// Set by Space on the start and "Game Over" screens, handled in the animation loop
let startRequested = false;

window.addEventListener('keydown', (event) => {
  // Nothing starts while the "turn your phone" screen or the help screen covers the game
  if (event.code !== 'Space' || event.repeat || isPortrait() || isSettingsOpen()) return;

  if (gameState === STATE_START) startRequested = true;
  if (gameState === STATE_GAME_OVER && gameOverTime >= GAME_OVER_SCREEN_DELAY + RESET_DELAY) {
    startRequested = true;
  }
});

function pauseGame() {
  gameState = STATE_PAUSED;
  showPause();
  pauseAudio();
}

function resumeGame() {
  gameState = STATE_PLAYING;
  hidePause();
  resumeAudio();

  // Keys pressed while paused must not turn into hops or an attack now
  clearPlayerInput();
  clearAttackRequest();
}

// Opens or closes the help and settings screen. Opening it in the middle of a game pauses the game;
// after closing, the "Paused" screen is waiting, so nothing starts moving by surprise.
function toggleSettings() {
  if (isSettingsOpen()) {
    closeSettings();
    return;
  }

  if (gameState === STATE_PLAYING) pauseGame();
  openSettings();
}

// H opens and closes the help screen. P or Escape pauses the game and continues it.
window.addEventListener('keydown', (event) => {
  if (event.repeat) return;

  const isHelpKey = event.code === 'KeyH';
  const isPauseKey = event.code === 'KeyP' || event.code === 'Escape';

  // While the help screen is open, Escape closes it and the pause keys do nothing else
  if (isSettingsOpen()) {
    if (isHelpKey || event.code === 'Escape') toggleSettings();
    return;
  }
  if (isHelpKey) {
    toggleSettings();
    return;
  }
  if (!isPauseKey) return;

  if (gameState === STATE_PLAYING) pauseGame();
  else if (gameState === STATE_PAUSED && !isPortrait()) resumeGame();
});

// Switching to another tab or minimising the window pauses the game too
document.addEventListener('visibilitychange', () => {
  if (document.hidden && gameState === STATE_PLAYING) pauseGame();
});

// So does turning a phone upright, where the "turn your phone" screen covers the game
onTurnedPortrait(() => {
  if (gameState === STATE_PLAYING) pauseGame();
});

// Resetting the high score takes two presses of R, so it can't happen by accident.
// Milliseconds the second press has to follow the first
const RESET_CONFIRM_TIME = 3000;
// The moment until which a second press of R counts as the confirmation
let resetConfirmUntil = 0;

window.addEventListener('keydown', (event) => {
  if (event.code !== 'KeyR' || event.repeat || isSettingsOpen()) return;

  // Only on the start screen and the "Game Over" screen, never in the middle of a game
  const isOnScreen =
    gameState === STATE_START || (gameState === STATE_GAME_OVER && isGameOverScreenShown);
  if (!isOnScreen || getHighScore() === 0) return;

  const now = performance.now();
  if (now < resetConfirmUntil) {
    resetConfirmUntil = 0;
    resetHighScore();
    clearGameOverBest();
    updateHighScoreHints(getHighScore(), HINT_DONE);
    return;
  }

  resetConfirmUntil = now + RESET_CONFIRM_TIME;
  updateHighScoreHints(getHighScore(), HINT_CONFIRM);
  // Without a second press the hint goes back to normal
  setTimeout(() => {
    if (resetConfirmUntil !== 0 && performance.now() >= resetConfirmUntil) {
      resetConfirmUntil = 0;
      updateHighScoreHints(getHighScore(), HINT_IDLE);
    }
  }, RESET_CONFIRM_TIME);
});

// `catcher` is the enemy that touched Tode
function endGame(catcher) {
  gameState = STATE_GAME_OVER;
  gameOverTime = 0;
  isGameOverScreenShown = false;
  startRequested = false;

  stopMusic();

  // Tode freezes where he is, and stays visible until the headbutt lands
  resetAttack(attack);
  setEnemyAnimations(ANIMATION_IDLE);
  faceEnemyToward(catcher, player.position.x, player.position.y);
  setEnemyAnimation(catcher, ANIMATION_HEADBUTT);
}

// Plays out the moments after Tode is caught: the headbutt lands, then the "Game Over" screen appears
function updateGameOver(delta) {
  gameOverTime += delta;

  if (player.visible && gameOverTime >= HEADBUTT_HIT_TIME) {
    player.visible = false;
    playHit();
  }

  if (!isGameOverScreenShown && gameOverTime >= GAME_OVER_SCREEN_DELAY) {
    isGameOverScreenShown = true;
    setEnemyAnimations(ANIMATION_IDLE);
    const isNewHighScore = saveHighScore();
    showGameOver(getScore(), getHighScore(), isNewHighScore);
    updateHighScoreHints(getHighScore(), HINT_IDLE);
    if (isNewHighScore) playHighScore();
    else playGameOver();
  }
}

// The enemy closest to Tode, used when Tode is the one who runs into an enemy
function findNearestEnemy() {
  let nearest = null;
  let nearestDistance = Infinity;

  for (const enemy of enemies) {
    const distance = enemy.position.distanceTo(player.position);
    if (distance < nearestDistance) {
      nearest = enemy;
      nearestDistance = distance;
    }
  }
  return nearest;
}

// Starts a fresh game, both from the start screen and after "Game Over"
function resetGame() {
  gameState = STATE_PLAYING;
  startRequested = false;
  resetConfirmUntil = 0;

  resetPlayer(player);
  resetAttack(attack);
  resetPowerUps(scene);
  resetShelters(houses);
  resetScore();
  hideStartScreen();
  hideGameOver();
  playStart();
  startMusic();

  for (const enemy of [...enemies, ...dyingEnemies]) {
    scene.remove(enemy);
  }
  enemies.length = 0;
  dyingEnemies.length = 0;
  spawnTimer = 0;
  nextSpawnIndex = 0;
  SPAWN_POINTS.forEach((spawnPoint) => spawnEnemy(spawnPoint));
}

// The shield stops one enemy: that enemy is defeated instead of Tode
function blockWithShield(catcher) {
  enemies.splice(enemies.indexOf(catcher), 1);
  defeatEnemy(catcher);
  updateScore(0, catcher.userData.value);
  playShieldBreak();
}

// Tode slips into an open house. While he hides, the monsters lose track of him and hover in place.
function enterShelter(house) {
  stopPlayer();
  clearAttackRequest();
  player.visible = false;

  enterHouse(house);
  setEnemyAnimations(ANIMATION_IDLE);
  playEnterHouse();
}

// Tode comes back out, in `direction` if he chose one. Monsters near the door are pushed back,
// so stepping out is not an instant "Game Over".
function leaveShelter(direction) {
  const exit = leaveHouse(player, direction, obstacles, enemies);
  placePlayer(player, exit.x, exit.y, exit.direction);
  clearAttackRequest();

  setEnemyAnimations(ANIMATION_FLY);
  for (const enemy of enemies) {
    if (enemy.position.distanceTo(player.position) <= EXIT_PUSH_RADIUS) {
      knockBackEnemy(enemy, player, obstacles);
    }
  }
  playLeaveHouse();
}

// Runs one frame of gameplay. Returns the enemy that touched the player, or null.
function updateGame(delta) {
  // The game gets harder as the score grows
  const difficulty = updateDifficulty(getScore());
  setMusicTempo(difficulty.musicTempo);

  const isHideTimeUp = updateShelters(houses, delta);

  // While Tode hides, the rest of the game waits: nothing moves, spawns or scores.
  // An arrow key lets him out early, on that side of the house.
  if (isHiding()) {
    const direction = takeQueuedDirection();
    if (direction || isHideTimeUp) leaveShelter(direction);
    return null;
  }

  // Tea cups Tode has picked up make him faster or his attack stronger for a while
  const modifiers = getPowerUpModifiers();

  const hit = updatePlayer(player, delta, enemies, obstacles, difficulty.playerSpeed * modifiers.speed);
  if (hit === PLAYER_CAUGHT) return findNearestEnemy();
  // Hopping into an open house takes Tode inside; a closed one just blocks him
  if (hit && isHouseOpen(hit)) {
    enterShelter(hit);
    return null;
  }
  updatePowerUps(scene, player, obstacles, delta);

  const hits = updateAttack(
    attack,
    player,
    enemies,
    delta,
    difficulty.attackCooldown * modifiers.attackCooldown,
    difficulty.attackRadius * modifiers.attackRadius
  );
  // A hit defeats most enemies; a tougher one loses health, flinches and is pushed back
  let defeatedCount = 0;
  let defeatedValue = 0;
  let survivorCount = 0;
  for (const enemy of hits) {
    if (damageEnemy(enemy)) {
      enemies.splice(enemies.indexOf(enemy), 1);
      defeatEnemy(enemy);
      defeatedCount++;
      defeatedValue += enemy.userData.value;
    } else {
      knockBackEnemy(enemy, player, obstacles);
      survivorCount++;
    }
  }
  if (defeatedCount > 0) playDefeat(defeatedCount);
  if (survivorCount > 0) playEnemyHurt();
  updateScore(delta, defeatedValue);

  spawnTimer += delta;
  while (spawnTimer >= difficulty.enemySpawnDelay) {
    spawnTimer -= difficulty.enemySpawnDelay;
    spawnEnemy(SPAWN_POINTS[nextSpawnIndex], pickEnemyType(getScore()));
    nextSpawnIndex = (nextSpawnIndex + 1) % SPAWN_POINTS.length;
  }

  for (const enemy of enemies) {
    if (updateEnemy(enemy, player, delta, enemies, obstacles, difficulty.enemySpeed)) return enemy;
  }

  return null;
}

const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  // Capped so a paused tab doesn't cause one huge catch-up step
  const delta = Math.min(clock.getDelta(), 0.1);

  if (gameState === STATE_PLAYING) {
    const catcher = updateGame(delta);
    if (catcher) {
      if (useShield()) blockWithShield(catcher);
      else endGame(catcher);
    }
  } else if (gameState !== STATE_PAUSED) {
    // On the start and "Game Over" screens the world stays frozen until Space is pressed
    if (gameState === STATE_GAME_OVER) updateGameOver(delta);
    if (startRequested) resetGame();
  }

  // While paused nothing moves at all: no animations, no music, no timers
  if (gameState !== STATE_PAUSED) {
    updateAnimations(delta);
    updateMusic();
    updatePowerUpDisplay(getActivePowerUps());
  }

  renderer.render(scene, camera);
});
