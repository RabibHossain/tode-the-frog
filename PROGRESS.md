# Progress log – Tode the Frog game

This file records what has been built, why, and what is left.
If a session is lost, share this file's path in a new session to pick up where we stopped.

Last updated: 2026-10-13

## What this project is

- JetBrains Academy course **"Build a Game with an AI Coding Agent"**: a 3D browser game made with Three.js, run with Vite.
- Goal: finish the course, add our own features, and submit to the **Build Your Game Challenge**.
- Challenge dates (UTC):
  - Oct 12, 08:00 – challenge starts
  - Oct 19, 08:00 – submissions and community voting open (on JetBrains Academy Discord)
  - Oct 23, 09:00 – submissions and voting close
  - Oct 28 – winners announced
- Winners are picked by community vote. Full rules are on the Discord server (not read yet).

## Rules to follow

- From `AGENTS.md`: change files in the `game` directory only. Don't look for or run tests.
- Each lesson lives in a folder next to `game` (`Skeleton`, `Core_loop`, `Visual`, `Conclusion`) with a `task.md` (explanation) and a `spec.md` (what to build).
- Nothing is graded. Lessons are marked done by hand in the JetBrains IDE to get the certificate.
- `small_house.glb` is CC-BY (Small House by Jarlan Perez, via Poly Pizza). Keep that credit when publishing. `enemy.glb` is public domain (Armabee Evolved by Quaternius).

## How to run

```bash
cd "/home/rabib/codes/whoiam/Build a Game with an AI Coding Agent/game"
npm run dev
```

Open the printed link (usually http://localhost:5173). Stop with Ctrl+C.

- Node on this machine is 20.18.0. Vite asks for 20.19+ and prints a warning, but it works.
- There is no `node_modules` inside `game`; it uses the one in the parent folder.

## Lesson status

| # | Lesson | Status |
|---|---|---|
| 1 | Skeleton / Scene setup | Done |
| 2 | Skeleton / Player movement | Done |
| 3 | Skeleton / Adding enemies | Done |
| 4 | Skeleton / Collision detection | Done |
| 5 | Skeleton / Attack | Done |
| 6 | Core loop / Score | Done |
| 7 | Core loop / Start → playing → game over | Done |
| 8 | Core loop / Increasing complexity | Done |
| 9 | Visual / Game world | Done |
| 10 | Conclusion / Summary | Text only, no code |
| – | Own features for the challenge | Not started |

All nine lessons were checked on 2026-10-12 by playing the game in a headless Chrome
(a browser without a window, driven by a script) and looking at screenshots. See "Verified" below.

## Files in `game/src`

| File | What it does |
|---|---|
| `main.js` | Scene, lights, wiring, spawn points, game state (`start` / `playing` / `paused` / `gameOver`, `endGame`, `resetGame`, `updateGame`, `pauseGame`, `resumeGame`), frame loop |
| `style.css` | Page reset, sky blue background, `.score` pill, shared look for the `.start-screen` and `.game-over` overlays |
| `components/Player.js` | Loads `tode.glb`, arrow-key input queue, hop movement, `resetPlayer`, `stopPlayer`, `placePlayer` |
| `components/Enemy.js` | Loads `enemy.glb` once and clones it, the three enemy types, chase movement, health and knockback, animations |
| `components/Collision.js` | Collision radius from model vertices, `collidesAt`, `canMoveTo`, `isBlockedByBoxes` |
| `components/Attack.js` | Space key, cooldown, fading yellow circle, the recharge ring, returns the list of enemies the attack hit |
| `components/Score.js` | Score value, the saved high score, and the `div.score` display |
| `components/GameOver.js` | The `div.game-over` overlay |
| `components/StartScreen.js` | The `div.start-screen` overlay: title, story line, controls, "Press Space to start" |
| `components/Difficulty.js` | Turns the score into current speeds, delays, and attack reach |
| `components/Map.js` | Checkerboard floor, map size constants |
| `components/House.js` | Loads `small_house.glb`, places 3 houses at random, gives each a collision rectangle |
| `components/Scenery.js` | Trees and rocks, built from simple shapes, placed at random; each blocks movement |
| `components/Decoration.js` | Flowers and bushes that are only decoration (nothing collides with them) |
| `components/Fence.js` | Wooden fence around the edge of the floor (looks only, no collision of its own) |
| `components/Sound.js` | All sound effects, generated in the browser (no sound files); the separate sound and music switches (saved); the M key |
| `components/Music.js` | Background tune, generated note by note (no music file) |
| `components/PowerUp.js` | Tea cup power-ups: spawning, pickup, timers, the shield bubble, the effect multipliers |
| `components/PowerUpDisplay.js` | The `div.power-ups` row under the score that lists active power-ups |
| `components/Pause.js` | The `div.pause` overlay ("Paused — Press P to continue") |
| `components/Shelter.js` | Hiding in houses: open/closed houses, the glowing frame, the hiding timer, where Tode comes out, the exit burst |
| `components/Settings.js` | The ⚙ button and the "Help and settings" screen: music and sound switches, and the how-to-play guide |
| `components/Touch.js` | On-screen buttons and tap-to-start for phones and tablets; `isTouchDevice()` |
| `components/HighScoreHint.js` | The small "Press R to reset" lines on the start and "Game Over" screens |
| `components/Camera.js` | Perspective camera |
| `components/Renderer.js` | WebGL renderer on `canvas.game` |

## Conventions used in the code

- **The world is Z-up.** Ground is the XY plane, height is Z. Models are authored Y-up, so each gets `model.rotation.x = Math.PI / 2`.
- Each character is a `THREE.Group` with the loaded model as a child. The group stays on the ground (z = 0).
- The camera is a child of the player group, so it follows Tode.
- Components export `createX()` plus `updateX()` / `resetX()` functions. State lives at module level.
- Collision radius is stored on `group.userData.radius` (missing until the model has loaded).
- Everything that blocks movement (houses, trees, rocks) stores a ground rectangle on `userData.box` (`minX`, `maxX`, `minY`, `maxY`, in world units). `main.js` keeps them all in one `obstacles` list. Houses also have `userData.isHouse = true`, because only they can be hidden in.
- One floor tile is 40 units (`TILE_SIZE`), the same as one hop. The map is 17 × 17 tiles (680 units), centred on the origin.
- Time is in seconds, taken from one `THREE.Clock` in `main.js`. The per-frame time is capped at 0.1 s.
- Tuning numbers are named constants at the top of each file.
- UI colours are soft, not neon (user preference).

## Change log

### 1. Scene setup
- `main.js`: scene, `AmbientLight` (1.5), `DirectionalLight` (1.5) at `(-100, -100, 200)`.
- `Player.js`: group at the centre, `tode.glb` scaled by 20, lifted with a bounding box so it sits on the ground.
- `Camera.js`: 30° field of view, far plane 9000, position `(300, -300, 300)`, `up = (0, 0, 1)`, looks at the origin.
- `Renderer.js`: `alpha` and `antialias` on, sized to the window.
- Extra, not in the spec: window resize handler and `setPixelRatio`.

### 2. Player movement
- Arrow keys go into a queue. Each move is a hop: progress 0 to 1, height from `Math.sin(progress * Math.PI)`.
- Constants: `MOVE_SPEED = 5` (hops per second), `JUMP_HEIGHT = 12`, `JUMP_DISTANCE = 40`.
- Decision: the hop height and the turn are applied to the **model**, not the group, so the camera does not bounce.
- Decision: the queue holds at most 2 moves (`MAX_QUEUED_MOVES`), so holding a key does not build a backlog.
- Decision: directions follow the map. Up = +Y, Down = -Y, Left = -X, Right = +X. On screen these look diagonal.
- Facing: `model.rotation.y = Math.atan2(direction.x, -direction.y)`. This assumes the model's front is +Z.

### 3. Adding enemies
- `Enemy.js`: model scaled by 5, cloned with `SkeletonUtils.clone` because it is a skinned model with animations.
- Spawn points: the four corners at ±300 (`MAP_HALF_SIZE`). One enemy per corner at the start, then one more on a timer, going round the corners in turn.
- `ENEMY_SPEED = 50` units per second, `ENEMY_SPAWN_DELAY = 2` seconds.
- The spawn timer counts up in the frame loop (lesson 8 asks for this).
- Enemy facing: `enemy.rotation.z = Math.atan2(dx, -dy)`, same front assumption as Tode.

### 4. Collision detection
- `Collision.js`: the radius is the root mean square horizontal distance of the model's vertices from its centre. This fits the body and mostly ignores thin parts like wings. No raw bounding boxes.
- Skinned models need `skeleton.update()` before their vertices can be read (`updateModelMatrices`).
- `COLLISION_DISTANCE = 0` is an extra gap added to the two radii.
- Enemies only step into free space. If blocked, they try sliding along X, then Y, so they surround Tode instead of queueing.
- A step that moves away from something already overlapped is always allowed, so nobody gets stuck (matters for enemies spawning on top of each other).

### 5. Attack
- Space triggers the attack. `ATTACK_COOLDOWN = 1` s, `ATTACK_RADIUS = 60` (was 40 until the balance change below).
- A soft yellow circle (`0xffe066`) at z = 0.25, child of the player group, fades out over 0.3 s.
- An enemy is hit when its body touches the circle (distance minus enemy radius ≤ attack radius).
- A press during the cooldown was dropped, not saved. (Changed on 2026-10-13: it is now remembered, see "Attack presses are remembered".)
- `updateAttack` returned the number of enemies removed. (Changed later: it now returns the list of hit enemies, see "Enemy animations".)

### 6. Score
- `SCORE_PER_SECOND = 0.1`, `SCORE_PER_KILL = 10`. The display is rounded down.
- `div.score` is created in `Score.js` and styled as a white pill at the top centre.
- Uses the existing clock's frame time rather than a second clock.

### 7. Start → playing → game over
- The game ends when an enemy and Tode touch. This is checked before other collision rules, both when an enemy steps toward Tode and when Tode hops into an enemy.
- `updatePlayer` and `updateEnemy` return `true` on a touch.
- Game over: overlay shown with the final score, Tode hidden, world frozen (no movement, spawns, score, or attacks).
- Space resets: player to the centre, enemies cleared and respawned at the corners, score to 0, attack state cleared.
- Decision: Space is ignored for the first 0.5 s of game over (`RESET_DELAY`), so a late attack press does not restart at once.
- The reset happens inside the frame loop, after all key listeners have run, so the same Space press cannot also fire an attack.
- The course spec has no start screen. One was added later, see "Own changes".

### 8. Increasing complexity
- `Difficulty.js`: `factor = score * DIFFICULTY_GROWTH_RATE` (0.005, so the factor is 1 at a score of 200).
- Speeds and attack reach are multiplied by `1 + factor * growth`. Delays are divided by it, so they never reach zero.
- Growth values: enemy spawn 1, enemy speed 1, player speed 0.25, attack cooldown 0.5, attack radius 0.25.
- Spawn delay never goes below 0.3 s.
- Base values stay in `Player.js`, `Enemy.js`, `Attack.js` and are exported. The update functions take the current value as an argument.
- The attack circle is a radius-1 circle scaled to the current reach.

### 9. Game world
- `Map.js`: a map group with one floor plane. The checkerboard is a 2×2 pixel canvas texture (`#228B22` and `#90EE90`) repeated across the plane, with `NearestFilter` so tile edges stay crisp. `MeshBasicMaterial`, so the colours are exactly the spec's.
- `House.js`: 3 houses, scale 65, `rotation.x = Math.PI / 2`, a random quarter turn on `rotation.y`, lifted to the ground with a precise bounding box. Added to the map group.
- House placement is random but keeps clear of the map edge (60), other houses (120), the player's start and the enemy spawn points (100).
- House collision is a circle-against-rectangle test (`isBlockedByBoxes`). A rectangle fits a house well because quarter turns keep the walls lined up with the axes.
- Tode hops on the spot when a house blocks him. Enemies slide along the wall.
- Spawn points moved to the centres of the corner tiles (±320).
- Camera `NEAR` raised from 0.1 to 10, so the attack circle (0.25 above the floor) does not flicker against the floor.
- Houses are not re-rolled on restart; they stay where they are until the page is reloaded.

### Bug fixes found by browser testing (2026-10-12)
- **Enemy size was measured about 30 times too big** (radius 136 instead of 4.2). Cause: `updateWorldMatrix` does not refresh how a skinned mesh is bound to its bones; `updateMatrixWorld(true)` does. Fixed in `Collision.js` (`updateModelMatrices`). Effects before the fix: attacks hit enemies far away, and enemies froze near houses.
- Attack circle was hard to see on the light green tiles. Colour changed to `0xffd43b`, starting opacity to 0.9.

### Own changes after the course (2026-10-12)
- **Attack reach raised**: `ATTACK_RADIUS` 40 → 60 in `Attack.js`, because a mistimed attack was nearly always fatal. `Difficulty.js` scales from this base, so the reach now grows from 60.
- **Map borders**: `isInsideMap(x, y)` in `Map.js`. Tode can go as far as the centre of the outermost tiles (±320) and hops on the spot at the border, the same as against a house. The check is in `updatePlayer` in `Player.js`. Enemies need no check because they spawn inside and always walk toward Tode.

- **Visible border (2026-10-13)**: `Fence.js` draws a wooden fence on the edge of the floor (±340), built from simple boxes, no model file. One post per tile corner (68 posts, drawn as one `InstancedMesh`) and two rails per side. Soft browns: posts `0x8f6f4e`, rails `0xb8956c`, `MeshLambertMaterial` so the lights shade it. Posts are 12 high, lower than Tode, so the fence never hides him at the near edges. Added to the map group in `main.js`. The fence is decoration only; `isInsideMap` is what stops Tode, 20 units before the fence.
- **Sky background (2026-10-13)**: `body { background: #cfe8f5; }` in `style.css`, a soft sky blue. It shows around the map because the renderer uses `alpha: true` (a transparent canvas), so no Three.js change was needed.
- **Start screen (2026-10-13)**: `StartScreen.js` shows an overlay when the page opens: the title "Tode the Frog", one story line, the controls (arrow keys = hop, Space = attack), and "Press Space to start". It shares the dark see-through look of the "Game Over" screen (the CSS rules are combined).
  - `main.js` now has three states in `gameState`: `start`, `playing`, `gameOver` (this replaced the `isGameOver` flag). The world is frozen in `start` and `gameOver`.
  - Space on either screen sets `startRequested`; the frame loop then calls `resetGame()`, which is used for both the first start and every restart. It also clears the arrow-key queue and any pending attack, so keys pressed on the start screen do nothing once the game begins.
  - Layout: the text is split so Tode stays visible in the middle of the screen. The title and story sit just above him (`.start-screen-top`), the controls and "Press Space to start" just below (`.start-screen-bottom`). It is a 3-row CSS grid with a 140px clear band in the middle row.
  - The score pill is hidden while the start screen is up (`body:has(.start-screen:not([hidden])) .score`), because it would sit under the title on short windows.
- **Enemy animations (2026-10-13)**: the enemy model file already contains animation clips. Three are used, matched by the end of the clip name:
  - `Fast_Flying` while chasing Tode.
  - `Flying_Idle` (hovering in place) on the start screen and the "Game Over" screen.
  - `Death` (0.67 s) when an attack hits. The enemy plays it once, then is removed from the scene.
  - Unused clips still in the file: `Headbutt`, `HitReact`, `No`, `Punch`, `Yes`.
  - How it is built: every enemy has its own `THREE.AnimationMixer` on `enemy.userData.mixer`, with its actions on `enemy.userData.actions` and the wanted animation name on `enemy.userData.animation` (so it can be set before the model has loaded). Animations blend into each other over 0.2 s. Each enemy starts its flying loop at a random point so they don't flap in step.
  - New in `Enemy.js`: `setEnemyAnimation`, `playEnemyDeath`, `updateEnemyAnimation`, and the exported names `ANIMATION_FLY`, `ANIMATION_IDLE`.
  - `Attack.js`: `updateAttack` no longer takes `scene` and no longer removes enemies from the scene. It takes the hit enemies out of `enemies` and returns them as a list. Score uses the list's length.
  - `main.js`: a `dyingEnemies` list holds enemies playing their death animation. They are out of `enemies`, so they can't block, hurt, or be hit again. `updateAnimations(delta)` runs every frame in every game state. `resetGame` also clears dying enemies.
- **Punch when Tode is caught (2026-10-13)**: the enemy that touches Tode plays the model's `Punch` clip (1.17 s, plays once) before the "Game Over" screen comes up.
  - Sequence in `main.js` (`endGame(catcher)` then `updateGameOver(delta)` each frame): the world freezes at once and input is off; the catcher turns to Tode and punches while the other enemies hover; Tode disappears at `PUNCH_HIT_TIME = 0.45` s; the "Game Over" screen appears at `GAME_OVER_SCREEN_DELAY = 1` s. Before this change Tode vanished and the screen appeared instantly.
  - The screen is delayed on purpose: the camera keeps Tode in the middle, exactly where the "Game Over" text goes, so the punch would be hidden behind it.
  - Space restarts only after `GAME_OVER_SCREEN_DELAY + RESET_DELAY` (1.5 s after the catch).
  - `updateGame` now returns the catching enemy (or `null`) instead of true/false. If Tode hops into an enemy, the catcher is the nearest enemy (`findNearestEnemy`).
  - `Enemy.js`: new `ANIMATION_PUNCH` and `faceEnemyToward(enemy, x, y)`. Death and Punch are "one-shot" animations (`ONE_SHOT_ANIMATIONS`): play once, hold the last pose.
  - Unused clips still in the model file: `Headbutt`, `HitReact`, `No`, `Yes`.
- **Headbutt instead of punch (2026-10-13)**: the catcher now plays the `Headbutt` clip, because the punch could not be told apart from flying. Names changed to match: `ANIMATION_HEADBUTT` (was `ANIMATION_PUNCH`), `HEADBUTT_HIT_TIME` (was `PUNCH_HIT_TIME`). The rest of the catch sequence described above is unchanged.
  - Timing was set from the animation data in the model file, not by eye: the enemy leans back at about 0.1 s, strikes at about 0.3 s, and is back to rest by about 0.55 s. So `HEADBUTT_HIT_TIME = 0.3` (was 0.45) and `GAME_OVER_SCREEN_DELAY = 0.8` (was 1).
  - Space restarts 1.3 s after the catch (0.8 + `RESET_DELAY` 0.5).
  - Unused clips still in the model file: `Punch`, `HitReact`, `No`, `Yes`.
- **Sound effects (2026-10-13)**: `Sound.js` makes every sound with the browser's Web Audio API. There are no sound files, so nothing to download and no licences to credit.
  - Two building blocks: `playTone` (one note that can slide in pitch) and `playNoise` (a filtered hiss, for a "whoosh"). Each sound gets a volume curve that rises and fades, so nothing clicks.
  - The sounds and where they are triggered:

    | Sound | Function | Triggered in |
    |---|---|---|
    | Two rising notes when a game begins | `playStart` | `resetGame` in `main.js` |
    | Short quiet "boing" per hop | `playHop` | `updatePlayer` in `Player.js`, when a hop starts |
    | Whoosh plus a low note per attack | `playAttack` | `updateAttack` in `Attack.js`, when an attack fires |
    | One "pop" per attack that hits, higher with more enemies | `playDefeat(count)` | `updateGame` in `main.js` |
    | Dull thump when the headbutt lands | `playHit` | `updateGameOver` in `main.js`, as Tode disappears |
    | Three falling notes | `playGameOver` | `updateGameOver` in `main.js`, as the screen appears |

  - `MASTER_VOLUME = 0.25` sets the overall loudness. The hop is the quietest sound because it repeats several times a second.
  - **M** switches sound off and on (`toggleMute`). The start screen lists it under the controls. The choice is not remembered after a page reload.
  - Browsers block sound until the player presses a key, so the audio is created on the first key press (`createSound` in `main.js` sets this up). The start screen needs a Space press anyway, so nothing is missed.
- **Background music (2026-10-13)**: `Music.js` plays a short looping tune built from the same Web Audio notes as the sound effects. No music file, so nothing to download or credit.
  - The tune: 4 bars over the chords C, A minor, F, G, at 96 beats per minute, about 10 seconds per loop. A soft triangle-wave melody (`MELODY`) over a low sine-wave bass (`BASS`). Both are lists of note numbers (60 = middle C, `null` = rest), 32 steps of half a beat each, so the tune is easy to rewrite.
  - It plays only while playing: `startMusic()` in `resetGame`, `stopMusic()` in `endGame` (a quick fade, so the headbutt thump and the game over notes stand out). It restarts from the beginning each game. The start screen is silent, because browsers block sound before the first key press.
  - `updateMusic()` runs every frame from the animation loop and schedules the notes due in the next 0.15 s on the audio clock. So the rhythm stays even when a frame runs late, and the music pauses by itself when the tab is hidden.
  - `MUSIC_VOLUME = 0.35` is the loudness compared to the sound effects. The music goes through its own volume node into the master volume, so **M mutes it too**.
  - `Sound.js` changes to support this: `playTone` is now exported and accepts an exact `start` time and an `output` node; new `getAudio()` gives access to the audio context and master volume.
- **Music speeds up with the difficulty (2026-10-13)**:
  - `Difficulty.js` has a sixth value, `musicTempo`: `1 + factor * MUSIC_TEMPO_GROWTH` (0.25), capped at `MAX_MUSIC_TEMPO = 1.75`. It is a multiplier on the starting tempo of 96 beats per minute.

    | Score | Tempo multiplier | Beats per minute |
    |---|---|---|
    | 0 | 1.0 | 96 |
    | 100 | 1.125 | 108 |
    | 200 | 1.25 | 120 |
    | 400 | 1.5 | 144 |
    | 600 and above | 1.75 (the cap) | 168 |

  - `Music.js`: new `setMusicTempo(scale)`. `updateGame` in `main.js` calls it every frame with `difficulty.musicTempo`. A change takes effect from the next note, so the speed-up is smooth. Notes get shorter along with the steps, so they don't smear together. `startMusic()` resets the tempo to normal for each new game.
- **Power-ups (2026-10-13)**: tea cups appear on the map (Tode's morning tea from the story). Hopping onto one gives a power-up.

    | Type | Colour | Effect | Lasts |
    |---|---|---|---|
    | Speed | soft blue `0x6fb7e8` | Tode hops 1.6× faster | 6 s |
    | Big attack | warm yellow `0xf2c14e` | attack reach 1.6×, cooldown halved | 6 s |
    | Shield | soft violet `0xb48ee0` | the next enemy that catches Tode is defeated instead (+10 points) | until used |

  - Cups: a new one every 8 s (`SPAWN_DELAY`), at most 2 on the map, on the centre of a random tile that is inside the map, clear of houses, and at least 80 units from Tode. A cup disappears after 12 s and blinks for its last 3 s. The type is random.
  - The cup is built from simple shapes (cylinder, torus handle, a coloured disc of tea), no model file. It floats, bobs and spins. The tea colour and a ring on the ground show the type.
  - Different types can be active together. A second cup of the same type restarts its timer.
  - The power-up multipliers are applied on top of the difficulty values in `updateGame` (`getPowerUpModifiers()`), so both systems stay separate.
  - Shield: a see-through bubble on the player group. In the animation loop, a catch first calls `useShield()`; if it returns true, `blockWithShield(catcher)` defeats that enemy (death animation, +10) instead of `endGame`.
  - Display: `PowerUpDisplay.js` shows a pill per active power-up under the score, in the type's colour, with the seconds left ("Speed 5s"; the shield shows no time).
  - Sounds added to `Sound.js`: `playPowerUp` (three quick rising notes on pickup), `playShieldBreak` (a falling "ping").
  - `resetGame` calls `resetPowerUps(scene)`: cups removed, effects ended.
  - Start screen story line now reads: "Monsters are closing in on Tode's home. Fight them off, and grab a cup of his tea for a boost."
- **Saved high score (2026-10-13)**:
  - Kept in the browser's `localStorage` under the key `tode-the-frog-high-score`, so it survives closing the page. It is per browser and per site address: a different browser, a private window, or a different address (for example after publishing the game) starts from zero. Every storage call is in a `try`/`catch`, because storage can be switched off; then the high score still works until the page is closed.
  - `Score.js`: `loadHighScore` (on `createScore`), `saveHighScore()` (returns true for a new high score), `getHighScore()`. The pill now holds two spans: the score, and a smaller, paler "Best: N" (`.score-best`), hidden until there is a high score.
  - `main.js`: `saveHighScore()` is called once, when the "Game Over" screen appears.
  - `GameOver.js`: `showGameOver(score, highScore, isNewHighScore)` shows a new line under the score: "New high score!" in soft gold (`.game-over-new-best`), or "Best: N".
  - The best in the pill does not climb during a game; it updates when the game ends.
- **High score reset (2026-10-13)**: press **R** twice to reset the high score.
  - It only works on the start screen and the "Game Over" screen, never during play, and only when there is a high score. The second press must follow within 3 seconds (`RESET_CONFIRM_TIME` in `main.js`); otherwise the hint goes back to normal. The key handler is in `main.js`.
  - `HighScoreHint.js` makes a small line of text on each screen and keeps both in step. It reads "Best: 50 · Press R to reset" on the start screen (which did not show the high score before) and "Press R to reset the high score" on the "Game Over" screen; then "Press R again to reset the high score"; then "High score reset". The line is hidden when there is no high score.
  - `Score.js`: `resetHighScore()` clears the value, the pill, and the stored entry. `GameOver.js`: `clearGameOverBest()` empties the "Best: N" line after a reset.
- **Happier sound for a new high score (2026-10-13)**: `playHighScore` in `Sound.js` is a rising fanfare (the notes C, E, G, high C, with a soft shimmer on the last one; 5 tones in all). In `updateGameOver` in `main.js` it plays **instead of** the three falling `playGameOver` notes when `saveHighScore()` reports a new high score. The headbutt thump before it is unchanged.
- **New enemy types (2026-10-13)**: there are now three types. All use the same model file, changed in size and colour (`ENEMY_TYPES` in `Enemy.js`).

    | Type | Look | Speed | Hits to defeat | Points | Appears from score | Top share of spawns |
    |---|---|---|---|---|---|---|
    | Normal | as before (black and yellow) | 1× | 1 | 10 | 0 | the rest |
    | Scout | 0.75× size, soft red `0xe07a6a` | 1.6× | 1 | 15 | 30 | 35% (reached at score 230) |
    | Brute | 1.6× size, soft indigo `0x7a6fc0` | 0.6× | 2 | 30 | 80 | 25% (reached at score 380) |

  - `pickEnemyType(score)` chooses the type of each timed spawn. The four enemies at the start of a game are always normal. Measured mix: 100% normal up to score 30; about 80/17/4 (normal/scout/brute) at 130; 52/36/12 at 230; 40/35/25 from 380 on.
  - Size: the enemy group is scaled, so the model stays on the ground; the collision radius scales with it (normal 4.2, scout 3.2, brute 6.8).
  - Colour: each type gets its own tinted copies of the model's materials (`getTintedMaterial`, blended 55% toward the tint), made once and shared by all enemies of that type.
  - Health: `enemy.userData.health`. `damageEnemy(enemy)` takes one point off and returns true when the enemy is defeated. A brute that survives a hit plays the model's `HitReact` clip and is pushed 30 units away from Tode (`knockBackEnemy`), unless a house or the map edge is in the way; then it goes back to flying.
  - `Attack.js`: `updateAttack` now only returns the list of enemies it hit. `updateGame` in `main.js` decides per enemy: defeated (removed, death animation, points) or survived (knockback).
  - Score: each enemy has `userData.value` (1, 1.5 or 3 "normal kills"); `updateScore` multiplies it by 10. The shield also uses this value, and defeats any type outright.
  - New sound `playEnemyHurt`: a short low "thunk" when a hit does not defeat an enemy.
  - Unused clips still in the model file: `Punch`, `No`, `Yes`.
- **Pause key (2026-10-13)**: **P** or **Escape** pauses the game and continues it.
  - A fourth game state, `paused`, in `main.js` (`pauseGame`, `resumeGame`). It can only be entered from `playing`, so P does nothing on the start and "Game Over" screens.
  - While paused nothing runs: no game update, no animations, no music scheduling, no power-up timers. The frame loop only keeps drawing the same picture.
  - Sound: `pauseAudio()` / `resumeAudio()` in `Sound.js` suspend and resume the whole audio context, so the music stops mid-note and carries on from the same place. A flag stops other key presses from waking the audio while paused.
  - Keys pressed while paused are thrown away on resume (`clearPlayerInput` in `Player.js`, `clearAttackRequest` in `Attack.js`), so Tode does not hop or attack by surprise.
  - **Auto-pause**: switching to another tab or minimising the window pauses the game (`visibilitychange`). It does not continue by itself; P is needed.
  - `Pause.js` is the overlay; it shares the look of the other two overlays in `style.css`.
  - Start screen: the controls list now has rows (`CONTROL_ROWS`). "P Pause" and "M Sound" share the last row, so the list did not get taller.
- **Touch controls for phones (2026-10-13)**: `Touch.js` adds on-screen buttons on touch devices only (detected with the media query `(pointer: coarse)`; desktop is unchanged).
  - Buttons: four direction buttons in a square at the bottom left, a large yellow **Attack** button at the bottom right, and small pause (II) and sound (♪) buttons at the top right. Holding a direction button keeps Tode hopping (repeats every 150 ms).
  - The direction buttons are labelled ↖ ↗ ↙ ↘ and placed to match how Tode moves on screen (the map is seen from a corner): ↖ = Left key, ↗ = Up, ↙ = Down, ↘ = Right.
  - How it works: a button sends the game a made-up key press (`pressKey` dispatches a `keydown` event). So the rest of the game needed no touch-specific code, and touch and keyboard always behave the same.
  - Tapping the start screen or the "Game Over" screen acts as Space; tapping the pause screen acts as P; tapping the high score line acts as R (twice to reset). The hint texts change on touch devices: "Tap to start", "Tap to play again", "Tap to continue", "Tap here to reset...".
  - Everything reacts on finger-down (`pointerdown`). This matters for pause: with `click`, the finger that pressed the pause button also counted as a tap on the pause screen and un-paused at once (found and fixed during testing).
  - The buttons are hidden while the start, pause or "Game Over" screen is up. The keyboard controls list on the start screen is hidden on touch devices.
  - Sound on phones: browsers only allow audio after a finger lifts, so `unlockAudio()` (new in `Sound.js`) runs on every `pointerup`.
  - `style.css`: a `.touch` class on `body` turns off page scrolling, zooming and text selection under the fingers. `index.html`: the viewport line now has `initial-scale=1, user-scalable=no`.
  - Small fix alongside: the "Game Over" screen no longer shows "Best: 0" when there is no high score yet.
- **"Turn your phone" screen (2026-10-13)**: while a touch device is held upright (portrait), a full-page screen says "Turn your phone sideways to play", with a small outline of a phone tipping onto its side.
  - Built in `Touch.js` (`createRotateHint`), so it only exists on touch devices. A desktop browser never gets it, even with a tall narrow window. `style.css` shows it with `@media (orientation: portrait)`.
  - It covers the whole page, so taps cannot reach the game. On top of that, `main.js` ignores start, restart and continue while `isPortrait()` is true.
  - Turning the phone upright during play pauses the game (`onTurnedPortrait` in `main.js`). After turning it back, the "Paused" screen is waiting and a tap continues.
  - The tipping animation is switched off for people who have asked their device for less motion (`prefers-reduced-motion`).
- **Help and settings screen (2026-10-13)**: asked for as "a setting option where 'how to' helps to guide us, and an option to turn on/off music & sound".
  - **Opening it**: a round ⚙ button at the top left on every device and every screen, or the **H** key. Closing: the Close button, H, Escape, or a click on the dark area around the panel.
  - **Settings**: two switches, **Music** and **Sound effects**, each On/Off on its own. The choices are saved in `localStorage` (`tode-the-frog-music`, `tode-the-frog-sound`, values `on`/`off`) and are still there after a reload. Default is both on.
  - **How to play**: four short sections. Goal; Controls (keyboard keys on a computer, the on-screen buttons on a phone); Monsters (the three types with their colour and points); Tea cups (the three power-ups with their colour, effect and duration). The monster and tea cup lines are built from `ENEMY_TYPES` and `POWER_UP_TYPES` (now exported), so the guide cannot drift from the real numbers.
  - **During a game** opening it pauses the game. After closing, the "Paused" screen is waiting, so nothing moves by surprise. While it is open, Space does not start a game, P does not un-pause, and R does not reset the high score.
  - **Sound.js rework**: one master volume, and in front of it two switch nodes, `effectsOutput` and `musicOutput`. Sound effects go to the first, the music (`Music.js`) to the second. New: `isSoundOn`, `isMusicOn`, `setSoundOn`, `setMusicOn`, `onSoundChange`. The old single mute flag is gone.
  - **The M key changed meaning slightly**: it now turns both switches off if anything is on, and both on if everything is off. The switches on the screen follow it. The touch ♪ button does the same.
  - `Settings.js` builds the screen. `main.js` has `toggleSettings()` and one key handler for H, P and Escape. The start screen's controls list gained "H Help".
  - On small screens the panel scrolls (it allows vertical swipes even though the rest of the page ignores them on touch devices).
- **Hiding in houses (2026-10-13)**: the user's idea, built the way recommended and approved in the session.
  - **Trigger**: hopping into an **open** house, from any side. No extra key, so it works the same on phones. An open house has a softly pulsing yellow frame on the ground around it. A closed house has no frame and just blocks, as before.
  - **Rules** (constants at the top of `Shelter.js`):

    | Rule | Value | Constant |
    |---|---|---|
    | Time inside | 4 s, then Tode is put back outside | `HIDE_TIME` |
    | Leaving early | an arrow key (or touch arrow) leaves on that side | – |
    | House closed after use | 20 s | `HOUSE_COOLDOWN` |
    | Push-back on leaving | enemies within 70 units of the exit are knocked back | `EXIT_PUSH_RADIUS` |

  - **While hiding**: Tode is invisible and the rest of the game waits. Enemies hover in place (idle animation), nothing spawns, power-up timers and tea cups are frozen, the attack is off, and no points are earned. Music keeps playing. A pill at the bottom of the screen counts down: "Hiding: 3s · press an arrow to leave".
  - **Coming out**: on the chosen side if it is free (inside the map, not inside another house). If no arrow was pressed (time ran out) or that side is blocked, on the free side furthest from any enemy. A pale ring bursts outward and nearby enemies are pushed back with `knockBackEnemy`, so stepping out is not an instant "Game Over".
  - **Code**: `Player.updatePlayer` now returns what Tode ran into: `PLAYER_CAUGHT`, the blocking house, or `null` (it returned true/false before). `Collision.findBlockingBox` returns the obstacle itself; `isBlockedByBoxes` is built on it. In `main.js`, `updateGame` calls `updateShelters` every frame and has an early branch for the hiding state; `enterShelter` and `leaveShelter` do the switching. `resetGame` calls `resetShelters` (all houses open again).
  - New sounds: `playEnterHouse` (a low door knock), `playLeaveHouse` (a rising whoosh).
  - The help screen has a new "Houses" section, built from `HIDE_TIME` and `HOUSE_COOLDOWN`.
  - The frame is created the first time a game runs, so it does not show on the start screen before the first game.
- **Attack presses are remembered (2026-10-13)**: the user reported that Space "won't work if pressed two or three times within half a second".
  - Cause: not a broken key. The attack recharges for 1 second (`ATTACK_COOLDOWN`, from the course spec), and presses during that time were thrown away on purpose. With no feedback, that felt like the key failing.
  - Fix in `updateAttack` in `Attack.js`: a press during the recharge is now kept (`attackRequested` stays true) and the attack fires the moment the recharge ends. Several presses still give one attack, not a queue of them.
  - The saved press is still cleared where it should be: on pause/continue, when entering or leaving a house, and on game over/restart (`clearAttackRequest`, `resetAttack`).
  - Not changed: the 1 second recharge itself. (The on-screen sign followed, see "Recharge ring".)
- **Recharge ring (2026-10-13)**: a small ring on the ground around Tode shows the attack recharging.
  - It appears when an attack fires, fills clockwise from the top in a cream colour (`0xfff6d6`) over a faint dark track, and disappears the moment the attack is ready. No ring means "ready".
  - It follows the real recharge time, so it fills faster as the difficulty shortens the cooldown, and twice as fast with the "Big attack" tea.
  - Built in `Attack.js` (`createRechargeRing`, `updateRechargeRing`). The ring is one fixed shape of 64 slices; the fill is shown by drawing only the first slices (`geometry.setDrawRange`), so nothing is rebuilt each frame. `cooldownTotal` remembers the length of the running recharge.
  - `createAttack(player)` now adds the attack circle and the ring to the player group itself (before, `main.js` added the circle).
  - It is hidden with Tode (in a house, after being caught) and cleared by `resetAttack`.
- **Trees and rocks (2026-10-13)**: `Scenery.js` adds 7 trees (pointed pines and round ones, alternating) and 5 rocks.
  - They are built from simple shapes in a low-poly style (cylinders, cones, many-sided balls, `flatShading`), not from model files. So there is nothing to download and nobody to credit. Real downloaded models (for example from poly.pizza) remain an option, but each would need its licence checked and credited.
  - Colours: leaves in two darker, bluer greens (`0x2f6f4f`, `0x3a8560`) so they stand out from the floor; brown trunks; two soft greys for rocks. Each piece gets a random size (0.85 to 1.25) and turn.
  - Placement: on the centre of a random tile, at least 80 units from every house, 70 from Tode's start and the enemy corners, one tile in from the fence, and never on neighbouring tiles. The layout is new on every page load, like the houses.
  - They block Tode and the enemies. A tree blocks only at its trunk (a 10-unit square), so characters can stand under the edge of the leaves; a rock blocks a 14-unit square. Tea cups never appear on a tile with a tree or rock.
  - `main.js`: `obstacles = [...houses, ...scenery]` is what movement, tea cup placement, push-backs and house exits now check. Shelter code still gets only `houses`, and `isHouseOpen` checks `isHouse`, so Tode cannot "hide" in a tree.
- **Enemies go round obstacles (2026-10-13)**: needed because more obstacles meant more enemies getting stuck (a known weakness since the houses lesson).
  - Before: an enemy blocked by a house could only slide along one axis, and froze when Tode was straight across from it.
  - Now, in `updateEnemy` in `Enemy.js`: when a house, tree or rock is in the way, the enemy steps sideways along it at full speed. Each enemy has its own fixed side (`userData.detourSide`, 1 or -1, picked at random when it is created), so it walks all the way round instead of dithering; if that side is blocked it tries the other. Enemies blocked by other enemies still slide along one axis as before.
- **Flowers and bushes (2026-10-13)**: `Decoration.js` adds 32 small groups of flowers (2 to 5 flowers each, one colour per group) and 16 low bushes. They are **only decoration**: they have no `userData.box`, are not in the `obstacles` list, and Tode and the enemies move straight through them.
  - Built from simple shapes, no model files. Flower colours are soft pink, cream, yellow and lavender (`FLOWER_COLORS`); bushes are two greens between the bright floor and the dark trees.
  - Placed near the **corners** of tiles (with a little random offset). Tode rests on tile centres, so he rarely ends up standing on a flower or in a bush. They also keep clear of the fence, the houses (52 units) and the trees and rocks (18 units).
  - Drawn efficiently: all stems are one `InstancedMesh`, all flower heads another, all bushes a third (one shape repeated many times, with a colour per instance). About 130 objects cost three draw calls.
  - Random on every page load, like the rest of the map.

### Model paths work in a sub-folder (2026-10-13)

- So the built game can be hosted on GitHub Pages or itch.io, where it sits in a sub-folder.
- New `game/vite.config.js` with `base: './'`: the built page links its files with relative paths.
- `Player.js`, `House.js`, `Enemy.js`: `MODEL_URL` is now `${import.meta.env.BASE_URL}models/<name>.glb`
  instead of `/models/<name>.glb`. `BASE_URL` is the folder the game is served from.
- Checked in headless Chrome: the built game served from `/sub/folder/` loaded all three models (HTTP 200),
  no failed requests, no console errors, game started. The dev server still works the same way.

### Git repository started (2026-10-13)

- `game` is now its own Git repository on branch `master` (renamed from `main` at the user's request), with a first commit ("feat: add Tode the Frog game").
- New `game/.gitignore` skips `node_modules/`, `dist/` and `*.zip`.
- Not done yet: no remote is set and nothing is pushed. The user creates the GitHub repository
  (suggested name `tode-the-frog`) and pushes with their own access token.
- New `game/README.md`: what the game is, controls, how to run and build, and the credits
  (the CC-BY house credit, the enemy model, the Tode model).
- This log is edited after each commit, so it usually shows as changed and needs its own commit.

### Built copy for GitHub Pages (2026-10-13)

- `game/docs` holds the built game, made with `npx vite build --outDir docs --emptyOutDir`. It is committed,
  because GitHub Pages serves it straight from the `master` branch, folder `/docs`.
- `docs` is a copy. After any change to the game, run that command again and commit, or the hosted game stays old.
- The files are the same (same file names) as the sub-folder build that was tested in headless Chrome.
  Not tested on GitHub itself: nothing is pushed yet.

## Verified in the browser (2026-10-12 and 2026-10-13)

- Scene renders: floor, houses, Tode, enemies, score pill. No console errors.
- Tode faces the way he hops. Enemies face Tode.
- Measured collision radii: Tode 6.6, enemy 4.2.
- Enemies walk in from the corners and reach Tode in about 8 seconds if he stands still.
- Attack removes enemies in range and adds 10 points each.
- Game over shows the overlay with the final score and freezes the world. Space restarts after the short delay.
- Map border: after 14 hops in one direction (the border is 8 hops away) Tode stops in the middle of the edge tile.
- Start screen: shows on load, the world stays frozen behind it (checked after 13 seconds), arrow keys pressed on it do not move Tode, Space starts the game without firing an attack. Game over and restart still work afterwards.
- Enemy animations: wings move while flying; hit enemies fall over and disappear after the death animation while an enemy outside the circle keeps coming; score still counts (+10 each); game over and restart still work. No console errors. The death frames were captured by running the test with a controlled clock (Playwright `page.clock`), because the animation is too short for normal screenshots.
- Catch sequence (re-tested after the headbutt swap): Tode stays visible for a moment after being touched, then disappears, and the "Game Over" screen follows about half a second later. Restart with Space works after it. No console errors.
- Flowers and bushes: visible across the map in a screenshot, in groups of one colour, small enough not to be mistaken for obstacles or tea cups, and none on top of a house, tree or rock. Hopping around worked as before. No console errors.
- Trees and rocks: 12 pieces, all on tile centres, none closer than 80 units to a house, to Tode's start, or to each other. They look right from the normal view and from a whole-map view (pines, round trees and rocks are easy to tell apart and stand out from the floor). Hopping into a tree blocked Tode and did not start hiding. No console errors.
- Enemies going round obstacles: an enemy placed straight across a tree from Tode reached him in under 3 seconds, across a rock in 3 seconds, and across a house in 6.5 seconds. Before this change the house case never finished. (Set up through a temporary hook in `main.js`, removed afterwards.)
- Recharge ring: frames taken every 0.2 s after an attack showed no ring before the attack, then the ring about one fifth, two fifths, three fifths and four fifths full, then nearly full, then gone. It is clear on both tile colours and on top of the yellow attack circle. No console errors.
- Attack presses: three presses of Space within about a third of a second gave two attacks, one at once and one as soon as the recharge ended (before the fix: one). A single press still gave exactly one attack. A press saved up just before pausing did not fire after continuing. No console errors.
- Hiding in houses: all three houses showed the frame. Hopping into one hid Tode and showed "Hiding: 4s · press an arrow to leave". Over 2 seconds of hiding, every enemy stayed exactly where it was and the score did not change. When the time ran out, Tode came out on the side away from the nearby enemy, the house lost its frame and showed a 20 s closed time. In a second house, pressing Up let Tode out early at the top side. Hopping into a closed house only blocked him. No console errors. (Tode was placed next to the houses through a temporary hook in `main.js`, removed afterwards.)
- Help and settings screen: H opened it on the start screen; Space did not start the game while it was open. Clicking Music set it to Off and silenced only the music output; clicking Sound effects silenced the other. M with everything off turned both back on, and the switches followed. Clicking ⚙ during play opened it and paused the game; after Close the game was still paused, and P continued. After a page reload, Music Off was remembered. On an emulated phone: tapping ⚙ on the start screen opened it without starting the game, the Controls section showed the touch buttons, the panel was scrollable (358 px visible of 637), and Close left the start screen as it was. Both layouts were checked in screenshots. No console errors.
- "Turn your phone" screen, in an emulated phone: shown when the page loads upright, and a tap did not start the game. Gone after turning sideways, and a tap started the game. Turning upright during play showed the screen and paused the game; a tap did not continue it. After turning sideways again the "Paused" screen was there and a tap continued. A desktop browser with a 500×900 window had no such screen. No console errors.
- Touch controls, in an emulated phone held sideways (844×390, touch input): the start screen read "Tap to start" with the buttons hidden; a tap started the game and showed the buttons; the ↗ button sent the Up key; Attack sent Space, made the attack sound, and the audio was running; the pause button paused and it stayed paused; a tap on the pause screen continued; the "Game Over" screen read "Tap to play again" and a tap restarted; two taps on the high score line reset it without restarting the game. No console errors.
- Pause: P on the start screen did nothing. P during play showed "Paused" and suspended the audio. After 12 seconds paused (enemies need about 8 to reach Tode) the game was not over, no new notes had been made, and a screenshot was pixel-for-pixel identical to the one from 12 seconds earlier. Arrow keys and Space pressed while paused did nothing after resuming (Tode had not moved, no attack circle). Escape paused and continued too. The start screen fits the new "P Pause" entry at 1366×600. No console errors.
- Enemy types: one of each placed beside Tode showed three clearly different enemies (normal; small red scout; large purple brute). One attack defeated the normal and the scout (score 25) and left the brute with 1 health, pushed back from 50 to 75 units away. It flew back in at the slower brute speed, and a second attack defeated it (score 55). The spawn mix by score matched the table above. No console errors. (Placed through a temporary hook in `main.js`, removed afterwards.)
- High score sound: a test counted the notes made when the "Game Over" screen appears. A game that set a new high score made 5 (the fanfare); the next game, which did not, made 3 (the falling notes). No console errors.
- High score reset: with a saved 50, the start screen showed "Best: 50 · Press R to reset". One press of R asked for a second press; with no second press, 3 seconds later the hint was back to normal and the 50 was kept. R twice during play did nothing. R twice on the "Game Over" screen reset it: the hint read "High score reset", the "Best" label and line disappeared, and the stored entry was gone. The extra line fits on the start screen at 1366×600. No console errors.
- High score: first game showed no "Best"; ending it with 30 points showed "New high score!" and saved 30; a second game ending with 10 showed "Best: 30"; after reloading the page the pill still showed "Best: 30". No console errors. (The test added points through the score module instead of playing for them.)
- Power-ups: the game spawned a cup on its own at a valid tile. Picking up each type showed the right pill ("Speed 6s", "Big attack 6s", "Shield") and the right multipliers (speed 1.6; attack reach 1.6 and cooldown 0.5). With the shield, the first enemy to arrive was defeated (+10, shield gone, game continued) and a later one ended the game. After a restart there were no cups and no active power-ups. The cup, its coloured ring, the shield bubble and the pill all show clearly in screenshots. No console errors. (The test moved a cup next to Tode through a temporary hook in `main.js`, removed afterwards.)
- Music tempo: the difficulty code returns the multipliers in the table above. In a running game the step between notes was 0.3125 s at score 0; after the test gave the game 400 points it was 0.208 s, which is exactly 1.5 times faster. No console errors.
- Music wiring: silent on the start screen; during play the notes are scheduled at exact multiples of one step (0.3125 s) and at the expected rate (2.6 notes per second); no notes during the "Game Over" screen; the tune starts again after a restart. No console errors.
- Sound wiring: a test counted the sound sources the game creates. Each action made exactly the expected ones (start 2, hop 1, attack 2, caught 2 + game over 3), the audio was running after the first key press, and M set the volume to 0 and back to 0.25. No console errors. The start screen shows the new "M — Sound on / off" line without crowding Tode.
- Attack circle with the new colour: clearly visible on both tile colours.
- Start screen layout: Tode is clear of the text at 1280×800 and at 1366×600. The score pill is hidden on the start screen and back once the game starts.
- Sky background: shows around the map, the score pill stays readable on it.
- Fence: renders on all sides and at the corners, lines up with the tile corners, and does not hide Tode when he stands at the near or far edge. No console errors.
- Attack reach 60: standing still and attacking once per second removed all four starting enemies in one hit and reached a score of 71 before dying (before the change: 0 to 20).

## Not yet verified (needs a human playing)

- Hiding in houses, the parts the test did not reach: the push-back on leaving (the test's exit was far from the enemy, so nobody was in range), the burst ring's look, the two new sounds, the frame's stronger colour (changed after the screenshots), and above all the balance. Is 4 s inside and 20 s closed right, and does hiding make the game too easy or too slow?
- Whether the how-to-play text is clear to someone who has never seen the game, and scrolling the panel with a real finger on a phone.
- Touch controls on a real phone. The test used Chrome's phone emulation, not a device. Unknown: how the buttons feel under real thumbs, sound on iPhone Safari (stricter than Chrome), how turning a real phone behaves (the test resized an emulated screen), and whether the game runs fast enough on a phone. To try it, the phone needs to reach the dev server: run `npx vite --host` in `game` and open the "Network" address it prints from a phone on the same Wi-Fi.
- Auto-pause when the tab is hidden: the test browser cannot switch tabs, so this was not exercised.
- Enemy type balance in a real game: scouts are fast (1.6×, on top of the difficulty speed-up) and may be too hard late on; brutes may be too easy with the "Big attack" power-up. The numbers are in `ENEMY_TYPES`.
- Power-up balance: how often cups appear (8 s), how long effects last (6 s), and whether the three effects feel worth chasing. Also untested: cups blinking and disappearing after 12 s, and two different power-ups active at once.
- Game feel: hop speed, how hard it is, how fast the difficulty ramps up (`DIFFICULTY_GROWTH_RATE`).
- Balance after the attack reach change: is 60 right, or now too easy?
- Whether the faster music adds tension or just gets annoying, and whether 168 beats per minute is a good top speed (`MAX_MUSIC_TEMPO`, `MUSIC_TEMPO_GROWTH` in `Difficulty.js`).
- **What the music sounds like.** Like the sound effects, nobody has heard it yet. Check the tune, its volume against the effects, and whether a 10-second loop gets tiring.
- **What the sounds actually sound like.** The test browser has no speakers, so nobody has heard them yet. Pitches, lengths and volumes were chosen on paper and may need tuning.
- How the animations feel at full speed (the test browser only gave still frames).
- The headbutt itself: check by eye that it reads as a hit and that Tode disappears as it lands (`HEADBUTT_HIT_TIME`). The enemy is small on screen, so still frames from the test could not settle this.
- Tode blocked by a house, and enemies sliding around a house, were not specifically tested.
- Enemies now step round obstacles, but they still do not plan a path. A tight corner made by several obstacles, or the fence side of an obstacle at the map edge, could still trap one. (Enemies are not stopped by the map border.)
- Whether 12 pieces of scenery make the map feel too crowded, and whether trees hide Tode or enemies too often.

## Next steps

1. Play the game and decide on the items in "Not yet verified".
2. Mark the lessons done in the JetBrains IDE to get the certificate.
3. Read the challenge rules on Discord.
4. Plan and build our own features. Ideas so far: a nicer floor.
5. Submit on Discord from Oct 19, before Oct 23 09:00 UTC. The steps and the files to share are in
   [`SUBMISSION.md`](SUBMISSION.md) (added 2026-10-13, notes only, no code change).

## How the browser test was done

A script used Playwright with the installed Google Chrome (`/usr/bin/google-chrome`, software rendering
flags `--use-angle=swiftshader --enable-unsafe-swiftshader`) against `npx vite --port 5199`, pressed keys,
read the `.score` and `.game-over` elements, and saved screenshots. The script was temporary and is not in the project.
