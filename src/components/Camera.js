import * as THREE from 'three';

const FOV = 30;
// Kept well away from zero so the floor and the attack circle just above it don't flicker
const NEAR = 10;
const FAR = 9000;

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    FOV,
    window.innerWidth / window.innerHeight,
    NEAR,
    FAR
  );

  camera.up.set(0, 0, 1);
  camera.position.set(300, -300, 300);
  camera.lookAt(0, 0, 0);

  return camera;
}
