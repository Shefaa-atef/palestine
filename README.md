# Fragments of Palestine

An interactive 3D storytelling experience built around five symbolic objects: a key, an olive branch, a watermelon, a keffiyeh, and a map of Palestine. Select an object to inspect it and read its story on an archival paper panel.

[Explore the experience](https://shefaa-atef.github.io/palestine/)

## Features

- A real-time 3D still life with procedural geometry and textured materials.
- English and Arabic stories, with RTL layout and a saved language preference.
- Object selection, inspection, pointer movement, and drag rotation.
- Keyboard navigation and selectable HTML story text.
- Reduced-motion support and a camera layout that adapts to mobile screens.
- Optional, user-initiated ambient audio.

## Built with

React 19, TypeScript, Vite 8, Three.js, React Three Fiber, Drei, postprocessing, and GSAP.

## Run locally

Use Node.js 22.12 or later in the 22.x series and npm, matching the deployment workflow's Node major version.

```sh
git clone https://github.com/Shefaa-atef/palestine.git
cd palestine
npm ci
npm run dev
```

Open the URL printed by Vite, typically `http://127.0.0.1:5173/palestine/`. The development server uses polling to accommodate large texture-file updates on Windows.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite. |
| `npm run build` | Run the TypeScript build and create `dist/`. |
| `npm run preview` | Preview the production build. |
| `npm run lint` | Run Oxlint. |

## Controls

- Select an object in the scene or use its navigation button.
- Move the pointer or drag to turn the selected object.
- Use the left/right arrow keys to cycle through the collection.
- Use Close or Escape to return to all five objects.
- Scroll inside the paper panel to read longer stories.
- Switch between English and Arabic in the header.

Reduced-motion preferences disable idle motion and parallax. Story text remains selectable and keyboard-readable.

## Source guide

| Path | Purpose |
| --- | --- |
| `src/App.tsx` | Selection, language, keyboard controls, and optional audio. |
| `src/components/Scene.tsx` | Composition, lighting, focus, and camera behavior. |
| `src/components/Models.tsx` | Procedural objects and optional model loading. |
| `src/components/StoryPaper.tsx` | Archival paper and reading panel. |
| `src/components/GroundDetails.tsx` | Ground details. |
| `src/three/textures.ts` | Material and texture helpers. |
| `src/data/artifacts.ts` | Bilingual artifact stories. |

## Assets and credits

The built-in scene uses three-dimensional geometry: a weathered key, curved olive branches, a volumetric watermelon segment, folded woven cloth, and an extruded historical Palestine silhouette.

- [Asset sources and credits](public/asset-credits.txt)
- [Texture-generation paths and prompts](public/textures/GENERATION.md)
- [Archival paper asset and prompt](public/textures/ARCHIVE-PAPER.md)

### Optional GLB models

To replace the procedural objects, place valid binary glTF files at:

```text
public/models/key.glb
public/models/olive.glb
public/models/watermelon.glb
public/models/keffiyeh.glb
public/models/palestine.glb
```

Missing files leave the built-in meshes in place. Export with bottom-center origins, +Y up, and +Z toward the viewer. Approximate model heights are key 2.9, olive 3.7, watermelon 1.2, folded cloth 0.9, and map 3.19; cloth width is 2.25. Apply transforms before export and use static cloth.

### Optional audio

Add `public/audio/ambient.mp3` to enable the sound control. Playback starts only after user interaction. The experience works without this file.

## Deployment and checks

Pushes to `main` run `.github/workflows/deploy-pages.yml`. Configure GitHub Pages to use **GitHub Actions**. Vite's base path is `/palestine/`; update it when hosting elsewhere.

Before publishing, run build and lint, then check all five selections, keyboard navigation, Arabic layout, mobile story scrolling, drag rotation, and reduced-motion behavior. Existing browser captures are stored in `output/playwright/`; they are historical artifacts rather than evidence that the current revision has been retested.
