# The house shell, modelled as solid pieces (three.js coords: x right, y up, z toward the street).
import bpy, bmesh, math
from mathutils import Vector
bpy.ops.wm.read_factory_settings(use_empty=True)
C = bpy.context; SC = C.scene
FL, EH = .15, 6.3
TOP = EH + FL            # 6.45 wall plate of both volumes
EAVE = TOP + .24         # roof underside meets the outer wall face here
def B(x, y, z): return Vector((x, -z, y))      # three -> blender
MATS = {}
def mat(name, col):
    m = MATS.get(name)
    if not m:
        m = bpy.data.materials.new(name); m.diffuse_color = (*col, 1); m.use_nodes = True
        m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*col, 1)
        m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .9
        MATS[name] = m
    return m
COL = {'stucco':(.74,.76,.79), 'paint':(.82,.79,.75), 'cut':(.9,.89,.87), 'roof':(.11,.115,.125), 'soffit':(.8,.8,.78),
       'fascia':(.03,.033,.035), 'trim':(.02,.022,.024), 'conc':(.86,.86,.85), 'grass':(.17,.24,.1), 'mulch':(.04,.03,.025),
       'gravel':(.45,.44,.41), 'batten':(.035,.037,.04), 'fence':(.035,.037,.04), 'ceil':(.85,.84,.82), 'garage':(.07,.075,.08),
       'glassLit':(.02,.02,.02), 'glassDark':(.01,.01,.01), 'plinth':(.25,.25,.25)}
for k, v in COL.items(): mat(k, v)
def new_obj(name, bm):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); SC.collection.objects.link(o); return o
def box_bm(bm, x0,x1,y0,y1,z0,z1):
    vs = [bm.verts.new(B(x,y,z)) for x in (x0,x1) for y in (y0,y1) for z in (z0,z1)]
    idx = [(0,1,3,2),(4,6,7,5),(0,4,5,1),(2,3,7,6),(0,2,6,4),(1,5,7,3)]
    for f in idx: bm.faces.new([vs[i] for i in f])
def box(name, x0,x1,y0,y1,z0,z1, m):
    bm = bmesh.new(); box_bm(bm, x0,x1,y0,y1,z0,z1); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = new_obj(name, bm); o.data.materials.append(MATS[m]); return o
def prism(name, pts, axis, a0, a1, m):
    """pts: 2D polygon (in the plane across `axis`), extruded from a0 to a1 along axis ('x' -> pts are (z,y); 'z' -> pts are (x,y))"""
    bm = bmesh.new()
    def P(u, v, a): return B(a, v, u) if axis == 'x' else B(u, v, a)
    f0 = [bm.verts.new(P(u, v, a0)) for u, v in pts]; f1 = [bm.verts.new(P(u, v, a1)) for u, v in pts]
    bm.faces.new(f0); bm.faces.new(list(reversed(f1)))
    n = len(pts)
    for i in range(n): j = (i+1) % n; bm.faces.new([f0[i], f0[j], f1[j], f1[i]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = new_obj(name, bm); o.data.materials.append(MATS[m]); return o
def boolean(o, cutters, op='DIFFERENCE'):
    for c in cutters:
        md = o.modifiers.new('b', 'BOOLEAN'); md.operation = op; md.object = c; md.solver = 'EXACT'
        C.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier=md.name)
        bpy.data.objects.remove(c)
    return o
def cutter(x0,x1,y0,y1,z0,z1): return box('cut', x0,x1,y0,y1,z0,z1, 'trim')

# ---------------- ground: white concrete pad (a model on a table), driveway, walk, stoop, beds, lawns
box('pad', -11.2,14.8, -.35,.03, -7.2,6.6, 'conc')
box('drive', -10.6,-4.9, -.35,.045, 6.6,11.2, 'conc'); box('drive2', -10.6,-4.9, .03,.045, 3.9,6.6, 'conc')
box('stoop', 7.15,9.05, .03,.13, 4.0,5.25, 'conc'); box('step', 7.15,9.05, .03,.075, 5.25,5.65, 'conc'); box('walk', 7.25,8.95, .03,.05, 5.65,6.6, 'conc')
box('bed', -4.9,1.4, .03,.055, 4.0,5.4, 'mulch')
box('lawnL', -4.9,7.15, .03,.06, 5.4,6.6, 'grass'); box('lawnR', 9.05,14.8, .03,.06, 5.4,6.6, 'grass'); box('lawnS', 12.1,14.8, .03,.06, -7.2,5.4, 'grass')
box('gravelF', 1.4,7.15, .03,.04, 4.0,4.75, 'gravel'); box('gravelF2', 9.05,12.1, .03,.04, 4.0,4.75, 'gravel'); box('gravelS', 11.0,12.1, .03,.04, -6.2,4.0, 'gravel')
box('lawnF2', 1.4,7.15, .03,.06, 4.75,5.4, 'grass'); box('lawnF3', 9.05,12.1, .03,.06, 4.75,5.4, 'grass')
box('plinth', -5.3,9.8, .03,FL-.025, -6.1,4.1, 'plinth')
box('gslab', -10.3,-5.3, .03,.06, -6.1,4.1, 'plinth')

# ---------------- garage (hollow: the garage door fades open when a garage product is shown)
GA = .11                                   # shed roof slope, down toward the driveway side (x = -10.2)
def gy(x): return 3.09 + (x + 10.2)*math.tan(GA)       # roof underside at x (outer wall line)
gar = prism('garage', [(-10.2,.04),(-5.2,.04),(-5.2,gy(-5.2)),(-10.2,gy(-10.2))], 'z', -6.0, 4.0, 'stucco')
boolean(gar, [cutter(-10.0,-5.2,.06,4.5,-5.8,3.8), cutter(-9.55,-5.85,.0,2.49,3.7,4.1), cutter(-10.3,-9.9,1.14,2.24,-3.0,-1.2)])
# shed roof: 0.2 thick, overhangs 0.4 at the low side and front/back; butts into the main volume's wall
t = .2; xa, xb = -10.6, -5.2
prism('garage_roof', [(xa, gy(xa)), (xb, gy(xb)), (xb, gy(xb)+t/math.cos(GA)), (xa, gy(xa)+t/math.cos(GA))], 'z', -6.4, 4.4, 'roof')

# ---------------- two-storey volume: solid (its interior is never seen); windows are recessed glass
ROOF_RUN = 5.0                              # wall face (z = 4 / -6) to ridge (z = -1)
RL, RG = 1.25, 3.0                          # rise of the main roof and the great-room roof
main = prism('main', [(-6.0, FL), (4.0, FL), (4.0, EAVE), (-1.0, EAVE+RL), (-6.0, EAVE)], 'x', -5.2, 1.4, 'stucco')
WIN_MAIN = [(-4.35,-2.65,FL+.85,FL+2.55), (-1.75,-0.35,FL+.85,FL+2.55), (-4.25,-2.75,FL+3.95,FL+5.45), (-2.05,-0.55,FL+3.95,FL+5.45)]
WIN_BACK = [(-4.2,-2.8,FL+3.95,FL+5.25), (-1.9,-0.5,FL+3.95,FL+5.25), (-4.2,-2.8,FL+.95,FL+2.35), (-1.6,-0.2,FL+.95,FL+2.35)]
boolean(main, [cutter(a,b,lo,hi,3.88,4.2) for a,b,lo,hi in WIN_MAIN] + [cutter(a,b,lo,hi,-6.2,-5.88) for a,b,lo,hi in WIN_BACK] + [cutter(-5.4,-5.08,FL+3.95,FL+5.3,-3.6,-1.6)])
# ---------------- great room: hollow, open on the right side (x = 9.9); vaulted to the ridge
GRX0, GRX1 = 1.5, 9.9
gr = prism('great', [(-6.0, FL), (4.0, FL), (4.0, EAVE), (-1.0, EAVE+RG), (-6.0, EAVE)], 'x', GRX0-.1, GRX1, 'stucco')
inner = prism('gr_in', [(-5.8, FL-.05), (3.8, FL-.05), (3.8, EAVE+.12), (-1.0, EAVE+RG+.12-.0), (-5.8, EAVE+.12)], 'x', GRX0+.1, GRX1+1, 'trim')
# the inside follows the roof underside exactly: shift its profile so walls are 0.2 thick and the vault sits under the roof
boolean(gr, [inner])
DOOR, SASH = (7.6, 8.6), (2.9, 4.8)
WIN_GR = [(3.0,4.5,FL+3.95,FL+5.45), (6.0,7.5,FL+3.95,FL+5.45)]
boolean(gr, [cutter(DOOR[0],DOOR[1],FL-.01,FL+2.35,3.7,4.1), cutter(SASH[0],SASH[1],FL+.85,FL+2.45,3.7,4.1)] + [cutter(a,b,lo,hi,3.7,4.1) for a,b,lo,hi in WIN_GR])
CLR = [(-1.9,), (-1.3,), (-.7,), (-.1,)]
boolean(gr, [cutter(1.3,1.7,EAVE+RL+.3,EAVE+RL+.68,z-.19,z+.19) for (z,) in CLR])

for zc, zz in ((4.0, (3.98, 4.08)), (-6.0, (-6.08, -5.98))):
    box('cb%.0f'%zc, 1.32, 1.48, FL, EAVE, zz[0], zz[1], 'fascia')
box('cbg', -5.28, -5.12, .04, 3.1, 3.98, 4.08, 'fascia')
# ---------------- roofs: one thick slab per slope, eaves overhang 0.6 front/back, gable overhang 0.4
def gable_roof(name, x0, x1, rise, inner_m):
    k = rise / ROOF_RUN; t = .22; tn = t*math.sqrt(1+k*k)
    def u(z): return EAVE + k*(z + 6.0) if z <= -1 else EAVE + k*(4.0 - z)     # underside at the outer wall plane
    zo0, zo1 = -6.6, 4.6
    pts = [(zo0, u(zo0)), (-1.0, u(-1.0)), (zo1, u(zo1)), (zo1, u(zo1)+tn), (-1.0, u(-1.0)+tn), (zo0, u(zo0)+tn)]
    return prism(name, pts, 'x', x0, x1, 'roof')
gable_roof('main_roof', -5.6, 1.4, RL, 'soffit')
gable_roof('gr_roof', 1.4, 10.3, RG, 'ceil')
# porch roof across the front, sloping out over the entry
PA = .24; pz0, pz1 = 4.0, 5.72; py0 = 3.42 + .87*math.sin(PA)
prism('porch_roof', [(pz0, py0), (pz1, py0 - (pz1-pz0)*math.tan(PA)), (pz1, py0 - (pz1-pz0)*math.tan(PA) + .16), (pz0, py0+.16)], 'x', -5.2, 1.4, 'roof')
for px in (-5.05, 1.2): box('post%.0f'%px, px-.08, px+.08, .03, py0 - (pz1-pz0)*math.tan(PA) - .02, 5.45, 5.61, 'fascia')
cy = FL+2.75; prism('door_canopy', [(4.0, cy+.1), (5.1, cy-.05), (5.1, cy+.06), (4.0, cy+.22)], 'x', 7.25, 8.95, 'roof')
for bx in (7.35, 8.85): box('brk%.0f'%(bx*10), bx-.03, bx+.03, cy-.35, cy+.05, 4.0, 4.6, 'fascia')
# ---------------- dark tower at the back right, fence
box('tower', 10.0,11.0, .03,7.2, -6.2,-4.6, 'batten'); box('tower_cap', 9.95,11.1, 7.2,7.35, -6.3,-4.5, 'fascia')
bm = bmesh.new(); z = -6.9
while z < -2.2: box_bm(bm, 12.25,12.31,.03,1.85,z,z+.13); z += .16
box_bm(bm, 12.2,12.36,1.85,1.9,-6.95,-2.1); o = new_obj('fence', bm); o.data.materials.append(MATS['fence'])

# ---------------- windows: frame + glass (glass is drawn live in the app, not baked)
def window(a,b,lo,hi,zc,depth,lit,name):
    fw = .06; bm = bmesh.new()
    for x0,x1,y0,y1 in [(a,a+fw,lo,hi),(b-fw,b,lo,hi),(a,b,lo,lo+fw),(a,b,hi-fw,hi),(a-.04,b+.04,lo-.05,lo)]:
        box_bm(bm, x0,x1,y0,y1, zc-depth, zc+.04)
    o = new_obj(name+'_frame', bm); o.data.materials.append(MATS['trim'])
    g = box(name+'_glass', a+fw,b-fw,lo+fw,hi-fw, zc-depth+.01, zc-depth+.03, 'glassLit' if lit else 'glassDark')
for i,(a,b,lo,hi) in enumerate(WIN_MAIN): window(a,b,lo,hi,4.0,.12,True,'wm%d'%i)
for i,(a,b,lo,hi) in enumerate(WIN_GR): window(a,b,lo,hi,4.0,.2,True,'wg%d'%i)
# side window of the main volume and clerestory glass
box('ws_glass', -5.12,-5.1, FL+3.95,FL+5.3, -3.6,-1.6, 'glassLit')
bm = bmesh.new()
for y0,y1,z0,z1 in [(FL+3.95,FL+5.3,-3.6,-3.54),(FL+3.95,FL+5.3,-1.66,-1.6),(FL+3.95,FL+4.01,-3.6,-1.6),(FL+5.24,FL+5.3,-3.6,-1.6),(FL+3.9,FL+3.95,-3.64,-1.56)]: box_bm(bm,-5.26,-5.1,y0,y1,z0,z1)
o = new_obj('ws_frame', bm); o.data.materials.append(MATS['trim'])
def bwin(a,b,lo,hi,i):
    fw=.06; bm=bmesh.new()
    for x0,x1,y0,y1 in [(a,a+fw,lo,hi),(b-fw,b,lo,hi),(a,b,lo,lo+fw),(a,b,hi-fw,hi),(a-.04,b+.04,lo-.05,lo)]: box_bm(bm,x0,x1,y0,y1,-6.04,-5.88)
    o=new_obj('wb%d_frame'%i,bm); o.data.materials.append(MATS['trim'])
    box('wb%d_glass'%i, a+fw,b-fw,lo+fw,hi-fw,-5.92,-5.9,'glassLit')
for i,w in enumerate(WIN_BACK): bwin(*w,i)
for i,(z,) in enumerate(CLR):
    box('cl%d_glass'%i, 1.48,1.52, EAVE+RL+.3,EAVE+RL+.68, z-.19,z+.19, 'glassDark')
# garage side window
box('gw_glass', -10.12,-10.08, 1.14,2.24, -3.0,-1.2, 'glassDark')

# tidy: every face gets the right material (inside of the great room painted, cut faces white, roof underside/edges)
P, S, CUT, ROOF, SOF, FAS, CEIL = [MATS[k] for k in ('paint','stucco','cut','roof','soffit','fascia','ceil')]
def slot(o, m):
    i = o.data.materials.find(m.name)
    if i < 0: o.data.materials.append(m); i = len(o.data.materials)-1
    return i
for o in SC.objects:
    if o.type != 'MESH': continue
    me = o.data
    for f in me.polygons:
        c = o.matrix_world @ f.center; n = (o.matrix_world.to_3x3() @ f.normal).normalized()
        X, Y, Z = c.x, c.z, -c.y; nx, ny, nz = n.x, n.z, -n.y     # back to three coords
        base = me.materials[f.material_index].name
        if base == 'stucco':
            inside = 1.55 < X < 9.95 and -5.85 < Z < 3.85 and Y > FL-.06
            if o.name.startswith('great') and inside: f.material_index = slot(o, P)
            if o.name.startswith('great') and nx > .9 and X > 9.85: f.material_index = slot(o, CUT)
            if o.name.startswith('garage') and -10.05 < X < -5.15 and -5.85 < Z < 3.85: f.material_index = slot(o, P)
        if base == 'roof':
            if ny < -.3: f.material_index = slot(o, CEIL if o.name == 'gr_roof' else SOF)
            elif abs(ny) <= .3: f.material_index = slot(o, CUT if (o.name == 'gr_roof' and nx > .9) else FAS)
# UV0: planar world metres (like the app's worldUV) for tiling textures
for o in SC.objects:
    if o.type != 'MESH': continue
    me = o.data; uv = me.uv_layers.new(name='UVMap')
    for f in me.polygons:
        n = f.normal; ax = max(range(3), key=lambda i: abs(n[i]))
        for li in f.loop_indices:
            v = o.matrix_world @ me.vertices[me.loops[li].vertex_index].co; X, Y, Z = v.x, v.z, -v.y
            if ax == 2: uv.data[li].uv = (X, -Z)
            elif ax == 0: uv.data[li].uv = (-Z if n[0] > 0 else Z, Y)
            else: uv.data[li].uv = (X if -n[1] > 0 else -X, Y)
# bevel the building's corners a touch so edges catch light like built walls
for name in ('garage','main','great','main_roof','gr_roof','garage_roof','porch_roof','tower','tower_cap','pad'):
    o = SC.objects[name]; md = o.modifiers.new('bv','BEVEL'); md.width = .012; md.segments = 2; md.limit_method = 'ANGLE'; md.angle_limit = math.radians(40)
    md.harden_normals = False; C.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier=md.name)
bpy.ops.wm.save_as_mainfile(filepath='/home/claude/work/shell/shell.blend')
print('objects', len([o for o in SC.objects if o.type=='MESH']), 'tris', sum(len(o.data.polygons) for o in SC.objects if o.type=='MESH'))
