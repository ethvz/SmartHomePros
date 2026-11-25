import bpy, sys, os, math, re
from mathutils import Vector, Matrix
SRC=sys.argv[1]; OUT=sys.argv[2]; LENGTH=float(sys.argv[3]) if len(sys.argv)>3 else 4.9
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)

def tris(me): return sum(len(p.vertices)-2 for p in me.polygons)

DELETE = [r'^chrome\.001_', r'^chrome_bonnet_ok_', r'^LCDs', r'^Carpet', r'^satin_red', r'^belt_', r'^chromeBELT',
  r'^texture_Leather', r'^aluminium2_', r'^aluminium_movsteer', r'^black\.00[125]_', r'^hitam\.00[25]_', r'^paint_black',
  r'^interiorlights', r'^mirror_inside_mirror', r'^texture_Buttons', r'^door_.._(Plastic|Putih|movsteer_1\.0\.0|dvorright|aluminium2|texture_Buttons|door_lf\.0)',
  r'^Putih', r'^movsteer_1\.0_(dvorright|movsteer_1\.0\.1)', r'^suspensi', r'^chassis', r'^door_.._ok_', r'^hub_.f_hub_rf\.1']
INTERIOR = [r'^Seat Leather', r'^Leather_white', r'^base_dvorright', r'^Plastic_Plastic', r'^whiteleather', r'^movsteer_1\.0_movsteer']
meshes=[o for o in bpy.data.objects if o.type=='MESH']
deleted=[]
for o in meshes:
    if any(re.search(p,o.name) for p in DELETE):
        deleted.append(o.name); bpy.data.objects.remove(o, do_unlink=True)
print('DELETED',len(deleted))
meshes=[o for o in bpy.data.objects if o.type=='MESH']

def cat(o):
    if any(re.search(p,o.name) for p in INTERIOR): return 'interior'
    if o.name.startswith('wheels'): return 'wheels'
    if o.data.materials and o.data.materials[0].name.startswith('primary'): return 'paint'
    return 'other'
BUDGET={'paint':31000,'wheels':8000,'interior':3500,'other':13500}
FLOOR=300
tot={k:0 for k in BUDGET}; small={k:0 for k in BUDGET}
for o in meshes:
    t=tris(o.data); c=cat(o); tot[c]+=t
    if t<=FLOOR: small[c]+=t
print('category tris',tot)
dg=bpy.context.evaluated_depsgraph_get()
for o in meshes:
    c=cat(o); t=tris(o.data)
    if t<=FLOOR: continue
    r=max(0.02,min(1.0,(BUDGET[c]-small[c])/max(1,tot[c]-small[c])))
    if r>=0.999: continue
    m=o.modifiers.new('dec','DECIMATE'); m.decimate_type='COLLAPSE'; m.ratio=r
dg=bpy.context.evaluated_depsgraph_get(); dg.update()
for o in meshes:
    if not o.modifiers: continue
    ev=o.evaluated_get(dg); nm=bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    old=o.data; o.modifiers.clear(); o.data=nm
    if old.users==0: bpy.data.meshes.remove(old)
# bake world transforms into mesh data, unparent
for o in meshes:
    mw=o.matrix_world.copy(); o.parent=None; o.data.transform(mw); o.matrix_world=Matrix.Identity(4)
for o in list(bpy.data.objects):
    if o.type!='MESH': bpy.data.objects.remove(o, do_unlink=True)
# shading: drop custom normals, smooth by angle
for me in {o.data for o in meshes}:
    try: me.normals_split_custom_set(None)
    except Exception: pass
    for a in [a for a in me.attributes if a.name in ('custom_normal',)]: me.attributes.remove(a)
    me.polygons.foreach_set('use_smooth',[True]*len(me.polygons))
    me.set_sharp_from_angle(angle=math.radians(35))
# ---------- materials ----------
def srgb2lin(c): c/=255; return c/12.92 if c<=0.04045 else ((c+0.055)/1.055)**2.4
GREY=[srgb2lin(v) for v in (0x6b,0x70,0x77)]+[1.0]
def bsdf(m): return next((n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None) if m.use_nodes else None
def unlink(m, sock):
    for l in list(sock.links): m.node_tree.links.remove(l)
for m in bpy.data.materials:
    b=bsdf(m)
    if not b: continue
    if m.name=='primary':
        b.inputs['Base Color'].default_value=GREY; b.inputs['Metallic'].default_value=0.6; b.inputs['Roughness'].default_value=0.32
        m.name='CarPaint_Grey'
    elif m.name.startswith('glass'):
        unlink(m,b.inputs['Base Color']); unlink(m,b.inputs['Alpha'])
        b.inputs['Base Color'].default_value=(0.012,0.014,0.017,1); b.inputs['Metallic'].default_value=0.0
        b.inputs['Roughness'].default_value=0.05; b.inputs['Alpha'].default_value=0.82
        b.inputs['Transmission Weight'].default_value=0.0
        try: m.surface_render_method='BLENDED'
        except Exception: pass
        m.name='Glass_Tinted'
    elif m.name in ('primary.004','indicator_lr'):  # odd green placeholder colours
        b.inputs['Base Color'].default_value=(0.02,0.02,0.02,1)
    b.inputs['Transmission Weight'].default_value=0.0
# merge identical materials
def key(m):
    b=bsdf(m)
    if not b: return ('x',m.name)
    tex=None
    for l in b.inputs['Base Color'].links:
        n=l.from_node
        if n.type=='TEX_IMAGE': tex=n.image.name if n.image else None
    em=b.inputs['Emission Strength'].default_value if 'Emission Strength' in b.inputs else 0
    emlinked=b.inputs['Emission Color'].is_linked
    return (tex, tuple(round(x,3) for x in b.inputs['Base Color'].default_value), round(b.inputs['Metallic'].default_value,2),
            round(b.inputs['Roughness'].default_value,2), round(b.inputs['Alpha'].default_value,2), m.blend_method if hasattr(m,'blend_method') else '', round(em,2), emlinked, b.inputs['Alpha'].is_linked)
canon={}
for o in meshes:
    for i,s in enumerate(o.material_slots):
        if not s.material: continue
        k=key(s.material); canon.setdefault(k,s.material); o.material_slots[i].material=canon[k]
# join
bpy.ops.object.select_all(action='DESELECT')
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active=meshes[0]
bpy.ops.object.join()
car=bpy.context.view_layer.objects.active; car.name='Sedan'; car.data.name='Sedan'
# remove unused slots
bpy.ops.object.material_slot_remove_unused()
# orient: nose currently +Y (Blender). rotate 180 about Z -> nose -Y Blender == +Z glTF
car.data.transform(Matrix.Rotation(math.pi,4,'Z'))
vs=[v.co for v in car.data.vertices]
mn=Vector([min(v[i] for v in vs) for i in range(3)]); mx=Vector([max(v[i] for v in vs) for i in range(3)])
s=LENGTH/(mx.y-mn.y)
c=Vector(((mn.x+mx.x)/2,(mn.y+mx.y)/2,mn.z))
car.data.transform(Matrix.Scale(s,4)@Matrix.Translation(-c))
car.data.update()
vs=[v.co for v in car.data.vertices]
mn=Vector([min(v[i] for v in vs) for i in range(3)]); mx=Vector([max(v[i] for v in vs) for i in range(3)])
print('FINAL bounds min',tuple(round(x,3) for x in mn),'max',tuple(round(x,3) for x in mx),'size',tuple(round(x,3) for x in mx-mn))
print('FINAL tris',tris(car.data),'materials',len(car.data.materials))
# textures: downscale >512 to 512 (all <=1024 already)
for im in bpy.data.images:
    if im.size[0]>512 or im.size[1]>512:
        im.scale(min(512,im.size[0]),min(512,im.size[1]))
for im in bpy.data.images:
    if im.users and im.size[0]: print('IMG',im.name,tuple(im.size))
# purge
bpy.ops.outliner.orphans_purge(do_recursive=True)
bpy.ops.wm.save_as_mainfile(filepath=OUT.replace('.glb','.blend'))
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_image_format='JPEG', export_jpeg_quality=85, export_yup=True,
    export_apply=True, export_texcoords=True, export_normals=True, export_materials='EXPORT', export_draco_mesh_compression_enable=False,
    export_cameras=False, export_lights=False, export_extras=False)
print('SIZE',os.path.getsize(OUT))
