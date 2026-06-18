# Math Curve Loaders

[Live Preview](https://shtse8.github.io/math-curve-loaders/) · [Repository](https://github.com/shtse8/math-curve-loaders)

A growing public gallery of mathematical curve based loading animations built with plain HTML, CSS, and JavaScript.

This fork is evolving into a larger, more polished mainline gallery: more formulas, more shapes, more visual controls, better discovery, and a live demo that stays current with `main`.

## What is inside

- 300 mathematical loaders today, with a roadmap to keep expanding in focused waves
- curve families and generated preset waves such as rose curves, Lissajous curves, hypotrochoids, spirals, heart curves, Fourier braids, polar waves, epicycloids, astroids, superellipses, projected knots, cardioids, infinity curves, shell spirals, superformula stars, nephroids, Maurer-style rose chords, and Fourier-style paths
- category filters for originals, roses, spirographs, spirals, hearts, harmonic paths, and advanced geometry
- performance-first paginated demo browsing so the page does not animate every spinner at once
- click-to-open modal previews with live controls
- per-curve formula notes and standalone HTML code snippets
- copy support for formula and code
- visual controls for hue, gradient range, saturation, lightness, and glow on every loader
- dependency-free source that can run from a static file or GitHub Pages

## Live demo

Open the latest public build here:

https://shtse8.github.io/math-curve-loaders/

The deployed demo is published from `main`, so merged improvements should become visible on the public URL quickly.

## Project direction

The goal is to make this the most impressive lightweight mathematical loader gallery on GitHub:

1. **More curves** — expand in small PRs until the gallery contains hundreds of polished formulas.
2. **More control** — make size, speed, trails, colors, gradients, glow, and formula parameters tunable.
3. **Better browsing** — keep adding categories, presets, and metadata so visitors can discover shapes easily.
4. **Better reuse** — keep standalone export code clean so designers and developers can copy a loader into their own work.
5. **Public-facing quality** — keep the README, live demo, and contribution path clear enough for stars and outside contributions.

## Files

- `index.html`: gallery entry
- `style.css`: layout, modal, filters, controls, and visual styles
- `main.js`: animation engine, curve definitions, category logic, visual controls, modal interactions, and standalone export generation
- `original.html`: standalone original loader demo
- `original.css`
- `original.js`

## Run locally

No build step is required.

```bash
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173/
```

You can also open `index.html` directly in a browser.

## Contributing curve ideas

Good additions should include:

- a clear mathematical formula or parametric equation
- English and Chinese descriptions
- sensible animation defaults
- controls for the most interesting parameters
- a category/tag that helps people discover it
- validation with `node --check main.js`

Small focused PRs are preferred: one feature, one curve batch, or one UI improvement at a time.

## Why

Mathematical parameterizations can become expressive UI loading states while staying lightweight and dependency-free. This project turns that idea into a public, browsable, reusable gallery.
