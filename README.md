# Tode the Frog

A small 3D game that runs in the browser. You are Tode, a frog. Monsters fly in from the
corners of the map. Keep them away for as long as you can.

Built for the JetBrains Academy course **Build a Game with an AI Coding Agent**, with
[Three.js](https://threejs.org/) (a 3D library) and [Vite](https://vite.dev/) (a build tool).

## How to play

Keep the monsters away from Tode. If one touches him, the game is over. The higher your
score, the faster everything gets.

| Key | What it does |
|---|---|
| Arrow keys | Hop one tile |
| Space | Attack every monster close to Tode |
| P or Esc | Pause and continue |
| M | All sound off or on |
| H | Open and close the help |

On a phone, hold it sideways and use the buttons on the screen.

- **Monsters:** normal ones, small fast scouts, and big slow brutes that take two hits.
- **Tea cups:** hop onto one to drink it. The colour shows what it does: faster hops,
  a bigger attack, or a shield.
- **Houses:** a house with a glowing frame is open. Hop into it to hide for a few seconds.

The full guide is inside the game, behind the ⚙ button.

## Run it on your computer

You need [Node.js](https://nodejs.org/).

```bash
npm install
npm run dev
```

Then open the address it prints.

To make the ready-to-host copy in the `dist` folder:

```bash
npm run build
```

## Credits

- `small_house.glb`: **Small House** by Jarlan Perez,
  [CC-BY](https://creativecommons.org/licenses/by/3.0/), via
  [Poly Pizza](https://poly.pizza/m/053kskrV4U_).
- `enemy.glb`: **Armabee Evolved** by Quaternius, public domain.
- `tode.glb`: from the JetBrains Academy course material.
- Trees, rocks, flowers, bushes, the fence and the tea cups are built from simple shapes
  in code.
- All sounds and music are made in code with the browser's Web Audio API. There are no
  audio files.
