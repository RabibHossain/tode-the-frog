import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MAP_HALF_SIZE } from './Map.js';

// BASE_URL is the folder the game is served from, so this also works in a sub-folder
const MODEL_URL = `${import.meta.env.BASE_URL}models/small_house.glb`;
const MODEL_SCALE = 65;
const HOUSE_COUNT = 3;

// Houses keep this far from the edge of the map, from each other,
// and from the points they must leave free (the player's start and the enemy spawns)
const EDGE_MARGIN = 60;
const HOUSE_SPACING = 120;
const CLEAR_DISTANCE = 100;
const MAX_PLACEMENT_TRIES = 100;

// The model is loaded once and cloned for every house
let modelPromise = null;

function loadModel() {
  if (!modelPromise) {
    modelPromise = new GLTFLoader().loadAsync(MODEL_URL).then((gltf) => gltf.scene);
  }
  return modelPromise;
}

function isFarFrom(x, y, points, distance) {
  return points.every((point) => Math.hypot(x - point.x, y - point.y) >= distance);
}

function pickPositions(clearPoints) {
  const positions = [];
  const range = MAP_HALF_SIZE - EDGE_MARGIN;

  for (let tries = 0; positions.length < HOUSE_COUNT && tries < MAX_PLACEMENT_TRIES; tries++) {
    const x = THREE.MathUtils.randFloatSpread(range * 2);
    const y = THREE.MathUtils.randFloatSpread(range * 2);

    if (isFarFrom(x, y, clearPoints, CLEAR_DISTANCE) && isFarFrom(x, y, positions, HOUSE_SPACING)) {
      positions.push({ x, y });
    }
  }

  return positions;
}

function createHouse(x, y) {
  const house = new THREE.Group();
  house.position.set(x, y, 0);
  // Tells houses apart from the other things that block movement (trees and rocks)
  house.userData.isHouse = true;

  // Chosen up front so it doesn't depend on when the model finishes loading
  const quarterTurns = THREE.MathUtils.randInt(0, 3);

  loadModel()
    .then((source) => {
      const model = source.clone();

      // The model is authored Y-up, the game world is Z-up
      model.rotation.x = Math.PI / 2;
      // A random quarter turn around the model's own up axis
      model.rotation.y = quarterTurns * (Math.PI / 2);
      model.scale.setScalar(MODEL_SCALE);

      // Lift the model so it sits exactly on the ground (Z = 0)
      const box = new THREE.Box3().setFromObject(model, true);
      model.position.z = -box.min.z;

      // The house's footprint on the ground, used for collisions.
      // Quarter turns keep the walls lined up with the X and Y axes, so a rectangle fits well.
      house.userData.box = {
        minX: x + box.min.x,
        maxX: x + box.max.x,
        minY: y + box.min.y,
        maxY: y + box.max.y,
      };

      house.add(model);
    })
    .catch((error) => {
      console.error(`Failed to load ${MODEL_URL}`, error);
    });

  return house;
}

// Adds the houses to the map group at random positions, away from the `clearPoints`.
// Returns the list of houses, which the player and enemies use as obstacles.
export function createHouses(map, clearPoints) {
  const houses = pickPositions(clearPoints).map(({ x, y }) => createHouse(x, y));
  map.add(...houses);

  return houses;
}
