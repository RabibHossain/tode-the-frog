import * as THREE from 'three';
import { playAttack } from './Sound.js';

// Seconds between attacks at the start of the game
export const ATTACK_COOLDOWN = 1;
// Reach of the attack at the start of the game
export const ATTACK_RADIUS = 60;
// Seconds the circle stays visible while fading out
const ATTACK_EFFECT_DURATION = 0.3;
const ATTACK_COLOR = 0xffd43b;
const ATTACK_OPACITY = 0.9;
// Keeps the circle just above the ground
const ATTACK_Z_OFFSET = 0.25;

// A small ring on the ground around Tode that fills up while the attack recharges
const RECHARGE_INNER_RADIUS = 15;
const RECHARGE_OUTER_RADIUS = 18.5;
// The ring is built from this many slices; more slices fill more smoothly
const RECHARGE_SEGMENTS = 64;
const RECHARGE_COLOR = 0xfff6d6;
const RECHARGE_OPACITY = 0.95;
// The unfilled part of the ring, drawn faintly underneath
const RECHARGE_TRACK_COLOR = 0x2f3e36;
const RECHARGE_TRACK_OPACITY = 0.3;
// Just above the attack circle, so the ring stays visible while the circle fades
const RECHARGE_Z_OFFSET = 0.35;

let attackRequested = false;
let cooldownRemaining = 0;
// The full length of the recharge that is running, to know how far along it is
let cooldownTotal = 0;
let effectRemaining = 0;
let recharge = null;
let rechargeFill = null;
// The enemies hit by the latest attack; reused every frame
const hits = [];

function createRechargeRing() {
  const createRing = (color, opacity) => {
    const geometry = new THREE.RingGeometry(
      RECHARGE_INNER_RADIUS,
      RECHARGE_OUTER_RADIUS,
      RECHARGE_SEGMENTS,
      1,
      // Starts at the top and runs clockwise, like a clock hand
      Math.PI / 2,
      -Math.PI * 2
    );
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
      // The clockwise ring faces downward, so both sides are drawn
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(geometry, material);
  };

  recharge = new THREE.Group();
  recharge.position.z = RECHARGE_Z_OFFSET;
  recharge.visible = false;

  rechargeFill = createRing(RECHARGE_COLOR, RECHARGE_OPACITY);
  // Drawn a touch higher than the track so the two never flicker against each other
  rechargeFill.position.z = 0.05;
  recharge.add(createRing(RECHARGE_TRACK_COLOR, RECHARGE_TRACK_OPACITY), rechargeFill);

  return recharge;
}

// Shows how far the recharge has come; hidden once the attack is ready
function updateRechargeRing() {
  recharge.visible = cooldownRemaining > 0;
  if (!recharge.visible) return;

  const progress = 1 - cooldownRemaining / cooldownTotal;
  // Each slice of the ring is two triangles, six corner numbers in all.
  // Drawing only the first slices shows the ring partly filled.
  const slices = Math.round(progress * RECHARGE_SEGMENTS);
  rechargeFill.geometry.setDrawRange(0, slices * 6);
}

// The circle and the recharge ring are added to the player group, so they follow Tode
export function createAttack(player) {
  // A circle of radius 1, scaled to the current attack radius on every attack
  const geometry = new THREE.CircleGeometry(1, 48);
  const material = new THREE.MeshBasicMaterial({
    color: ATTACK_COLOR,
    transparent: true,
    opacity: ATTACK_OPACITY,
    depthWrite: false,
  });

  const attack = new THREE.Mesh(geometry, material);
  attack.position.z = ATTACK_Z_OFFSET;
  attack.visible = false;
  player.add(attack, createRechargeRing());

  window.addEventListener('keydown', (event) => {
    if (event.code !== 'Space') return;

    event.preventDefault();
    attackRequested = true;
  });

  return attack;
}

// Forgets a Space press that has not been acted on yet
export function clearAttackRequest() {
  attackRequested = false;
}

// Clears any pending attack, the cooldown, and the circle
export function resetAttack(attack) {
  attackRequested = false;
  cooldownRemaining = 0;
  effectRemaining = 0;
  attack.visible = false;
  recharge.visible = false;
}

// `cooldown` and `radius` are the current values for this frame.
// Returns the enemies the attack hit as a list (empty on most frames).
// The caller decides what a hit does to each of them.
export function updateAttack(attack, player, enemies, delta, cooldown, radius) {
  cooldownRemaining = Math.max(cooldownRemaining - delta, 0);

  hits.length = 0;

  // A press while the attack is still recharging is remembered,
  // and the attack fires the moment it is ready again
  if (attackRequested && cooldownRemaining === 0) {
    attackRequested = false;
    cooldownRemaining = cooldown;
    cooldownTotal = cooldown;
    playAttack();
    effectRemaining = ATTACK_EFFECT_DURATION;
    attack.scale.set(radius, radius, 1);

    for (const enemy of enemies) {
      const distance = Math.hypot(
        enemy.position.x - player.position.x,
        enemy.position.y - player.position.y
      );

      // An enemy is hit as soon as its body touches the circle
      if (distance - (enemy.userData.radius ?? 0) <= radius) {
        hits.push(enemy);
      }
    }
  }
  effectRemaining = Math.max(effectRemaining - delta, 0);
  attack.visible = effectRemaining > 0;
  attack.material.opacity = ATTACK_OPACITY * (effectRemaining / ATTACK_EFFECT_DURATION);
  updateRechargeRing();

  return hits;
}
