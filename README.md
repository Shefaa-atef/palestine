# Fragments of Palestine

A single-viewport React / TypeScript / React Three Fiber storytelling experience.

## Run

```sh
npm install
npm run dev
npm run build
npm run preview
```

Development URL: http://127.0.0.1:5173. The development server uses polling to avoid Windows EBUSY errors when large texture files are added.

## GitHub Pages

The `main` branch deploys automatically through GitHub Actions. After enabling GitHub Pages with **GitHub Actions** as the source, the site is available at:

https://shefaa-atef.github.io/palestine/

## Rebuilt still-life assets

- Antique key: asymmetric cast bow, shaped ward, weathered shaft and collars.
- Olive: curved tapered branches, individually curved and veined lanceolate leaves, mottled olives, and fallen fruit.
- Watermelon: a spherical sector with two angled cut faces, curved striped rind, pith, and three-dimensional seeds. This is a volumetric mesh, not a plane or a stack of discs.
- Keffiyeh: a continuous sheet folded back over itself, with a generated woven black-and-ivory material. Fringe starts at the exact cloth-edge positions. Cords and knots are merged into two meshes to reduce draw calls.
- Map: the sourced historical Palestine silhouette, extruded and textured as limestone. Source and license: [asset credits](public/asset-credits.txt).

The scene uses real 3D geometry throughout. Texture maps are applied to the meshes; no static still-life image replaces the scene. Materials were generated with the built-in image-generation tool; [paths and prompts](public/textures/GENERATION.md).

Implementation: `src/components/Models.tsx`, `src/three/textures.ts`, `src/components/GroundDetails.tsx`. Composition, lighting, focus, and camera behavior: `src/components/Scene.tsx`. Narrative content: `src/data/artifacts.ts`.

## Optional GLB replacements

The model loader checks for valid binary glTF data at:

- `public/models/key.glb`
- `public/models/olive.glb`
- `public/models/watermelon.glb`
- `public/models/keffiyeh.glb`
- `public/models/palestine.glb`

Absent files leave the built-in meshes in place. Export bottom-center origins, +Y up and +Z toward the viewer. Approximate model heights: key 2.9, olive 3.7, watermelon 1.2, folded cloth 0.9, map 3.19; cloth width 2.25. Apply transforms before export. Keep texture sizes and mesh density reasonable; use static cloth.

## Sound

Add `public/audio/ambient.mp3` to enable the opt-in ambient sound control. Until then sound stays off. It never starts without interaction.

## Controls

Click the objects or numbered HTML buttons. Left/right arrows cycle and wrap; Escape returns to the collection. Story headings receive focus when changed. Long stories scroll inside their reading area. Reduced motion disables idle motion and parallax. Mobile adjusts the camera to retain the grouped composition.

## Checks

Production build and lint are checked. Browser verification covers desktop 1440×900, mobile 390×844, direct raycast selection, story navigation, and Escape. Latest captures are under `output/playwright/`.

Known tooling notices: Vite reports the size of the lazily loaded Three.js chunk. R3F/Three.js emits a Clock deprecation notice; the Windows shader compiler can also emit numeric-precision warnings. Neither blocked rendering in the browser checks. Google Fonts has local serif/sans-serif fallbacks.

## Isolated object / old-paper redesign

The presentation now uses a full-screen dark display and a warm upper-left spotlight with low fill and restrained dusty haze. The key has irregular worn edges and a separate oxidized-iron material with rust, pitting, scratches, and roughness/metalness maps.

Selecting an object fades and hides the other four, moves the chosen object into an enlarged inspection pose, and brings in a textured archival paper sheet. Pointer movement turns the object, and dragging adds rotation. Previous/next navigation replaces both the artifact and document; Close and Escape restore the full collection. Reduced-motion mode removes the entrance turn, idle motion, and paper movement.

`src/components/StoryPaper.tsx` owns the paper presentation. The reading area scrolls independently, with a cue until the end of the story is reached. The document is HTML, so its text stays selectable and keyboard-readable.

Paper asset and full generation prompt: [ARCHIVE-PAPER.md](public/textures/ARCHIVE-PAPER.md).

Validation: build and lint pass; browser scene inspection confirmed that each of the five selections leaves exactly one artifact visible. Mobile document scrolling, drag rotation, and reduced-motion settings were checked without browser errors. Previews: `output/playwright/archive-key.png`, `archive-mobile-map.png`, and `archive-hero.png`.
