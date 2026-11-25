import struct, json, sys
P='/home/claude/shpc/pitch/assets/tour/pack.jpg'
args=sys.argv[1:]; items=dict(zip(args[::2], args[1::2]))   # key path ...
b=open(P,'rb').read(); n=struct.unpack('<I',b[:4])[0]; idx=json.loads(b[4:4+n]); data=b[4+n:]
blobs={k:data[o:o+l] for k,(o,l,t) in idx.items()}; types={k:t for k,(o,l,t) in idx.items()}
for k,f in items.items():
    if f=='-': blobs.pop(k,None); continue
    blobs[k]=open(f,'rb').read(); types.setdefault(k, 'model/gltf-binary' if k.endswith('.glb') else 'image/webp' if k.endswith('.webp') else 'application/json')
out=bytearray(); new={}
for k,v in blobs.items():
    while len(out)%4: out.append(0)
    new[k]=[len(out),len(v),types[k]]; out+=v
h=json.dumps(new,separators=(',',':')).encode()
open(P,'wb').write(struct.pack('<I',len(h))+h+bytes(out)); print('pack', len(out))
