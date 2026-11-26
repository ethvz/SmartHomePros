# 3D Home house pipeline

The 3D Home tour (`pitch/assets/tour/index.html`) draws the furniture, products, lights and interior with three.js.
The house shell (walls, gables, roofs, porch, garage, tower, fence, pad, drive, lawns) is a solid Blender model,
`mdl/house.glb`, stored inside `pitch/assets/tour/pack.jpg` together with two baked lightmaps:

- `bake/shell.webp` + `bake/shell.json` - lighting for the house shell (its own `LM` UV set).
- `bake/lm.webp` + `bake/lm.json` - lighting for the interior box meshes the page builds (packed into UV1 at runtime).

`pack.jpg` is a bundle: `[u32 n][json index {key:[offset,len,mime]}][data]`. `packset.py key file ...` replaces entries
(`key -` removes one). After changing the pack, bump `fetch('pack.jpg?v=N')` in the tour page and the tour iframe
`?v=` in `pitch/index.html`.

The house follows the owner's reference video: narrow street front, deep plan (garage x -9.9..-6.9, two-storey entry block
x -6.9..-2.3, great room x -2.3..5.3 / z -6.8..4 cut open at the FRONT under a vaulted cross gable, solid core with the shelf
niches, dark tower at the front right), truncated hip roof, no solar.

Runs with the Blender app (5.x): `B=/Applications/Blender.app/Contents/MacOS/Blender`, and `HOUSE_WORK=<scratch folder>`
(defaults to ./work). bexp.py drives headless Chrome over the DevTools protocol (no Playwright needed).

## Rebuild after changing the house

1. `$B -b -P shell.py` - builds the shell (`shell.blend`). `$B -b -P view.py` renders quick Workbench previews.
2. `$B -b -P lmuv.py` - adds the lightmap UVs and exports `house.glb`.
3. `python3 packset.py mdl/house.glb $HOUSE_WORK/house.glb`
4. Serve the repo (`python3 -m http.server 8766`) and run `python3 bexp.py` - exports the page's scene + lights
   (`?bakeexport`) to `bake/scene.glb` / `bake/lights.json`.
5. `$B -b -P bake_all.py -- --samples 64` - Cycles bake of both lightmaps (Metal GPU when present; ~30 min on an M1 Pro).
6. `$B -b -P post.py -- --in bake/lm_all.exr --out bake/lm_all.webp --sigma 1.4` and the same for `shell_all` (writes the .json).
7. `python3 packset.py bake/lm.webp lm_all.webp bake/lm.json lm_all.json bake/shell.webp shell_all.webp bake/shell.json shell_all.json`
8. Bump the `?v=` numbers (pack fetch in the tour page, tour iframe in `pitch/index.html`), then `python3 tools/art.py` and publish/commit.

Any change to interior boxes in the page (anything made with `slab()`) changes the UV1 packing, so re-run steps 4-7.

Car: "Tesla 2018 Model 3" by Ameer Studio, CC BY 4.0, modified (badges removed, grey paint, decimated) - see car_LICENSE.txt.
