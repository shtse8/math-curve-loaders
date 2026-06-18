# Future-proof performance architecture

This project should become a public-facing mathematical motion gallery, not just a large list of animated SVG DOM nodes. The current implementation is valuable for fast iteration because it keeps every curve visible as a readable JavaScript formula, but it should not be treated as the final rendering architecture for hundreds or thousands of live loaders.

## Current state

- Curve formulas, controls, categories, modal previews, and standalone export generation live in `main.js`.
- Gallery cards currently render SVG paths plus particle circles.
- The live demo is paginated and uses viewport gating, so it no longer animates every loader at once.
- JavaScript still performs per-frame point sampling and DOM attribute updates for visible SVG particles.

That is acceptable for a browsable prototype and for preserving transparent formulas, but it is not the 2027 target architecture.

## Critical assessment

### What JavaScript should keep doing

JavaScript is still the right layer for:

- formula/config metadata
- category filtering, search, presets, and URL state
- control panels and export tools
- feature detection and renderer selection
- one-time path precomputation or worker orchestration

### What JavaScript should stop doing long term

JavaScript should not be the main hot-path renderer for hundreds of simultaneous loaders. Avoid:

- updating many SVG DOM attributes every animation frame
- keeping offscreen loaders alive
- rendering every gallery card as a live animation
- re-sampling expensive formulas in the main thread when values are unchanged

## 2027 target renderer strategy

Use a tiered renderer instead of one universal technique.

### Tier 1: Static gallery thumbnails

Default gallery cards should be cheap previews:

- precomputed SVG path thumbnails, or
- CSS-only/static poster states, or
- a short sprite/video-like preview generated ahead of time

Only the active modal, visible focused cards, or explicitly played items should animate.

### Tier 2: Declarative CSS/SVG for simple loaders

For simple closed paths, prefer declarative browser-native animation:

- SVG `stroke-dasharray` / `stroke-dashoffset`
- CSS `offset-path` where supported
- CSS variables for color/size/speed controls
- SMIL/CSS animations when they avoid JS frame loops

This keeps many effects GPU/compositor-friendly and reduces main-thread pressure.

### Tier 3: Canvas 2D renderer for many particles

For particle trails or many simultaneous dynamic points, use a shared Canvas renderer:

- one `<canvas>` per active preview area, or one shared canvas layer
- batch all particles into one draw call loop
- avoid one DOM node per particle
- precompute normalized path samples when controls are stable

Canvas is a strong near-term upgrade because it is widely supported and simple to deploy on GitHub Pages.

### Tier 4: WebGL/WebGPU renderer for flagship effects

For the most impressive public-facing effects, use GPU renderers:

- WebGL2 as the broadly compatible production baseline
- WebGPU as progressive enhancement when available
- instanced particles, signed-distance fields, glow, trails, and gradients on GPU
- CPU only updates uniforms/config, not every point every frame

A future renderer can choose WebGPU → WebGL2 → Canvas → SVG/CSS fallback.

### Tier 5: Workers and OffscreenCanvas

Move heavy formula sampling and particle simulation away from the main thread when supported:

- `Worker` for path sample generation
- `OffscreenCanvas` for Canvas rendering in supporting browsers
- main thread owns UI and accessibility only

## Implemented milestones

- Gallery cards preserve the original curve-following particle motion, but only for the currently visible/viewport cards under a small live-animation budget instead of animating every loader at once.
- Repeated path strings and particle color arrays are cached so motion parity is preserved while reducing per-frame work.
- The focused modal viewer now uses a renderer abstraction with a Canvas 2D backend and an SVG fallback.
- JavaScript still owns formulas, controls, export code, filtering, and renderer orchestration. The hot renderer is now replaceable.


## Motion-parity optimization rules

Optimization must not replace the original visual language with a weaker-looking substitute. When a card effect depends on particles following a mathematical curve, the optimized version should preserve that curve-following particle motion. Acceptable optimizations are:

- animate only visible, paginated, viewport-intersecting cards
- cap live card animations with a clear budget
- cache quantized SVG path strings for repeated pulse states
- cache per-loader particle colors instead of recomputing HSL strings every frame
- move a matching renderer to Canvas/WebGL/WebGPU when it preserves the same motion

CSS/SVG declarative animation is preferred only when it can match the intended motion closely; otherwise it should not replace the flagship effect.

## Near-term implementation plan

1. **Keep pagination and viewport gating** for the gallery.
2. **Add renderer abstraction**: `svgRenderer`, then `canvasRenderer` behind the same curve config contract.
3. **Precompute path samples** for each visible loader and only recompute when controls change.
4. **Animate fewer DOM nodes**: SVG path-only previews first; particles only in modal or selected cards.
5. **Add a performance budget** in code review: no PR should regress initial render or animate hidden cards.
6. **Add lightweight benchmarking**: count visible animated nodes, average frame time, and dropped-frame warning in dev mode.
7. **Progressively add WebGL/WebGPU** for hero-quality loaders rather than forcing every formula into the same DOM renderer.

## Design principle

The formula/config layer is the source of truth. Rendering should be replaceable.

A curve should be defined once, then rendered through multiple backends:

```text
curve config + controls
        ↓
normalized path samples / uniforms
        ↓
CSS/SVG | Canvas 2D | WebGL2 | WebGPU
```

This keeps the project educational, reusable, and future-proof while allowing the public demo to scale toward hundreds or thousands of loaders.

## Quality bar for future PRs

Every future expansion should answer:

- Does it preserve or improve initial page responsiveness?
- Does it avoid animating hidden/offscreen loaders?
- Can the effect degrade gracefully on older browsers?
- Is the formula still understandable and exportable?
- Does the renderer choice match the effect complexity?

If the answer is no, the PR should improve the renderer architecture before adding more loaders.
