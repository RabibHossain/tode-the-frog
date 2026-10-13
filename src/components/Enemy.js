import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import {
  canMoveTo,
  collidesAt,
  computeCollisionRadius,
  isBlockedByBoxes,
  updateModelMatrices,
} from './Collision.js';
import { isInsideMap } from './Map.js';

// BASE_URL is the folder the game is served from, so this also works in a sub-folder
const MODEL_URL = `${import.meta.env.BASE_URL}models/enemy.glb`;
const MODEL_SCALE = 5;

// Units per second at the start of the game
export const ENEMY_SPEED = 50;
// Seconds between enemy spawns at the start of the game
export const ENEMY_SPAWN_DELAY = 2;

export const ENEMY_NORMAL = 'normal';
export const ENEMY_SCOUT = 'scout';
export const ENEMY_BRUTE = 'brute';

// All types use the same model, changed in size and colour.
// - `scale` and `speed` multiply the normal size and speed
// - `health` is how many attacks the enemy takes
// - `value` is how many normal enemies it counts as for the score
// - `tint` is a colour blended into the model (none for the normal enemy)
// - `from` is the score at which the type starts to appear, `rampScore` how many points later
//   it reaches `maxChance`, its highest share of the spawns
export const ENEMY_TYPES = {
  [ENEMY_NORMAL]: { scale: 1, speed: 1, health: 1, value: 1, tint: null },
  [ENEMY_SCOUT]: {
    scale: 0.75,
    speed: 1.6,
    health: 1,
    value: 1.5,
    tint: 0xe07a6a,
    from: 30,
    rampScore: 200,
    maxChance: 0.35,
  },
  [ENEMY_BRUTE]: {
    scale: 1.6,
    speed: 0.6,
    health: 2,
    value: 3,
    tint: 0x7a6fc0,
    from: 80,
    rampScore: 300,
    maxChance: 0.25,
  },
};
// How strongly the tint replaces the model's own colours, from 0 (not at all) to 1 (fully)
const TINT_STRENGTH = 0.55;
// How far an enemy is pushed back by an attack it survives
const KNOCKBACK_DISTANCE = 30;

// The animations used from the model file, by the end of their clip name
export const ANIMATION_FLY = 'Fast_Flying';
export const ANIMATION_IDLE = 'Flying_Idle';
export const ANIMATION_HEADBUTT = 'Headbutt';
const ANIMATION_HIT = 'HitReact';
const ANIMATION_DEATH = 'Death';
// These play once and hold their last pose; the others loop
const ONE_SHOT_ANIMATIONS = [ANIMATION_DEATH, ANIMATION_HEADBUTT, ANIMATION_HIT];
// Seconds for one animation to blend into the next
const ANIMATION_FADE = 0.2;

// The model is loaded once and cloned for every enemy
let modelPromise = null;
let collisionRadius = 0;
let animationClips = [];

function loadModel() {
  if (!modelPromise) {
    modelPromise = new GLTFLoader().loadAsync(MODEL_URL).then((gltf) => {
      const model = gltf.scene;

      // The model is authored Y-up, the game world is Z-up
      model.rotation.x = Math.PI / 2;
      model.scale.setScalar(MODEL_SCALE);

      // Lift the model so its lowest point sits on top of the ground (Z = 0)
      updateModelMatrices(model);
      const box = new THREE.Box3().setFromObject(model);
      model.position.z = -box.min.z;

      collisionRadius = computeCollisionRadius(model);
      animationClips = gltf.animations;

      return model;
    });
  }
  return modelPromise;
}

// Clip names look like "CharacterArmature|Fast_Flying"
function findClip(name) {
  return animationClips.find((clip) => clip.name.endsWith(name));
}

// Every enemy gets its own mixer (the object that plays animations), so each one moves on its own
function createAnimations(enemy, model) {
  const mixer = new THREE.AnimationMixer(model);
  const actions = {};

  const names = [ANIMATION_FLY, ANIMATION_IDLE, ANIMATION_DEATH, ANIMATION_HEADBUTT, ANIMATION_HIT];
  for (const name of names) {
    const clip = findClip(name);
    if (!clip) continue;

    const action = mixer.clipAction(clip);
    if (ONE_SHOT_ANIMATIONS.includes(name)) {
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
    }
    actions[name] = action;
  }

  enemy.userData.mixer = mixer;
  enemy.userData.actions = actions;

  // After flinching from a hit, the enemy goes back to flying
  mixer.addEventListener('finished', (event) => {
    const isFlinchOver =
      event.action === actions[ANIMATION_HIT] && enemy.userData.animation === ANIMATION_HIT;
    if (isFlinchOver) setEnemyAnimation(enemy, ANIMATION_FLY);
  });

  const name = enemy.userData.animation;
  const current = actions[name];
  if (current) {
    // Looping animations start at a random point, so the enemies don't all flap in step
    if (!ONE_SHOT_ANIMATIONS.includes(name)) {
      current.time = Math.random() * current.getClip().duration;
    }
    current.play();
  }
}

// Tinted copies of the model's materials, made once per type and shared by all its enemies
const tintedMaterials = new Map();

function getTintedMaterial(material, typeName) {
  const key = `${typeName}:${material.uuid}`;
  if (!tintedMaterials.has(key)) {
    const tinted = material.clone();
    tinted.color.lerp(new THREE.Color(ENEMY_TYPES[typeName].tint), TINT_STRENGTH);
    tintedMaterials.set(key, tinted);
  }
  return tintedMaterials.get(key);
}

// Picks the type of the next enemy. Only normal enemies appear at first;
// the stronger types join in as the score grows.
export function pickEnemyType(score) {
  let roll = Math.random();

  for (const name of [ENEMY_BRUTE, ENEMY_SCOUT]) {
    const { from, rampScore, maxChance } = ENEMY_TYPES[name];
    const chance = THREE.MathUtils.clamp((score - from) / rampScore, 0, 1) * maxChance;
    if (roll < chance) return name;
    roll -= chance;
  }
  return ENEMY_NORMAL;
}

export function createEnemy(x, y, typeName = ENEMY_NORMAL) {
  const type = ENEMY_TYPES[typeName];

  const enemy = new THREE.Group();
  enemy.position.set(x, y, 0);
  // Scaling the group keeps the model's feet on the ground
  enemy.scale.setScalar(type.scale);
  enemy.userData.type = typeName;
  enemy.userData.health = type.health;
  enemy.userData.speed = type.speed;
  enemy.userData.value = type.value;
  // The side this enemy goes round obstacles: 1 or -1. Each enemy keeps to its own side,
  // so it walks all the way round instead of dithering in front of a wall.
  enemy.userData.detourSide = Math.random() < 0.5 ? 1 : -1;
  // The animation the enemy should be playing; applied once the model has loaded
  enemy.userData.animation = ANIMATION_FLY;

  loadModel()
    .then((source) => {
      const model = clone(source);
      if (type.tint !== null) {
        model.traverse((child) => {
          if (child.isMesh) child.material = getTintedMaterial(child.material, typeName);
        });
      }

      enemy.add(model);
      enemy.userData.radius = collisionRadius * type.scale;
      createAnimations(enemy, model);
    })
    .catch((error) => {
      console.error(`Failed to load ${MODEL_URL}`, error);
    });

  return enemy;
}

// Blends the enemy from its current animation into another one
export function setEnemyAnimation(enemy, name) {
  const previous = enemy.userData.animation;
  if (previous === name) return;
  enemy.userData.animation = name;

  const actions = enemy.userData.actions;
  if (!actions) return;

  actions[previous]?.fadeOut(ANIMATION_FADE);
  actions[name]?.reset().fadeIn(ANIMATION_FADE).play();
}

// Starts the death animation. Returns how many seconds it lasts,
// or 0 if there is nothing to play (the model has not loaded yet).
export function playEnemyDeath(enemy) {
  const death = enemy.userData.actions?.[ANIMATION_DEATH];
  if (!death) return 0;

  setEnemyAnimation(enemy, ANIMATION_DEATH);
  return death.getClip().duration;
}

// Takes one point of health off the enemy. Returns true if that defeats it.
export function damageEnemy(enemy) {
  enemy.userData.health -= 1;
  return enemy.userData.health <= 0;
}

// An enemy that survives an attack flinches and is pushed away from the player,
// unless a house or the edge of the map is in the way
export function knockBackEnemy(enemy, player, houses) {
  setEnemyAnimation(enemy, ANIMATION_HIT);

  const dx = enemy.position.x - player.position.x;
  const dy = enemy.position.y - player.position.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return;

  const x = enemy.position.x + (dx / distance) * KNOCKBACK_DISTANCE;
  const y = enemy.position.y + (dy / distance) * KNOCKBACK_DISTANCE;
  if (isInsideMap(x, y) && !isBlockedByBoxes(enemy, x, y, houses)) {
    enemy.position.x = x;
    enemy.position.y = y;
  }
}

// Turns the enemy to look at the point (x, y)
export function faceEnemyToward(enemy, x, y) {
  enemy.rotation.z = Math.atan2(x - enemy.position.x, -(y - enemy.position.y));
}

// Advances the enemy's animation by `delta` seconds
export function updateEnemyAnimation(enemy, delta) {
  enemy.userData.mixer?.update(delta);
}

// Moves the enemy toward the player without overlapping the other `enemies` or the `obstacles`
// (houses, trees and rocks).
// Returns true if the enemy reaches the player, which ends the game.
export function updateEnemy(enemy, player, delta, enemies, obstacles, speed) {
  const dx = player.position.x - enemy.position.x;
  const dy = player.position.y - enemy.position.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return true;

  faceEnemyToward(enemy, player.position.x, player.position.y);

  // Never step past the player
  const step = Math.min(speed * enemy.userData.speed * delta, distance);
  const stepX = (dx / distance) * step;
  const stepY = (dy / distance) * step;
  const nextX = enemy.position.x + stepX;
  const nextY = enemy.position.y + stepY;

  // Touching the player takes priority over every other collision rule
  if (collidesAt(enemy, nextX, nextY, player)) return true;

  const isFree = (x, y) =>
    canMoveTo(enemy, x, y, enemies) && !isBlockedByBoxes(enemy, x, y, obstacles);
  const moveTo = (x, y) => {
    enemy.position.x = x;
    enemy.position.y = y;
  };

  // Move only if the next position is free
  if (isFree(nextX, nextY)) {
    moveTo(nextX, nextY);
  } else if (isBlockedByBoxes(enemy, nextX, nextY, obstacles)) {
    // A house, tree or rock is in the way: step sideways along it, on this enemy's own side.
    // If that side is blocked too, try the other one.
    const side = enemy.userData.detourSide;
    const sideX = -stepY * side;
    const sideY = stepX * side;

    if (isFree(enemy.position.x + sideX, enemy.position.y + sideY)) {
      moveTo(enemy.position.x + sideX, enemy.position.y + sideY);
    } else if (isFree(enemy.position.x - sideX, enemy.position.y - sideY)) {
      moveTo(enemy.position.x - sideX, enemy.position.y - sideY);
    }
  } else if (isFree(nextX, enemy.position.y)) {
    // Another enemy is in the way: slide along one axis, so they flow around each other
    enemy.position.x = nextX;
  } else if (isFree(enemy.position.x, nextY)) {
    enemy.position.y = nextY;
  }

  return false;
}
