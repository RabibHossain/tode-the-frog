import * as THREE from 'three';
import { isBlockedByBoxes } from './Collision.js';
import { isInsideMap } from './Map.js';
import { isTouchDevice } from './Touch.js';

// Seconds Tode can stay inside a house before he is put back outside
export const HIDE_TIME = 4;
// Seconds a house stays closed after Tode has used it
export const HOUSE_COOLDOWN = 20;
// Enemies this close to the spot where Tode comes out are pushed back
export const EXIT_PUSH_RADIUS = 70;
// Gap left between the wall and Tode when he comes out
const EXIT_MARGIN = 6;

// A ring on the ground around a house shows that it is open
const RING_COLOR = 0xffd66b;
const RING_WIDTH = 6;
// Space between the walls and the ring
const RING_PADDING = 8;
// The ring gently fades in and out between these two opacities, this many times per second
const RING_MIN_OPACITY = 0.45;
const RING_MAX_OPACITY = 0.95;
const RING_PULSE_SPEED = 0.6;
const RING_Z_OFFSET = 0.3;

// The burst that pushes enemies back when Tode comes out
const BURST_COLOR = 0xfff6d6;
const BURST_DURATION = 0.35;
const BURST_OPACITY = 0.7;

// The four ways out of a house
const EXIT_DIRECTIONS = [
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
];

// The house Tode is hiding in (null when he is outside) and the seconds he has left in it
let currentHouse = null;
let hideRemaining = 0;

let pulseTime = 0;
let burst = null;
let burstRemaining = 0;
let timerElement = null;
let displayedSeconds = null;

const ringMaterial = new THREE.MeshBasicMaterial({
  color: RING_COLOR,
  transparent: true,
  opacity: RING_MAX_OPACITY,
  depthWrite: false,
});

// A flat rectangular frame on the ground, just outside the walls of the house.
// It is made once the house model has loaded and its size is known.
function createRing(house) {
  const { minX, maxX, minY, maxY } = house.userData.box;
  const halfWidth = (maxX - minX) / 2 + RING_PADDING;
  const halfDepth = (maxY - minY) / 2 + RING_PADDING;

  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth - RING_WIDTH, -halfDepth - RING_WIDTH);
  shape.lineTo(halfWidth + RING_WIDTH, -halfDepth - RING_WIDTH);
  shape.lineTo(halfWidth + RING_WIDTH, halfDepth + RING_WIDTH);
  shape.lineTo(-halfWidth - RING_WIDTH, halfDepth + RING_WIDTH);
  shape.closePath();

  const hole = new THREE.Path();
  hole.moveTo(-halfWidth, -halfDepth);
  hole.lineTo(-halfWidth, halfDepth);
  hole.lineTo(halfWidth, halfDepth);
  hole.lineTo(halfWidth, -halfDepth);
  hole.closePath();
  shape.holes.push(hole);

  const ring = new THREE.Mesh(new THREE.ShapeGeometry(shape), ringMaterial);
  // The box is in world coordinates, the ring is a child of the house group
  ring.position.set(
    (minX + maxX) / 2 - house.position.x,
    (minY + maxY) / 2 - house.position.y,
    RING_Z_OFFSET
  );
  house.add(ring);

  return ring;
}

// Creates the burst effect and the countdown shown while Tode hides
export function createShelters(scene) {
  const geometry = new THREE.RingGeometry(0.8, 1, 48);
  const material = new THREE.MeshBasicMaterial({
    color: BURST_COLOR,
    transparent: true,
    opacity: BURST_OPACITY,
    depthWrite: false,
  });
  burst = new THREE.Mesh(geometry, material);
  burst.position.z = RING_Z_OFFSET;
  burst.visible = false;
  scene.add(burst);

  timerElement = document.createElement('div');
  timerElement.className = 'shelter-timer';
  timerElement.hidden = true;
  document.body.appendChild(timerElement);
}

export function isHiding() {
  return currentHouse !== null;
}

// A house is open once its model has loaded and its closed time has run out.
// Trees and rocks block movement too, but they are never open.
export function isHouseOpen(house) {
  const { isHouse, box, cooldown } = house.userData;
  return Boolean(isHouse) && Boolean(box) && (cooldown ?? 0) <= 0;
}

export function enterHouse(house) {
  currentHouse = house;
  hideRemaining = HIDE_TIME;
}

// Where Tode would stand if he left `house` in `direction`, or null if he can't stand there.
// `obstacles` is everything that blocks movement: the houses, trees and rocks.
function getExitPosition(house, direction, player, obstacles) {
  const { minX, maxX, minY, maxY } = house.userData.box;
  const gap = (player.userData.radius ?? 0) + EXIT_MARGIN;

  let x = (minX + maxX) / 2;
  let y = (minY + maxY) / 2;
  if (direction.x > 0) x = maxX + gap;
  if (direction.x < 0) x = minX - gap;
  if (direction.y > 0) y = maxY + gap;
  if (direction.y < 0) y = minY - gap;

  const isFree = isInsideMap(x, y) && !isBlockedByBoxes(player, x, y, obstacles);
  return isFree ? { x, y, direction } : null;
}

function distanceToNearestEnemy(position, enemies) {
  let nearest = Infinity;
  for (const enemy of enemies) {
    nearest = Math.min(
      nearest,
      Math.hypot(enemy.position.x - position.x, enemy.position.y - position.y)
    );
  }
  return nearest;
}

// Ends the hiding. Tode leaves in `direction` if that side is free; without a direction
// (his time ran out) or with a blocked one, he leaves on the side furthest from any enemy.
// Returns where he comes out: `{ x, y, direction }`.
export function leaveHouse(player, direction, obstacles, enemies) {
  const house = currentHouse;
  let exit = direction ? getExitPosition(house, direction, player, obstacles) : null;

  if (!exit) {
    let bestDistance = -1;
    for (const candidate of EXIT_DIRECTIONS) {
      const position = getExitPosition(house, candidate, player, obstacles);
      if (!position) continue;

      const distance = distanceToNearestEnemy(position, enemies);
      if (distance > bestDistance) {
        bestDistance = distance;
        exit = position;
      }
    }
  }
  // Should never happen (a house always has a free side), but Tode must come out somewhere
  exit ??= { x: player.position.x, y: player.position.y, direction: EXIT_DIRECTIONS[0] };

  house.userData.cooldown = HOUSE_COOLDOWN;
  currentHouse = null;

  burst.position.x = exit.x;
  burst.position.y = exit.y;
  burstRemaining = BURST_DURATION;

  return exit;
}

function updateTimer() {
  const seconds = currentHouse ? Math.ceil(hideRemaining) : null;
  if (seconds === displayedSeconds) return;
  displayedSeconds = seconds;

  timerElement.hidden = seconds === null;
  if (seconds !== null) {
    const leave = isTouchDevice() ? 'tap an arrow to leave' : 'press an arrow to leave';
    timerElement.textContent = `Hiding: ${seconds}s · ${leave}`;
  }
}

// Counts down the closed houses and the hiding time, and animates the rings and the burst.
// Returns true at the moment Tode's time inside runs out.
export function updateShelters(houses, delta) {
  pulseTime += delta;
  const pulse = (Math.sin(pulseTime * RING_PULSE_SPEED * Math.PI * 2) + 1) / 2;
  ringMaterial.opacity = THREE.MathUtils.lerp(RING_MIN_OPACITY, RING_MAX_OPACITY, pulse);

  for (const house of houses) {
    if (!house.userData.box) continue;

    house.userData.ring ??= createRing(house);
    if (house !== currentHouse) {
      house.userData.cooldown = Math.max((house.userData.cooldown ?? 0) - delta, 0);
    }
    house.userData.ring.visible = isHouseOpen(house) || house === currentHouse;
  }

  burstRemaining = Math.max(burstRemaining - delta, 0);
  burst.visible = burstRemaining > 0;
  if (burst.visible) {
    // The ring grows from nothing to the push radius while it fades out
    const progress = 1 - burstRemaining / BURST_DURATION;
    burst.scale.setScalar(Math.max(progress * EXIT_PUSH_RADIUS, 0.001));
    burst.material.opacity = BURST_OPACITY * (1 - progress);
  }

  let isTimeUp = false;
  if (currentHouse) {
    hideRemaining -= delta;
    isTimeUp = hideRemaining <= 0;
  }
  updateTimer();

  return isTimeUp;
}

// Opens every house again and ends any hiding, for a new game
export function resetShelters(houses) {
  for (const house of houses) {
    house.userData.cooldown = 0;
  }
  currentHouse = null;
  hideRemaining = 0;
  burstRemaining = 0;
  burst.visible = false;
  updateTimer();
}
