import * as THREE from 'three';
import { isBlockedByBoxes } from './Collision.js';
import { isInsideMap, MAP_HALF_SIZE, TILE_SIZE } from './Map.js';
import { playPowerUp } from './Sound.js';

export const POWER_UP_SPEED = 'speed';
export const POWER_UP_ATTACK = 'attack';
export const POWER_UP_SHIELD = 'shield';

// `duration` is in seconds. The shield has none: it lasts until it blocks one enemy.
export const POWER_UP_TYPES = {
  [POWER_UP_SPEED]: { label: 'Speed', color: 0x6fb7e8, duration: 6 },
  [POWER_UP_ATTACK]: { label: 'Big attack', color: 0xf2c14e, duration: 6 },
  [POWER_UP_SHIELD]: { label: 'Shield', color: 0xb48ee0, duration: Infinity },
};
const TYPE_NAMES = Object.keys(POWER_UP_TYPES);

// What the timed power-ups change
const SPEED_MULTIPLIER = 1.6;
const ATTACK_RADIUS_MULTIPLIER = 1.6;
const ATTACK_COOLDOWN_MULTIPLIER = 0.5;

// Seconds between new tea cups, and how long one waits to be picked up
const SPAWN_DELAY = 8;
const LIFETIME = 12;
// In its last seconds a cup blinks to show it is about to disappear
const BLINK_TIME = 3;
const BLINK_INTERVAL = 0.15;
const MAX_ON_MAP = 2;

// How close Tode has to be to pick a cup up
const PICKUP_DISTANCE = 16;
// New cups keep at least this far from Tode, so they are never picked up by accident
const MIN_SPAWN_DISTANCE = 80;
const MAX_PLACEMENT_TRIES = 20;
// Room a cup needs around it, used to keep cups out of houses
const CUP_CLEARANCE = 12;

const CUP_COLOR = 0xf6f1e7;
const CUP_SCALE = 1.4;
// Height the cup floats at, and how far it bobs up and down
const FLOAT_HEIGHT = 9;
const FLOAT_RANGE = 2;
const SPIN_SPEED = 1.5;

const SHIELD_RADIUS = 16;
const SHIELD_OPACITY = 0.3;

// Tea cups waiting on the map, and the power-ups Tode currently has (type → seconds left)
const cups = [];
const active = new Map();

let spawnTimer = 0;
let shield = null;

// Shapes and materials are shared by all cups
const cupMaterial = new THREE.MeshLambertMaterial({ color: CUP_COLOR });
const bodyGeometry = new THREE.CylinderGeometry(5, 3.5, 6, 20);
const handleGeometry = new THREE.TorusGeometry(2.2, 0.6, 8, 16);
const teaGeometry = new THREE.CircleGeometry(4.4, 20);
const glowGeometry = new THREE.RingGeometry(7, 10, 32);
const colorMaterials = {};

function getColorMaterial(type) {
  colorMaterials[type] ??= new THREE.MeshBasicMaterial({
    color: POWER_UP_TYPES[type].color,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  return colorMaterials[type];
}

// A tea cup built from simple shapes. The colour of the tea and of the ring on the ground shows its type.
function createCup(type, x, y) {
  const cup = new THREE.Group();
  cup.position.set(x, y, 0);
  cup.userData.type = type;
  cup.userData.age = 0;

  // The shapes are made Y-up, the game world is Z-up
  const model = new THREE.Group();
  model.rotation.x = Math.PI / 2;
  model.scale.setScalar(CUP_SCALE);

  const body = new THREE.Mesh(bodyGeometry, cupMaterial);

  const handle = new THREE.Mesh(handleGeometry, cupMaterial);
  handle.position.x = 5.2;

  const tea = new THREE.Mesh(teaGeometry, getColorMaterial(type));
  tea.rotation.x = -Math.PI / 2;
  tea.position.y = 3.05;

  model.add(body, handle, tea);

  const glow = new THREE.Mesh(glowGeometry, getColorMaterial(type));
  glow.position.z = 0.3;

  cup.add(model, glow);
  cup.userData.model = model;

  return cup;
}

// Picks the centre of a random tile that is free of houses and not right next to Tode
function pickPosition(player, houses) {
  const tilesFromCentre = Math.floor(MAP_HALF_SIZE / TILE_SIZE);
  const probe = { userData: { radius: CUP_CLEARANCE } };

  for (let tries = 0; tries < MAX_PLACEMENT_TRIES; tries++) {
    const x = THREE.MathUtils.randInt(-tilesFromCentre, tilesFromCentre) * TILE_SIZE;
    const y = THREE.MathUtils.randInt(-tilesFromCentre, tilesFromCentre) * TILE_SIZE;

    const isFarFromPlayer =
      Math.hypot(x - player.position.x, y - player.position.y) >= MIN_SPAWN_DISTANCE;
    if (isInsideMap(x, y) && isFarFromPlayer && !isBlockedByBoxes(probe, x, y, houses)) {
      return { x, y };
    }
  }
  return null;
}

function spawnCup(scene, player, houses) {
  const position = pickPosition(player, houses);
  if (!position) return;

  const type = TYPE_NAMES[THREE.MathUtils.randInt(0, TYPE_NAMES.length - 1)];
  const cup = createCup(type, position.x, position.y);
  cups.push(cup);
  scene.add(cup);
}

function updateCup(cup, delta) {
  cup.userData.age += delta;
  const age = cup.userData.age;

  const model = cup.userData.model;
  model.position.z = FLOAT_HEIGHT + Math.sin(age * 3) * FLOAT_RANGE;
  // The model is turned Y-up to Z-up, so its own Y axis is the one that points to the sky
  model.rotation.y = age * SPIN_SPEED;

  const timeLeft = LIFETIME - age;
  cup.visible = timeLeft > BLINK_TIME || Math.floor(timeLeft / BLINK_INTERVAL) % 2 === 0;
}

// Creates the shield bubble around Tode. It is only shown while he has the shield power-up.
export function createPowerUps(player) {
  const geometry = new THREE.SphereGeometry(SHIELD_RADIUS, 24, 16);
  const material = new THREE.MeshBasicMaterial({
    color: POWER_UP_TYPES[POWER_UP_SHIELD].color,
    transparent: true,
    opacity: SHIELD_OPACITY,
    depthWrite: false,
  });

  shield = new THREE.Mesh(geometry, material);
  shield.position.z = SHIELD_RADIUS * 0.5;
  shield.visible = false;
  player.add(shield);
}

// Removes all cups and ends all active power-ups
export function resetPowerUps(scene) {
  for (const cup of cups) {
    scene.remove(cup);
  }
  cups.length = 0;
  active.clear();
  spawnTimer = 0;
  shield.visible = false;
}

// Spawns, animates and removes the cups, lets Tode pick them up, and counts down the active power-ups
export function updatePowerUps(scene, player, houses, delta) {
  spawnTimer += delta;
  if (spawnTimer >= SPAWN_DELAY) {
    spawnTimer = 0;
    if (cups.length < MAX_ON_MAP) spawnCup(scene, player, houses);
  }

  // Going backwards so removing a cup doesn't skip the next one
  for (let i = cups.length - 1; i >= 0; i--) {
    const cup = cups[i];
    updateCup(cup, delta);

    const distance = Math.hypot(
      cup.position.x - player.position.x,
      cup.position.y - player.position.y
    );
    const isPickedUp = distance <= PICKUP_DISTANCE;

    if (isPickedUp) {
      // Picking up a second cup of the same type starts its time again
      active.set(cup.userData.type, POWER_UP_TYPES[cup.userData.type].duration);
      playPowerUp();
    }
    if (isPickedUp || cup.userData.age >= LIFETIME) {
      scene.remove(cup);
      cups.splice(i, 1);
    }
  }

  for (const [type, remaining] of active) {
    if (remaining - delta <= 0) active.delete(type);
    else active.set(type, remaining - delta);
  }

  shield.visible = active.has(POWER_UP_SHIELD);
}

// How much the active power-ups change Tode's speed and attack; every value is 1 when none is active
export function getPowerUpModifiers() {
  const hasAttack = active.has(POWER_UP_ATTACK);

  return {
    speed: active.has(POWER_UP_SPEED) ? SPEED_MULTIPLIER : 1,
    attackRadius: hasAttack ? ATTACK_RADIUS_MULTIPLIER : 1,
    attackCooldown: hasAttack ? ATTACK_COOLDOWN_MULTIPLIER : 1,
  };
}

// Uses up the shield if Tode has one. Returns true if it blocked the enemy.
export function useShield() {
  if (!active.has(POWER_UP_SHIELD)) return false;

  active.delete(POWER_UP_SHIELD);
  shield.visible = false;
  return true;
}

// The power-ups Tode has right now, for the display at the top of the screen
export function getActivePowerUps() {
  return [...active].map(([type, remaining]) => ({
    type,
    label: POWER_UP_TYPES[type].label,
    color: POWER_UP_TYPES[type].color,
    remaining,
  }));
}
