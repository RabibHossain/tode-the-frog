import * as THREE from 'three';
import { MAP_HALF_SIZE, TILE_SIZE } from './Map.js';

const FLOWER_PATCH_COUNT = 32;
const BUSH_COUNT = 16;
// Flowers grow in little groups
const MIN_FLOWERS_PER_PATCH = 2;
const MAX_FLOWERS_PER_PATCH = 5;
// How far the flowers of one group spread out
const PATCH_SPREAD = 7;

// Decoration sits near the corners of tiles. Tode rests on tile centres,
// so he is rarely standing right on top of a flower or in a bush.
const CORNER_JITTER = 6;
// Distance kept from the fence, from houses, and from trees and rocks
const EDGE_MARGIN = 14;
const HOUSE_DISTANCE = 52;
const SCENERY_DISTANCE = 18;
const MAX_PLACEMENT_TRIES = 400;

const STEM_COLOR = 0x4f9d5d;
const FLOWER_COLORS = [0xf2a7c3, 0xfaf3e0, 0xf7d774, 0xc3a6e8];
// Between the bright floor and the dark trees
const BUSH_COLORS = [0x3f9a58, 0x4fae66];

const STEM_HEIGHT = 4.5;

// Reused while filling in the instances
const matrix = new THREE.Matrix4();
const position = new THREE.Vector3();
const rotation = new THREE.Quaternion();
const scale = new THREE.Vector3();
const color = new THREE.Color();
const UP = new THREE.Vector3(0, 0, 1);

function pickRandom(list) {
  return list[THREE.MathUtils.randInt(0, list.length - 1)];
}

function isFarFrom(x, y, objects, distance) {
  return objects.every(
    (object) => Math.hypot(x - object.position.x, y - object.position.y) >= distance
  );
}

// Picks spots near random tile corners, clear of the houses and the scenery
function pickSpots(count, houses, scenery) {
  const spots = [];
  const cornersFromCentre = Math.floor(MAP_HALF_SIZE / TILE_SIZE);
  const limit = MAP_HALF_SIZE - EDGE_MARGIN;

  for (let tries = 0; spots.length < count && tries < MAX_PLACEMENT_TRIES; tries++) {
    // Tile corners lie half a tile off the tile centres
    const cornerX = (THREE.MathUtils.randInt(-cornersFromCentre, cornersFromCentre) + 0.5) * TILE_SIZE;
    const cornerY = (THREE.MathUtils.randInt(-cornersFromCentre, cornersFromCentre) + 0.5) * TILE_SIZE;
    const x = cornerX + THREE.MathUtils.randFloatSpread(CORNER_JITTER * 2);
    const y = cornerY + THREE.MathUtils.randFloatSpread(CORNER_JITTER * 2);

    const isFree =
      Math.abs(x) <= limit &&
      Math.abs(y) <= limit &&
      isFarFrom(x, y, houses, HOUSE_DISTANCE) &&
      isFarFrom(x, y, scenery, SCENERY_DISTANCE);
    if (isFree) spots.push({ x, y });
  }

  return spots;
}

// Fills in one instance: where it stands, which way it is turned, and how big it is
function setInstance(mesh, index, x, y, size) {
  position.set(x, y, 0);
  rotation.setFromAxisAngle(UP, Math.random() * Math.PI * 2);
  scale.setScalar(size);
  mesh.setMatrixAt(index, matrix.compose(position, rotation, scale));
}

// All flowers are drawn as two shapes repeated many times: one for the stems, one for the heads
function createFlowers(spots) {
  const flowers = [];
  for (const spot of spots) {
    const patchColor = pickRandom(FLOWER_COLORS);
    const count = THREE.MathUtils.randInt(MIN_FLOWERS_PER_PATCH, MAX_FLOWERS_PER_PATCH);

    for (let i = 0; i < count; i++) {
      flowers.push({
        x: spot.x + THREE.MathUtils.randFloatSpread(PATCH_SPREAD * 2),
        y: spot.y + THREE.MathUtils.randFloatSpread(PATCH_SPREAD * 2),
        size: THREE.MathUtils.randFloat(0.8, 1.2),
        color: patchColor,
      });
    }
  }

  // The shapes are made standing upright with their foot on the ground,
  // so an instance only needs a position
  const stemGeometry = new THREE.CylinderGeometry(0.35, 0.35, STEM_HEIGHT, 5)
    .rotateX(Math.PI / 2)
    .translate(0, 0, STEM_HEIGHT / 2);
  const headGeometry = new THREE.IcosahedronGeometry(1.7, 0).translate(0, 0, STEM_HEIGHT + 0.6);

  const stems = new THREE.InstancedMesh(
    stemGeometry,
    new THREE.MeshLambertMaterial({ color: STEM_COLOR }),
    flowers.length
  );
  // White, so each head shows exactly its own colour
  const heads = new THREE.InstancedMesh(
    headGeometry,
    new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }),
    flowers.length
  );

  flowers.forEach((flower, index) => {
    setInstance(stems, index, flower.x, flower.y, flower.size);
    heads.setMatrixAt(index, matrix);
    heads.setColorAt(index, color.set(flower.color));
  });

  return [stems, heads];
}

// Low, rounded bushes: one squashed many-sided ball repeated many times
function createBushes(spots) {
  const geometry = new THREE.IcosahedronGeometry(6, 0).scale(1, 1, 0.6).translate(0, 0, 2.6);
  const bushes = new THREE.InstancedMesh(
    geometry,
    new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }),
    spots.length
  );

  spots.forEach((spot, index) => {
    setInstance(bushes, index, spot.x, spot.y, THREE.MathUtils.randFloat(0.8, 1.3));
    bushes.setColorAt(index, color.set(pickRandom(BUSH_COLORS)));
  });

  return bushes;
}

// Adds flowers and bushes to the map group. They are only decoration:
// nothing collides with them, and Tode and the enemies move straight through.
export function createDecoration(map, houses, scenery) {
  const decoration = new THREE.Group();

  const flowerSpots = pickSpots(FLOWER_PATCH_COUNT, houses, scenery);
  const bushSpots = pickSpots(BUSH_COUNT, houses, scenery);
  decoration.add(...createFlowers(flowerSpots), createBushes(bushSpots));

  map.add(decoration);
  return decoration;
}
