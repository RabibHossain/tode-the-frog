import * as THREE from 'three';

// Extra gap added on top of the two collision radii.
// Raise it to keep characters further apart, lower it (even below zero) to let them get closer.
export const COLLISION_DISTANCE = 0;

const vertex = new THREE.Vector3();

// Skinned models need their bones calculated before their vertices can be read
export function updateModelMatrices(model) {
  // `updateMatrixWorld` (not `updateWorldMatrix`) also refreshes how skinned meshes are bound to their bones
  model.updateMatrixWorld(true);
  model.traverse((child) => {
    if (child.isSkinnedMesh) child.skeleton.update();
  });
}

// Measures the model's footprint on the ground from its actual vertices:
// the typical (root mean square) horizontal distance of the vertices from the model's centre.
// Unlike a bounding box, thin parts that stick out (wings, legs) barely widen it.
export function computeCollisionRadius(model) {
  updateModelMatrices(model);

  let sum = 0;
  let count = 0;

  model.traverse((child) => {
    if (!child.isMesh) return;

    const position = child.geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      child.getVertexPosition(i, vertex).applyMatrix4(child.matrixWorld);
      sum += vertex.x * vertex.x + vertex.y * vertex.y;
      count++;
    }
  });

  return count > 0 ? Math.sqrt(sum / count) : 0;
}

// Objects keep their radius in `userData.radius` (missing until their model has loaded)
function minDistance(a, b) {
  return (a.userData.radius ?? 0) + (b.userData.radius ?? 0) + COLLISION_DISTANCE;
}

// Checks whether `mover` would collide with `obstacle` if it stood at (x, y)
export function collidesAt(mover, x, y, obstacle) {
  const distance = Math.hypot(x - obstacle.position.x, y - obstacle.position.y);
  return distance < minDistance(mover, obstacle);
}

// Finds the obstacle that `mover` would overlap if it stood at (x, y), or null if the spot is free.
// These obstacles are rectangles kept in `userData.box` (missing until their model has loaded).
export function findBlockingBox(mover, x, y, obstacles) {
  const reach = (mover.userData.radius ?? 0) + COLLISION_DISTANCE;

  for (const obstacle of obstacles) {
    const box = obstacle.userData.box;
    if (!box) continue;

    // Distance from the mover's centre to the nearest point of the rectangle
    const nearestX = Math.max(box.minX, Math.min(x, box.maxX));
    const nearestY = Math.max(box.minY, Math.min(y, box.maxY));
    if (Math.hypot(x - nearestX, y - nearestY) < reach) return obstacle;
  }
  return null;
}

// Checks whether `mover` would overlap one of the `obstacles` if it stood at (x, y)
export function isBlockedByBoxes(mover, x, y, obstacles) {
  return findBlockingBox(mover, x, y, obstacles) !== null;
}

// Checks whether `mover` can step to (x, y) without colliding with any of the `obstacles`.
// A step that moves away from something it already overlaps is allowed, so nobody gets stuck.
export function canMoveTo(mover, x, y, obstacles) {
  for (const obstacle of obstacles) {
    if (obstacle === mover) continue;

    const nextDistance = Math.hypot(x - obstacle.position.x, y - obstacle.position.y);
    if (nextDistance >= minDistance(mover, obstacle)) continue;

    const currentDistance = Math.hypot(
      mover.position.x - obstacle.position.x,
      mover.position.y - obstacle.position.y
    );
    if (nextDistance < currentDistance) return false;
  }
  return true;
}
