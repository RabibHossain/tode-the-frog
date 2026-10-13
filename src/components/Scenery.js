import * as THREE from 'three';
import { MAP_HALF_SIZE, TILE_SIZE } from './Map.js';

const TREE_COUNT = 7;
const ROCK_COUNT = 5;

// Scenery keeps this far from houses and from the points it must leave free
// (the player's start and the enemy spawns)
const HOUSE_DISTANCE = 80;
const CLEAR_DISTANCE = 70;
const MAX_PLACEMENT_TRIES = 200;

// Each piece is made a little bigger or smaller, so no two look the same
const MIN_SCALE = 0.85;
const MAX_SCALE = 1.25;

const TRUNK_COLOR = 0x8a6a4a;
// Darker and bluer than the floor, so the trees stand out against the green tiles
const LEAF_COLORS = [0x2f6f4f, 0x3a8560];
const ROCK_COLORS = [0x9a9a94, 0x85857f];

// Half the width of the part that blocks movement. Only the trunk of a tree blocks;
// characters can stand under the edge of its leaves.
const TREE_BLOCK_SIZE = 5;
const ROCK_BLOCK_SIZE = 7;

// The shapes are built Y-up, the way Three.js makes cylinders and cones; the world is Z-up
const UPRIGHT = Math.PI / 2;

// Shapes and materials are shared by all trees and rocks
const trunkGeometry = new THREE.CylinderGeometry(2, 2.8, 9, 8);
const pineGeometries = [
  new THREE.ConeGeometry(11, 14, 8),
  new THREE.ConeGeometry(9, 12, 8),
  new THREE.ConeGeometry(6.5, 10, 8),
];
const crownGeometry = new THREE.IcosahedronGeometry(11, 0);
const rockGeometry = new THREE.DodecahedronGeometry(8, 0);

// `flatShading` gives every face its own shade, for a simple low-poly look
function createMaterial(color) {
  return new THREE.MeshLambertMaterial({ color, flatShading: true });
}
const trunkMaterial = createMaterial(TRUNK_COLOR);
const leafMaterials = LEAF_COLORS.map(createMaterial);
const rockMaterials = ROCK_COLORS.map(createMaterial);

function pickRandom(list) {
  return list[THREE.MathUtils.randInt(0, list.length - 1)];
}

// Adds `geometry` to `parent`, standing upright with its centre at `height` above the ground
function addPart(parent, geometry, material, height) {
  const part = new THREE.Mesh(geometry, material);
  part.rotation.x = UPRIGHT;
  part.position.z = height;
  parent.add(part);

  return part;
}

// A pointed tree: a trunk with three cones stacked on it
function createPineTree() {
  const tree = new THREE.Group();
  const material = pickRandom(leafMaterials);

  addPart(tree, trunkGeometry, trunkMaterial, 4.5);
  addPart(tree, pineGeometries[0], material, 14);
  addPart(tree, pineGeometries[1], material, 21);
  addPart(tree, pineGeometries[2], material, 27.5);

  return tree;
}

// A round tree: a trunk with one ball of leaves
function createRoundTree() {
  const tree = new THREE.Group();

  addPart(tree, trunkGeometry, trunkMaterial, 4.5);
  const crown = addPart(tree, crownGeometry, pickRandom(leafMaterials), 17);
  // Turned a random way, so the flat faces catch the light differently on each tree
  crown.rotation.y = Math.random() * Math.PI * 2;

  return tree;
}

// A boulder: a many-sided ball, squashed, turned a random way and sunk a little into the ground
function createRock() {
  const rock = new THREE.Group();

  const stone = new THREE.Mesh(rockGeometry, pickRandom(rockMaterials));
  stone.scale.set(1, 0.9, 0.65);
  stone.rotation.set(Math.random(), Math.random(), Math.random() * Math.PI * 2);
  stone.position.z = 3.5;
  rock.add(stone);

  return rock;
}

function isFarFrom(x, y, points, distance) {
  return points.every((point) => Math.hypot(x - point.x, y - point.y) >= distance);
}

// Picks the centres of random tiles, so every piece fills one tile and leaves the tiles around it free
function pickPositions(count, houses, clearPoints) {
  const positions = [];
  // One tile in from the fence
  const tilesFromCentre = Math.floor(MAP_HALF_SIZE / TILE_SIZE) - 1;
  const housePositions = houses.map((house) => house.position);

  for (let tries = 0; positions.length < count && tries < MAX_PLACEMENT_TRIES; tries++) {
    const x = THREE.MathUtils.randInt(-tilesFromCentre, tilesFromCentre) * TILE_SIZE;
    const y = THREE.MathUtils.randInt(-tilesFromCentre, tilesFromCentre) * TILE_SIZE;

    const isFree =
      isFarFrom(x, y, housePositions, HOUSE_DISTANCE) &&
      isFarFrom(x, y, clearPoints, CLEAR_DISTANCE) &&
      // Never two pieces on the same tile or on tiles side by side
      isFarFrom(x, y, positions, TILE_SIZE * 1.5);
    if (isFree) positions.push({ x, y });
  }

  return positions;
}

// Puts a tree or rock at (x, y) and gives it the square that blocks movement
function place(piece, { x, y }, blockSize) {
  const scale = THREE.MathUtils.randFloat(MIN_SCALE, MAX_SCALE);
  piece.position.set(x, y, 0);
  piece.scale.setScalar(scale);
  piece.rotation.z = Math.random() * Math.PI * 2;

  const half = blockSize * scale;
  piece.userData.box = { minX: x - half, maxX: x + half, minY: y - half, maxY: y + half };

  return piece;
}

// Adds trees and rocks to the map group at random tiles, away from the `houses` and the `clearPoints`.
// Returns them as a list; like houses, they block the player and the enemies.
export function createScenery(map, houses, clearPoints) {
  const positions = pickPositions(TREE_COUNT + ROCK_COUNT, houses, clearPoints);

  const scenery = positions.map((position, index) => {
    if (index >= TREE_COUNT) return place(createRock(), position, ROCK_BLOCK_SIZE);

    const tree = index % 2 === 0 ? createPineTree() : createRoundTree();
    return place(tree, position, TREE_BLOCK_SIZE);
  });
  if (scenery.length > 0) map.add(...scenery);

  return scenery;
}
