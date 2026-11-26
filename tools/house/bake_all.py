import bpy, json, math, sys, time, os
from mathutils import Vector
SAMPLES = int(sys.argv[sys.argv.index('--samples')+1]) if '--samples' in sys.argv else 16
W = os.environ.get('HOUSE_WORK', os.path.join(os.getcwd(), 'work'))
E = json.load(open(os.path.join(W, 'bake/lights.json'))); SIZE = E['size']
bpy.ops.wm.open_mainfile(filepath=os.path.join(W, 'shell_lm.blend'))
shell = [o for o in bpy.context.scene.objects if o.type=='MESH']
bpy.ops.import_scene.gltf(filepath=os.path.join(W, 'bake/scene.glb'))
sc = bpy.context.scene
for o in list(sc.objects):
    if o.type in ('LIGHT','CAMERA'): bpy.data.objects.remove(o)
def t2b(p): x,y,z = p; return Vector((x, -z, y))
for L in E['lights']:
    c = L['color']; I = L['intensity']; t = L['type']
    if t == 'HemisphereLight':
        w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
        bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (*[v*I/math.pi for v in c],1); bg.inputs[1].default_value = 1; continue
    if t == 'DirectionalLight':
        if I > 4 and abs(L['pos'][1]) < 1: continue                # a product's own light, not part of the house
        d = bpy.data.lights.new('sun','SUN'); d.energy = I; d.angle = math.radians(1.5)
    elif t == 'PointLight':
        d = bpy.data.lights.new('pt','POINT'); d.energy = 4*math.pi*I; d.shadow_soft_size = .08
    elif t == 'SpotLight':
        d = bpy.data.lights.new('sp','SPOT'); d.energy = 4*math.pi*I; d.spot_size = 2*L['angle']; d.spot_blend = L['penumbra']; d.shadow_soft_size = .06
    d.color = c; o = bpy.data.objects.new(d.name, d); sc.collection.objects.link(o); o.location = t2b(L['pos'])
    if 'target' in L:
        dirv = t2b(L['target']) - t2b(L['pos']); o.rotation_euler = dirv.to_track_quat('-Z','Y').to_euler()
sc.render.engine = 'CYCLES'; cy = sc.cycles; cy.device = 'CPU'
try:   # Metal GPU when available (minutes instead of tens of minutes)
    pr = bpy.context.preferences.addons['cycles'].preferences; pr.compute_device_type = 'METAL'; pr.get_devices()
    for d in pr.devices: d.use = True
    if any(d.type == 'METAL' for d in pr.devices): cy.device = 'GPU'
except Exception as e: print('gpu', e)
print('device', cy.device); cy.samples = SAMPLES; cy.use_denoising = False
cy.max_bounces = 4; cy.diffuse_bounces = 3; cy.glossy_bounces = 1; cy.transmission_bounces = 2
sc.render.bake.margin = 6; sc.render.bake.use_clear = True
lm = bpy.data.images.new('lm', SIZE, SIZE, float_buffer=True, alpha=False)
ls = bpy.data.images.new('ls', 2048, 2048, float_buffer=True, alpha=False)
targets = [o for o in sc.objects if o.type=='MESH' and o not in shell and len(o.data.uv_layers) >= 2 and o.name.startswith('bk_')]
stargets = [o for o in shell if 'LM' in o.data.uv_layers]
print('targets', len(targets), 'shell', len(stargets))
seen = {}
def hook(objs, img, uvname):
    for o in objs:
        if uvname: o.data.uv_layers.active = o.data.uv_layers[uvname]
        else: o.data.uv_layers.active_index = 1
        for s in o.material_slots:
            m = s.material
            if not m: continue
            if m.name in seen and seen[m.name] != img.name:      # shared between the two sets: give this object its own copy
                m = m.copy(); s.material = m
            seen[m.name] = img.name
            m.use_nodes = True; n = m.node_tree.nodes.new('ShaderNodeTexImage'); n.image = img; m.node_tree.nodes.active = n
hook(targets, lm, None); hook(stargets, ls, 'LM')
bpy.ops.object.select_all(action='DESELECT')
for o in targets + stargets: o.select_set(True)
bpy.context.view_layer.objects.active = targets[0]
t0 = time.time()
bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT','INDIRECT'}, use_clear=True, margin=6)
print('bake s', round(time.time()-t0))
lm.filepath_raw = os.path.join(W, 'bake/lm_all.exr'); lm.file_format = 'OPEN_EXR'; lm.save()
ls.filepath_raw = os.path.join(W, 'bake/shell_all.exr'); ls.file_format = 'OPEN_EXR'; ls.save()
