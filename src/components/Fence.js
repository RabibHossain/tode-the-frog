import * as THREE from 'three';
import { MAP_HALF_SIZE, MAP_SIZE, TILE_SIZE } from './Map.js';

// Kept lower than Tode so the fence never hides him at the near edges of the map
const POST_HEIGHT = 12;
const POST_WIDTH = 4;
const RAIL_THICKNESS = 2;
// Heights of the two rails above the ground
const RAIL_HEIGHTS = [5, 10];

const POST_COLOR = 0x8f6f4e;
const RAIL_COLOR = 0xb8956c;

// One post at every tile corner along the edge of the map
function createPosts() {
  const geometry = new THREE.BoxGeometry(POST_WIDTH, POST_WIDTH, POST_HEIGHT);
  const material = new THREE.MeshLambertMaterial({ color: POST_COLOR });

  const positions = [];
  for (let offset = -MAP_HALF_SIZE; offset < MAP_HALF_SIZE; offset += TILE_SIZE) {
    // Walking round the four sides, so each corner gets exactly one post
    positions.push(
      [offset, -MAP_HALF_SIZE],
      [MAP_HALF_SIZE, offset],
      [-offset, MAP_HALF_SIZE],
      [-MAP_HALF_SIZE, -offset]
    );
  }

  // All posts are drawn in one go from a single shape
  const posts = new THREE.InstancedMesh(geometry, material, positions.length);
  const matrix = new THREE.Matrix4();
  positions.forEach(([x, y], index) => {
    matrix.makeTranslation(x, y, POST_HEIGHT / 2);
    posts.setMatrixAt(index, matrix);
  });

  return posts;
}

// Two long rails on each of the four sides
function createRails() {
  const rails = new THREE.Group();
  const material = new THREE.MeshLambertMaterial({ color: RAIL_COLOR });
  const alongX = new THREE.BoxGeometry(MAP_SIZE, RAIL_THICKNESS, RAIL_THICKNESS);
  const alongY = new THREE.BoxGeometry(RAIL_THICKNESS, MAP_SIZE, RAIL_THICKNESS);

  for (const height of RAIL_HEIGHTS) {
    for (const side of [-MAP_HALF_SIZE, MAP_HALF_SIZE]) {
      const railX = new THREE.Mesh(alongX, material);
      railX.position.set(0, side, height);

      const railY = new THREE.Mesh(alongY, material);
      railY.position.set(side, 0, height);

      rails.add(railX, railY);
    }
  }

  return rails;
}

// A wooden fence around the edge of the floor, showing where the map ends
export function createFence() {
  const fence = new THREE.Group();
  fence.add(createPosts(), createRails());

  return fence;
}
