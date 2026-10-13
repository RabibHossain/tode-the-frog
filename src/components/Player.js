import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { collidesAt, computeCollisionRadius, findBlockingBox } from './Collision.js';
import { isInsideMap } from './Map.js';
import { playHop } from './Sound.js';

// BASE_URL is the folder the game is served from, so this also works in a sub-folder
const MODEL_URL = `${import.meta.env.BASE_URL}models/tode.glb`;
const MODEL_SCALE = 20;

// Jumps per second at the start of the game
export const MOVE_SPEED = 5;
const JUMP_HEIGHT = 12;
const JUMP_DISTANCE = 40;
// Holding a key keeps Tode hopping without building up a long backlog
const MAX_QUEUED_MOVES = 2;

const DIRECTIONS = {
  ArrowUp: { x: 0, y: 1 },
  ArrowDown: { x: 0, y: -1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

const inputQueue = [];

const movement = {
  direction: null,
  progress: 0,
  isComplete: true,
};

// Loaded model and the Z offset that keeps it flush on the ground
let model = null;
let groundOffset = 0;

export function createPlayer() {
  const player = new THREE.Group();
  player.position.set(0, 0, 0);

  const loader = new GLTFLoader();
  loader.load(
    MODEL_URL,
    (gltf) => {
      model = gltf.scene;

      // The model is authored Y-up, the game world is Z-up
      model.rotation.x = Math.PI / 2;
      model.scale.setScalar(MODEL_SCALE);

      // Lift the model so its lowest point sits flush on the ground (Z = 0)
      const box = new THREE.Box3().setFromObject(model);
      groundOffset = -box.min.z;
      model.position.z = groundOffset;

      player.userData.radius = computeCollisionRadius(model);

      player.add(model);
    },
    undefined,
    (error) => {
      console.error(`Failed to load ${MODEL_URL}`, error);
    }
  );

  window.addEventListener('keydown', (event) => {
    const direction = DIRECTIONS[event.key];
    if (!direction) return;

    event.preventDefault();
    if (inputQueue.length < MAX_QUEUED_MOVES) {
      inputQueue.push(direction);
    }
  });

  return player;
}

// What `updatePlayer` reports when Tode runs into an enemy
export const PLAYER_CAUGHT = 'caught';

// Forgets the arrow keys that were pressed but not yet acted on
export function clearPlayerInput() {
  inputQueue.length = 0;
}

// Takes the next arrow key press out of the queue: `{ x, y }`, or undefined if there is none.
// Used while Tode hides in a house, where an arrow means "leave this way".
export function takeQueuedDirection() {
  return inputQueue.shift();
}

// Ends the current hop on the spot and forgets the queued ones
export function stopPlayer() {
  inputQueue.length = 0;
  movement.direction = null;
  movement.progress = 0;
  movement.isComplete = true;

  if (model) model.position.z = groundOffset;
}

// Puts Tode at (x, y), standing still and facing `direction`
export function placePlayer(player, x, y, direction) {
  stopPlayer();
  player.position.x = x;
  player.position.y = y;
  player.visible = true;

  if (model) model.rotation.y = Math.atan2(direction.x, -direction.y);
}

// Puts Tode back at the starting point, ready for a new game
export function resetPlayer(player) {
  stopPlayer();
  player.position.set(0, 0, 0);
  player.visible = true;

  if (model) model.rotation.y = 0;
}

// Moves Tode. Returns what he ran into, if anything:
// - `PLAYER_CAUGHT` for an enemy, which ends the game
// - the house that blocked his hop
// - null when nothing was in the way
export function updatePlayer(player, delta, enemies, houses, speed) {
  if (movement.isComplete) {
    const direction = inputQueue.shift();
    if (!direction) return null;

    movement.direction = direction;
    movement.progress = 0;
    movement.isComplete = false;
    playHop();
  }

  const previousProgress = movement.progress;
  movement.progress = Math.min(movement.progress + delta * speed, 1);

  const { direction, progress } = movement;
  const step = JUMP_DISTANCE * (progress - previousProgress);
  const nextX = player.position.x + direction.x * step;
  const nextY = player.position.y + direction.y * step;

  // Running into an enemy takes priority over the move itself
  if (enemies.some((enemy) => collidesAt(player, nextX, nextY, enemy))) return PLAYER_CAUGHT;

  // A house or the map border blocks the way: Tode still finishes the hop, but on the spot
  const blockingHouse = findBlockingBox(player, nextX, nextY, houses);
  if (isInsideMap(nextX, nextY) && !blockingHouse) {
    player.position.x = nextX;
    player.position.y = nextY;
  }

  if (model) {
    // The jump and the turn are applied to the model, not the group,
    // so the camera attached to the group stays steady
    model.position.z = groundOffset + Math.sin(progress * Math.PI) * JUMP_HEIGHT;
    model.rotation.y = Math.atan2(direction.x, -direction.y);
  }

  if (progress >= 1) {
    movement.isComplete = true;
  }

  return blockingHouse;
}
