# How to submit Tode the Frog

Notes for entering the **Build Your Game Challenge** (JetBrains Academy).
Written 2026-10-13.

> **Not confirmed:** the exact rules were not found online. The email only says that
> submissions and voting happen on the JetBrains Academy Discord. Check the challenge
> post on Discord for what it really asks for (link, video or screenshots).

## Dates

| What | When |
|---|---|
| Submissions and voting open | Oct 19, 08:00 UTC |
| Submissions and voting close | Oct 23, 09:00 UTC |
| Winners announced | Oct 28 |

The community vote decides the winners. Posting early gives more time to collect votes.

## Steps

1. Join the JetBrains Academy Discord. Use the invite link in the challenge email.
2. Find the challenge channel or post. It may only appear on Oct 19.
3. Post the entry inside the dates above.
4. Ask people to vote.

## What to have ready before Oct 19

- **A public link to the game.** Right now it only runs on this computer.
  Free hosts: itch.io, Netlify, GitHub Pages.
- **A short video or a few screenshots.**
- **A two-line description**, with the house credit (see the bottom of this file).

## Which files to share

Most likely no files go to Discord directly. It depends on what the rules ask for.

### 1. A playable link (most likely, and best for votes)

Upload only the **built game**: a small, ready-to-run copy made by a build command.

```bash
cd "/home/rabib/codes/whoiam/Build a Game with an AI Coding Agent/game"
npm run build
```

This makes the folder `game/dist`. That one folder is everything a host needs:

- `index.html`
- `assets/` (the game code and styles, packed)
- `models/` (Tode, the enemy, the house)
- `tode.svg` (the tab icon)

The model paths are relative (fixed 2026-10-13), so this folder works at the top of a site
and in a sub-folder. That covers Netlify, GitHub Pages and itch.io.

For itch.io, zip the **contents** of `dist` (so `index.html` is at the top of the zip):

```bash
cd "/home/rabib/codes/whoiam/Build a Game with an AI Coding Agent/game/dist"
zip -r ../tode-the-frog.zip .
```

For GitHub Pages, the built copy is the `docs` folder (already built and committed).
After pushing: repository **Settings** → **Pages** → branch `master`, folder `/docs` → **Save**.
The game is then at `https://YOUR-NAME.github.io/tode-the-frog/`. To refresh it after a change:

```bash
cd "/home/rabib/codes/whoiam/Build a Game with an AI Coding Agent/game"
npx vite build --outDir docs --emptyOutDir
git add docs
git commit -m "build: refresh the GitHub Pages copy"
git push
```

### 2. The source code (for example a GitHub link)

Share the `game` folder with these parts:

| Include | What it is |
|---|---|
| `README.md` | What the game is, and the credits |
| `index.html` | The page |
| `package.json` | The list of tools the game needs |
| `vite.config.js` | Build settings (relative paths) |
| `src/` | All the game code and styles |
| `public/` | The models and icon |

Leave out:

- `node_modules/`: downloaded tools. Anyone can get them again with `npm install`.
- `dist/`: it is rebuilt from the source.
- `PROGRESS.md` and this file: optional. They are work notes, not part of the game.
- The course folders outside `game` (`Skeleton`, `Core_loop` and so on): they are
  JetBrains' lesson material, not your work.

### 3. A video or screenshots

No project files at all. Record the game running.

## Credit to keep

The house model needs this credit wherever the game is published:

> Small House by Jarlan Perez, via Poly Pizza (CC-BY)

## Still open

- [ ] Read the real rules on Discord
- [ ] Pick a host
- [x] Fix the model paths so a sub-folder works
- [ ] Build and upload
- [ ] Record a video or take screenshots
- [ ] Post on Discord between Oct 19 and Oct 23
