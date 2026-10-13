import * as THREE from 'three';

// One tile is one hop wide
export const TILE_SIZE = 40;
// An odd number puts the centre of a tile at the centre of the map
const TILES_PER_SIDE = 17;
export const MAP_SIZE = TILE_SIZE * TILES_PER_SIDE;
export const MAP_HALF_SIZE = MAP_SIZE / 2;

// Characters can go as far as the centre of the outermost tiles.
// The small tolerance absorbs rounding errors that build up over many hops.
const PLAYABLE_HALF_SIZE = MAP_HALF_SIZE - TILE_SIZE / 2 + 0.01;

const DARK_GREEN = '#228B22';
const LIGHT_GREEN = '#90EE90';

// A 2x2 pixel image of the pattern, repeated across the whole floor
function createCheckerboardTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 2;

  const context = canvas.getContext('2d');
  context.fillStyle = LIGHT_GREEN;
  context.fillRect(0, 0, 2, 2);
  context.fillStyle = DARK_GREEN;
  context.fillRect(0, 0, 1, 1);
  context.fillRect(1, 1, 1, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(TILES_PER_SIDE / 2, TILES_PER_SIDE / 2);
  // Keeps the tile edges crisp instead of blurring the two greens together
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;

  return texture;
}

// Checks whether the point (x, y) is within the borders of the map
export function isInsideMap(x, y) {
  return Math.abs(x) <= PLAYABLE_HALF_SIZE && Math.abs(y) <= PLAYABLE_HALF_SIZE;
}

// The map group holds the floor and everything that stands on it
export function createMap() {
  const map = new THREE.Group();

  const geometry = new THREE.PlaneGeometry(MAP_SIZE, MAP_SIZE);
  const material = new THREE.MeshBasicMaterial({ map: createCheckerboardTexture() });
  const floor = new THREE.Mesh(geometry, material);
  map.add(floor);

  return map;
}
