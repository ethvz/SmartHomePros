# 3D Home house pipeline

The 3D Home tour (`pitch/assets/tour/index.html`) draws the furniture, products, lights and interior with three.js.
The house shell (walls, gables, roofs, porch, garage, tower, fence, pad, drive, lawns) is a solid Blender model,
`mdl/house.glb`, stored inside `pitch/assets/tour/pack.jpg` together with two baked lightmaps:

- `bake/shell.webp` + `bake/shell.json` - lighting for the house shell (its own `LM` UV set).
- `bake/lm.webp` + `bake/lm.json` - lighting for the interior box meshes the page builds (packed into UV1 at runtime).

`pack.jpg` is a bundle: `[u32 n][json index {key:[offset,len,mime]}][data]`. `packset.py key file ...` replaces entries
(`key -` removes one). After changing the pack, bump `fetch('pack.jpg?v=N')` in the tour page and the tour iframe
`?v=` in `pitch/index.html`.

Needs Blender as a Python module (`pip install bpy`, Python 3.13) and Playwright with Chromium.
The scripts were written for a cloud workspace: fix the absolute paths at the top of each (`/home/claude/work/...`) to
your local folders before running.

## Rebuild after changing the house

1. `python3 shell.py` - builds the shell (`shell.blend`). `view.py` renders quick Workbench previews.
2. `python3 lmuv.py` - adds the lightmap UVs and exports `house.glb`.
3. `python3 packset.py mdl/house.glb house.glb`
4. Serve the repo (`python3 -m http.server 8766`) and run `python3 bexp.py` - exports the page's scene + lights
   (`?bakeexport`) to `scene.glb` / `lights.json`.
5. `python3 bake_all.py --samples 16` - Cycles bake of both lightmaps (minutes on a laptop, ~6-15 min on 2 cores).
6. `post.py --in lm_all.exr --out lm_all.webp --sigma 1.4` and the same for `shell_all` (writes the matching .json).
7. `python3 packset.py bake/lm.webp lm_all.webp bake/lm.json lm_all.json bake/shell.webp shell_all.webp bake/shell.json shell_all.json`
8. Bump the `?v=` numbers, check with `tov3.py`, then `python3 tools/art.py` and publish/commit.

Any change to interior boxes in the page (anything made with `slab()`) changes the UV1 packing, so re-run steps 4-7.

Car: "Tesla 2018 Model 3" by Ameer Studio, CC BY 4.0, modified (badges removed, grey paint, decimated) - see car_LICENSE.txt.
