# EXR lightmap -> sRGB webp + {k} scale: blender -b -P post.py -- --in X.exr --out X.webp [--sigma 1.4]
# Runs in Blender (numpy; no scipy needed), writes a PNG, then the system python3 (Pillow) converts it to webp.
import bpy, numpy as np, sys, json, os, subprocess
src = sys.argv[sys.argv.index('--in')+1]; out = sys.argv[sys.argv.index('--out')+1]
im = bpy.data.images.load(src); W,H = im.size
a = np.array(im.pixels[:], dtype=np.float32).reshape(H,W,4)[:,:,:3]          # bottom row first (Blender order)
cov = a.max(axis=2) > 1e-6
SIG = float(sys.argv[sys.argv.index('--sigma')+1]) if '--sigma' in sys.argv else 1.2
def gblur(x, s):
    r = max(1, int(3*s)); k = np.exp(-.5*(np.arange(-r, r+1)/s)**2); k /= k.sum()
    for ax in (0, 1):
        p = np.pad(x, [(r, r) if i == ax else (0, 0) for i in range(x.ndim)], mode='edge'); acc = np.zeros_like(x)
        for i, w in enumerate(k): acc += w * np.take(p, range(i, i + x.shape[ax]), axis=ax)
        x = acc
    return x
if SIG > 0:   # light denoise: blur inside covered texels only (normalised), so islands don't pick up the black gaps
    m = cov.astype(np.float32); den = gblur(m, SIG) + 1e-6
    b = np.stack([gblur(a[:,:,c]*m, SIG)/den for c in range(3)], 2)
    a = np.where(cov[:,:,None], b, a)
k = float(np.percentile(a.max(axis=2)[cov], 99.7)) if cov.any() else 1
print('coverage', cov.mean(), 'k', k, 'median', float(np.median(a[cov])))
v = np.clip(a/k, 0, 1)
srgb = np.where(v <= .0031308, v*12.92, 1.055*np.power(v, 1/2.4) - .055)
o = bpy.data.images.new('o', W, H, alpha=False); o.colorspace_settings.name = 'Non-Color'
o.pixels[:] = np.concatenate([srgb, np.ones((H,W,1), np.float32)], 2).ravel()
png = out[:-5] + '.png'; o.filepath_raw = png; o.file_format = 'PNG'; o.save()
subprocess.run(['python3', '-c', 'import sys;from PIL import Image;Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2],quality=92,method=6)', png, out], check=True)
json.dump({'k':k}, open(out[:-5] + '.json','w'))
