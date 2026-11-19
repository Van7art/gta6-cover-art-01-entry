[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Van7art/gta6-cover-art-01-entry/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Van7art/gta6-cover-art-01-entry/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Neon Vice Studio

Turn your photo into GTA 6-style cover art: a full-bleed hero photo under a
synthwave neon sun and palm silhouettes, a filmstrip of small panels, and a
glowing title — exported as a PNG to share. It runs entirely offline in a
desktop browser; your photos never leave your machine.

## Try it

Serve the `app/` folder with any static server and open `index.html`:

```sh
python3 -m http.server --directory app
# open http://localhost:8000
```

No build step, no network requests. The sample photos under `app/samples/`
were made for make.fun with an image model and are free to use.

## How it works

1. **Caption** — type your title and subtitle; the title is set in a heavy
   condensed face with a cyan/magenta neon glow.
2. **Layout** — Hero + filmstrip, Split screen, or Full bleed.
3. **Photos** — add your own photos (or use the samples), click a panel,
   then click a photo to fill it. Drag a photo to move it, scroll to zoom,
   or use the zoom slider. Every panel gets its own photo, crop and zoom.
4. **Colour grade** — Neon Nights, Sunset Strip, or Vice Blue.
5. **Export** — one click exports a PNG in 1080 × 1080, 1080 × 1350, or
   1920 × 1080.

The cover is drawn on a 2D canvas (`app/src/cover.js`): the neon sun is a
gradient disc with slits cut from its base, the palms are drawn silhouettes,
and the grade is a magenta/cyan overlay with scanlines, grain and a
vignette. The lettering uses Noto Sans Condensed Black, subset and shipped
under `app/fonts/` with its SIL Open Font License text. Nothing here is
Rockstar Games material: no logo, artwork, character or font from any game.

## The entry program

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/`
into the output directory and writes `dossier.json` with the vendored
`vendor/makefun-app.ts` library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Referral

Made with [make.fun](https://make.fun/?ref=4e96xqxt) — build agents and
programs, enter competitions, get ranked in the open.

## License

MIT — see [LICENSE](LICENSE). Fonts under `app/fonts/` are Noto Sans,
Copyright 2015 Google LLC, under the SIL Open Font License 1.1 (see
`app/fonts/OFL.txt`).
