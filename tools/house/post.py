import bpy, numpy as np, sys, json
from PIL import Image
src = sys.argv[sys.argv.index('--in')+1]; out = sys.argv[sys.argv.index('--out')+1]
im = bpy.data.images.load(src); W,H = im.size
a = np.array(im.pixels[:], dtype=np.float32).reshape(H,W,4)[::-1,:,:3]
cov = a.max(axis=2) > 1e-6
SIG = float(sys.argv[sys.argv.index('--sigma')+1]) if '--sigma' in sys.argv else 1.2
if SIG > 0:   # light denoise: blur inside covered texels only (normalised), so islands don't pick up the black gaps
    from scipy.ndimage import gaussian_filter
    m = cov.astype(np.float32); den = gaussian_filter(m, SIG) + 1e-6
    b = np.stack([gaussian_filter(a[:,:,c]*m, SIG)/den for c in range(3)], 2)
    a = np.where(cov[:,:,None], b, a)
k = float(np.percentile(a.max(axis=2)[cov], 99.7)) if cov.any() else 1
print('coverage', cov.mean(), 'k', k, 'median', float(np.median(a[cov])))
v = np.clip(a/k, 0, 1)
srgb = np.where(v <= .0031308, v*12.92, 1.055*np.power(v, 1/2.4) - .055)
Image.fromarray((srgb*255+.5).astype(np.uint8)).save(out, quality=92, method=6)
json.dump({'k':k}, open(out.replace('.webp','.json'),'w'))
