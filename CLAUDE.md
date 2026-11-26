# SmartHomePros Connect

Vivint sales tools in one installable web app, served by GitHub Pages at https://ethvz.github.io/SmartHomePros/
Owner: Ethan (Vivint sales manager). Used mostly on iPads (landscape + portrait), also iPhone.

Design rules: simple, foolproof navigation with no training needed; premium feel with intuitive animations; few words,
use graphics. It must behave like an app, not a website: no text selection, image dragging, callouts or browser zoom
(the shared `appLock` block in every page). Vivint Sans font, Vivint green rgb(5,229,175), lime rgb(223,255,26).
Vivint no longer sells solar: never show solar panels or solar products.

## Layout

- `index.html` - Connect home: rep background photo, stories row (incentives / announcements), 4 app tiles
  (Fast Pitch, Fast Recruit, Pulse -> https://pulse.vivint.com, The Playbook = coming soon), then quick links,
  who-to-call contacts, season calendar, feedback. Settings (gear): Open on launch (last used / Connect home / an app,
  localStorage `shpc_launch`, last app in `shpc_last`) and Offline downloads (drives each app's own service worker).
- `pitch/` - Fast Pitch (sales presentation). This folder is Fast Pitch's source of truth: edit it in place.
  `pitch/assets/tour/` is the 3D Home (three.js); see `tools/house/README.md` for the house model and lighting bake.
- `recruit/` - Fast Recruit (recruiting presentation). GENERATED: do not hand-edit. Its source is the
  `connect-source` branch of https://github.com/ethvz/Fast-Recruit (`src/index.src.html`, rebuilt with
  `python3 src/rebuild_index.py`), then `python3 tools/build.py` copies it here and applies the Connect patches.
  It expects the Fast-Recruit checkout next to this repo (`../Fast-Recruit`) or set `FR_REPO`.
- `dock.js` - shared editor pill (Edit layout + Screens), draggable, shown to editors.
- `screens.html` - device-size simulator for the dock's Screens button (gitignored; artifact-only, so Screens
  404s on GitHub Pages - un-ignore it if wanted there).
- `sw.js` - offline cache for the Connect home only (bump `CACHE` when its FILES change). Each app has its own worker.
- `connect/` - Connect home assets.
- `tools/art.py` - builds the packed copy published as the private claude.ai artifact "SmartHomePros Connect"
  (https://claude.ai/artifact/Te4syByxZ1wBLsGHmGYf63; images are bundled into packs/*.json). The owner wants every change
  mirrored there: `tools/artifact-sync.sh` (a Stop hook in `.claude/settings.json`) blocks the end of a turn while the
  artifact is out of date. Then: `bash tools/artifact-sync.sh build` (builds `_artifact/`, lists changed files), publish
  those files with the Artifact tool (page `_artifact/index.html`, root `_artifact`), `bash tools/artifact-sync.sh mark`.
  Publish only changed files (the artifact keeps the rest and its stored layouts) and never pass `capabilities`.
- `tools/house/` - Blender + bake pipeline for the 3D Home house.

The old standalone sites (ethvz/Fast-Pitch, ethvz/Fast-Recruit Pages) now redirect here and retire their offline copies.

## Testing

`python3 -m http.server 8766` in the repo root, open http://localhost:8766/index.html?pick (`?pick` skips the
launch redirect). Check iPad landscape 1180x820, portrait 820x1180 and iPhone 390x844. The 3D Home exposes
`window.__tour` (camera, controls, scene, focus(k), overview(), MODELS) for scripted checks: `__tour.MODELS.k()` builds
one product on its own for close inspection.

## Open items (waiting on Ethan)

- Connect home: real links for the quick links (most show "link coming soon"), confirmed story copy (promo amounts,
  Fast Start tiers, drug-screen steps, Constructors Race), the 2027 season calendar, and a sharp photo of a rep
  actually knocking on a door for the background.
- 3D Home: outside walls are still plain white (the reference house mixes in dark cladding and more trim). Only the
  Smart Hub and the Outdoor Camera Pro mount come from CAD; the camera heads and the other products are modelled in
  `pitch/assets/tour/index.html` (MODELS) from the official renders and spec sheet in iCloud
  `Vivint/Vivint Products/` (Product Renders, Full Product Spec Sheets.pdf). Head CAD would still beat the model.
- Awards gator board PDF (24x36) was made from the Fast Pitch awards page; may need 0.125" bleed for the printer.
