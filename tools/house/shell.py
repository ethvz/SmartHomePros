# The house shell, modelled as solid pieces (three.js coords: x right, y up, z toward the street).
# Run: blender -b -P shell.py   (HOUSE_WORK = output folder, default ./work)
# Layout follows the owner's reference video: narrow, deep house seen from the street; tall single garage with a shed roof
# on the left, a two-storey entry block under a lean-to porch roof, a double-height great room whose FRONT wall is cut away
# (vaulted front-to-back cross gable), a dark board-clad tower at the right front corner. Truncated hip roof, no solar.
import bpy, bmesh, math, os
from mathutils import Vector
W = os.environ.get('HOUSE_WORK', os.path.join(os.getcwd(), 'work')); os.makedirs(W, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
C = bpy.context; SC = C.scene
FL, EH = .15, 6.3
TOP = EH + FL            # 6.45 wall plate
YS = TOP + .05           # 6.5 boxed soffit / underside of the roof mass
FA = .25                 # fascia depth
OV = .55                 # eave overhang
K = 1.4 / 3.3            # main roof pitch (23 deg: 1.4 m rise over a 3.3 m run)
# plan
BX0, BX1, BZ0, BZ1 = -6.9, 5.5, -7.0, 4.0      # house body (entry block + great room + core)
EX1 = -2.3                                     # entry block x -6.9..-2.3 (two storeys, closed; its right face is the great room's left wall)
GX0, GX1 = -2.5, 2.6                           # cross gable (outer wall lines); vault inside x -2.3..2.4
GC = (GX0 + GX1) / 2; GH = (GX1 - GX0) / 2 + OV   # gable centre, half span incl. overhang
RISE = K * 3.3                                 # 1.4 m: run 3.3 m (half the 6.6 m front hip incl. overhang)
DECK = YS + FA + RISE                          # 8.15: hip deck and gable ridge
KG = RISE / GH                                 # gable pitch so its ridge meets the deck
IX0, IX1, IZ0 = -2.3, 5.3, -6.8                # great room inside
CORE = (2.9, 5.5, -7.0, -1.0)                  # solid core; its street-facing white wall holds the oak shelf niches
def U(x): return YS + KG * (GH - abs(x - GC))  # gable underside height at x

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
COL = {'stucco':(.76,.78,.8), 'paint':(.82,.79,.75), 'cut':(.9,.89,.87), 'roof':(.07,.075,.08), 'soffit':(.8,.8,.78),
       'fascia':(.03,.033,.035), 'trim':(.02,.022,.024), 'conc':(.78,.78,.76), 'grass':(.13,.2,.07), 'mulch':(.04,.03,.025),
       'gravel':(.45,.44,.41), 'batten':(.035,.037,.04), 'fence':(.035,.037,.04), 'ceil':(.85,.84,.82), 'garage':(.07,.075,.08),
       'glassLit':(.02,.02,.02), 'glassDark':(.01,.01,.01), 'plinth':(.25,.25,.25)}
for k, v in COL.items(): mat(k, v)
def new_obj(name, bm):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); SC.collection.objects.link(o); return o
def box_bm(bm, x0,x1,y0,y1,z0,z1):
    vs = [bm.verts.new(B(x,y,z)) for x in (x0,x1) for y in (y0,y1) for z in (z0,z1)]
    for f in [(0,1,3,2),(4,6,7,5),(0,4,5,1),(2,3,7,6),(0,2,6,4),(1,5,7,3)]: bm.faces.new([vs[i] for i in f])
def box(name, x0,x1,y0,y1,z0,z1, m):
    bm = bmesh.new(); box_bm(bm, min(x0,x1),max(x0,x1),min(y0,y1),max(y0,y1),min(z0,z1),max(z0,z1)); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = new_obj(name, bm); o.data.materials.append(MATS[m]); return o
def prism(name, pts, axis, a0, a1, m):
    """pts: 2D polygon across `axis`, extruded a0..a1 along it ('x' -> pts are (z,y); 'z' -> pts are (x,y))"""
    bm = bmesh.new()
    def P(u, v, a): return B(a, v, u) if axis == 'x' else B(u, v, a)
    f0 = [bm.verts.new(P(u, v, a0)) for u, v in pts]; f1 = [bm.verts.new(P(u, v, a1)) for u, v in pts]
    bm.faces.new(f0); bm.faces.new(list(reversed(f1)))
    n = len(pts)
    for i in range(n): j = (i+1) % n; bm.faces.new([f0[i], f0[j], f1[j], f1[i]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = new_obj(name, bm); o.data.materials.append(MATS[m]); return o
def hull(name, pts, m):
    bm = bmesh.new(); vs = [bm.verts.new(B(*p)) for p in pts]
    r = bmesh.ops.convex_hull(bm, input=vs)
    bmesh.ops.delete(bm, geom=[g for g in r['geom_interior'] + r['geom_unused'] if isinstance(g, bmesh.types.BMVert)], context='VERTS')
    bmesh.ops.dissolve_limit(bm, angle_limit=.001, verts=bm.verts, edges=bm.edges)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = new_obj(name, bm); o.data.materials.append(MATS[m]); return o
def boolean(o, cutters, op='DIFFERENCE'):
    for c in cutters:
        md = o.modifiers.new('b', 'BOOLEAN'); md.operation = op; md.object = c; md.solver = 'EXACT'
        C.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier=md.name)
        bpy.data.objects.remove(c)
    return o
def cutter(x0,x1,y0,y1,z0,z1): return box('cut', x0,x1,y0,y1,z0,z1, 'trim')

# ---------------- ground: concrete pad (a model on a table), driveway with a side apron for the car, walk, stoop, beds, lawns
PZ1 = 7.0
box('pad', -14.6,9.4, -.35,.03, -8.4,PZ1, 'conc')
box('drive', -14.2,-6.5, .03,.045, 4.0,8.7, 'conc')
box('stoop', -4.65,-3.1, .03,.13, 4.0,5.1, 'conc'); box('step', -4.65,-3.1, .03,.08, 5.1,5.45, 'conc')
box('walk', -4.5,-3.25, .03,.05, 5.45,PZ1, 'conc')
box('bed', -6.5,-4.65, .03,.06, 4.0,5.15, 'mulch')
box('lawnL', -6.5,-4.5, .03,.06, 5.15,PZ1, 'grass'); box('lawnF', -3.25,9.4, .03,.06, 4.12,PZ1, 'grass')
box('lawnS', 6.5,9.4, .03,.06, -8.4,4.12, 'grass')
box('lawnB', -14.2,6.5, .03,.06, -8.4,BZ0-.05, 'grass')                 # back garden
box('lawnW', -14.2,-10.1, .03,.06, BZ0-.05,4.0, 'grass')                # side garden by the garage
box('lawnG', -10.1,BX0, .03,.06, BZ0-.05,-2.6, 'grass')
box('plinth', BX0-.05,BX1+.05, .03,FL-.025, BZ0-.05,BZ1+.02, 'plinth')
box('gslab', -9.9,BX0, .03,.06, -2.6,4.0, 'plinth')

# ---------------- garage: tall single garage, shed roof falling to the driveway side (hollow: the door fades open in the app)
GXL, GXR, GZ0 = -9.9, BX0, -2.6
GA = math.atan((4.9 - 3.7) / (GXR - GXL))
def gy(x): return 3.7 + (x - GXL) * math.tan(GA)     # roof underside at x
gar = prism('garage', [(GXL,.04),(GXR,.04),(GXR,gy(GXR)),(GXL,gy(GXL))], 'z', GZ0, BZ1, 'stucco')
GDOOR = (-9.6, -7.2, 2.75)
boolean(gar, [prism('cut', [(GXL+.2,.06),(GXR-.02,.06),(GXR-.02,gy(GXR)-.22),(GXL+.2,gy(GXL+.2)-.22)], 'z', GZ0+.2, BZ1-.2, 'trim'),
              cutter(GDOOR[0],GDOOR[1],.0,GDOOR[2],3.7,4.1), cutter(GXL-.1,GXL+.3,1.2,2.2,-1.4,.2)])
t = .22; xa, xb = GXL-.42, GXR
tn = t / math.cos(GA)
prism('garage_roof', [(xa, gy(xa)), (xb, gy(xb)), (xb, gy(xb)+tn), (xa, gy(xa)+tn)], 'z', GZ0-.4, BZ1+.42, 'roof')
box('garage_fascia', xa-.03, xa, gy(xa)-.06, gy(xa)+tn+.02, GZ0-.4, BZ1+.42, 'fascia')

# ---------------- entry block: two storeys, solid (its rooms are never seen); windows are recessed glass
entry = box('entry', BX0, EX1, .03, YS, BZ0, BZ1, 'stucco')
DOOR = (-4.35, -3.4)
WF = [(-6.35,-5.1, 4.7,5.95), (-4.7,-3.45, 4.7,5.95)]            # upstairs front
WG = (-6.3,-5.05, FL+1.1, FL+2.3)                                 # ground floor front (mullioned; Door & Window Sensor)
WB = [(-6.3,-5.05, 4.7,5.95), (-4.4,-3.15, 4.7,5.95), (-6.1,-4.6, FL+1.1,FL+2.3)]   # back
WS = [(-5.6,-4.3, 4.7,5.95), (-5.6,-4.3, FL+1.1,FL+2.3)]         # left side (z ranges), behind the garage
cuts = [cutter(a,b,lo,hi,BZ1-.3,BZ1+.1) for a,b,lo,hi in WF + [WG]] + [cutter(DOOR[0],DOOR[1],FL-.01,FL+2.35,BZ1-.3,BZ1+.1)]
cuts += [cutter(a,b,lo,hi,BZ0-.1,BZ0+.3) for a,b,lo,hi in WB] + [cutter(BX0-.1,BX0+.3,lo,hi,a,b) for a,b,lo,hi in WS]
boolean(entry, cuts)

# ---------------- great room: back wall with the gable triangle (clerestories), right wall, solid core with shelf niches
CL = [(GC-.9+i*.6) for i in range(4)]                                 # four portrait clerestories on the back gable wall
CLY = (5.5, 6.18)
KWIN = (-1.0, .2, FL+1.12, FL+2.25)                                  # window over the sink
back = prism('gr_back', [(GX0,.03),(CORE[0]+.01,.03),(CORE[0]+.01,YS),(GX1,YS),(GX1,U(GX1)),(GC,U(GC)),(GX0,U(GX0))], 'z', BZ0, IZ0, 'stucco')
boolean(back, [cutter(KWIN[0],KWIN[1],KWIN[2],KWIN[3],BZ0-.1,IZ0+.1)] + [cutter(c-.2,c+.2,CLY[0],CLY[1],BZ0-.1,IZ0+.1) for c in CL])
right = box('gr_right', IX1, BX1, .03, YS, CORE[3], BZ1, 'stucco')
core = box('core', CORE[0], CORE[1], .03, YS, CORE[2], CORE[3], 'stucco')
NICHE = [(3.35, 5.15, FL+.75+.45*i, FL+1.05+.45*i) for i in range(4)]   # four wide oak-lined niches
WC = [(3.6,4.85, 4.7,5.95), (3.6,4.85, FL+1.1,FL+2.3)]
WCS = [(-5.6,-4.3, 4.7,5.95), (-5.6,-4.3, FL+1.1,FL+2.3)]       # core's right side
boolean(core, [cutter(a,b,lo,hi,CORE[3]-.32,CORE[3]+.1) for a,b,lo,hi in NICHE] + [cutter(a,b,lo,hi,BZ0-.1,BZ0+.3) for a,b,lo,hi in WC]
              + [cutter(BX1-.3,BX1+.1,lo,hi,a,b) for a,b,lo,hi in WCS])

# ---------------- roof: truncated hip over the whole body + a front-to-back cross gable over the great room, ridge at deck height
X0, X1, Z0, Z1 = BX0-OV, BX1+OV, BZ0-OV, BZ1+OV; R = 3.3
hip = hull('roof_hip', [(x,YS,z) for x in (X0,X1) for z in (Z0,Z1)] + [(x,YS+FA,z) for x in (X0,X1) for z in (Z0,Z1)] +
           [(x,DECK,z) for x in (X0+R,X1-R) for z in (Z0+R,Z1-R)], 'roof')
gx0, gx1 = GC-GH, GC+GH
gab = hull('roof_gable', [(x,YS,z) for x in (gx0,gx1) for z in (Z0,Z1)] + [(x,YS+FA,z) for x in (gx0,gx1) for z in (Z0,Z1)] +
           [(GC,DECK,z) for z in (Z0,Z1)], 'roof')
boolean(hip, [gab], 'UNION')
roof = hip; roof.name = 'roof'
vault = prism('cut', [(IX0,YS-.3),(GX1-.2,YS-.3),(GX1-.2,U(GX1-.2)),(GC,U(GC)),(IX0,U(IX0))], 'z', IZ0, Z1+.5, 'trim')
backcut = prism('cut', [(GX0,YS-.3),(GX1,YS-.3),(GX1,U(GX1)),(GC,U(GC)),(GX0,U(GX0))], 'z', Z0-.2, IZ0+.01, 'trim')   # the back wall supplies the gable triangle
boolean(roof, [vault, backcut])
# porch: dark lean-to roof across the entry block, on two slim brackets
PZ0, PZE, PY0 = BZ1, BZ1+1.5, 4.3
PX0 = BX0-.8                                   # the porch roof runs on past the entry block toward the garage
pk = .32; py1 = PY0 - (PZE-PZ0)*pk; pt = .16
prism('porch_roof', [(PZ0, PY0), (PZE, py1), (PZE, py1+pt), (PZ0, PY0+pt*1.1)], 'x', PX0, EX1+.2, 'roof')
box('porch_fascia', PX0, EX1+.2, py1-.04, py1+pt+.01, PZE, PZE+.03, 'fascia')
box('porch_gutter', PX0, EX1+.2, py1-.06, py1+.08, PZE+.03, PZE+.16, 'fascia')
box('porch_pipe', PX0+.06, PX0+.14, .05, py1, PZE+.04, PZE+.12, 'fascia')
for bx in (BX0+.3, EX1-.1):
    prism('brk', [(PZ0, PY0-.9), (PZ0, PY0-.05), (PZE-.25, py1+.08), (PZE-.35, py1-.02)], 'x', bx-.035, bx+.035, 'fascia')
# downpipes
for x, y1 in ((BX0+.08, gy(BX0)+.1), (EX1-.1, YS)):
    box('pipe', x-.04, x+.04, .05, y1, BZ1+.02, BZ1+.1, 'fascia')
# ---------------- dark board-clad tower at the right front corner, fence behind it
TW = (BX1, BX1+1.6, .4, 3.0)
box('tower', TW[0], TW[1], .03, YS, TW[2], TW[3], 'batten')
box('tower_cap', TW[0]-.02, TW[1]+.06, YS, YS+.12, TW[2]-.06, TW[3]+.06, 'fascia')
bm = bmesh.new(); x = BX1+.03
while x < 9.0: box_bm(bm, x, x+.13, .03, 1.85, -1.86, -1.8); x += .16
box_bm(bm, BX1, 9.05, 1.85, 1.9, -1.9, -1.76)
z = -8.0
while z < -1.9: box_bm(bm, 8.98, 9.04, .03, 1.85, z, z+.13); z += .16
box_bm(bm, 8.94, 9.08, 1.85, 1.9, -8.05, -1.76)
o = new_obj('fence', bm); o.data.materials.append(MATS['fence'])

# ---------------- windows: frame (+ mullions) + glass (glass is drawn live in the app, not baked)
def window(name, face, c, a, b, lo, hi, lit, mv=(), mh=(), depth=.12):
    """face 'z+'/'z-'/'x+'/'x-': outward normal; c: outer wall plane; a..b along the wall; lo..hi heights"""
    ax, s = face[0], (1 if face[1] == '+' else -1)
    def L(bm, u0, u1, v0, v1, w0, w1):
        wa, wb = c + s*w0, c + s*w1
        if ax == 'z': box_bm(bm, u0, u1, v0, v1, min(wa,wb), max(wa,wb))
        else: box_bm(bm, min(wa,wb), max(wa,wb), v0, v1, u0, u1)
    fw = .06; bm = bmesh.new()
    for u0,u1,v0,v1 in [(a,a+fw,lo,hi),(b-fw,b,lo,hi),(a,b,lo,lo+fw),(a,b,hi-fw,hi)]: L(bm, u0,u1,v0,v1, -depth, .03)
    L(bm, a-.05, b+.05, lo-.05, lo, -.02, .07)                       # sill
    for f in mv: m = a + (b-a)*f; L(bm, m-.022, m+.022, lo+fw, hi-fw, -depth+.01, -.01)
    for f in mh: m = lo + (hi-lo)*f; L(bm, a+fw, b-fw, m-.022, m+.022, -depth+.01, -.01)
    o = new_obj(name+'_frame', bm); o.data.materials.append(MATS['trim'])
    bm = bmesh.new(); L(bm, a+fw, b-fw, lo+fw, hi-fw, -depth+.005, -depth+.025)
    o = new_obj(name+'_glass', bm); o.data.materials.append(MATS['glassLit' if lit else 'glassDark'])
for i,(a,b,lo,hi) in enumerate(WF): window('wf%d'%i, 'z+', BZ1, a,b,lo,hi, False, mv=(.5,))
window('wg', 'z+', BZ1, *WG, False, mv=(.5,), mh=(.3,))
for i,(a,b,lo,hi) in enumerate(WB): window('wb%d'%i, 'z-', BZ0, a,b,lo,hi, i < 2, mv=(.5,))
for i,(a,b,lo,hi) in enumerate(WS): window('ws%d'%i, 'x-', BX0, a,b,lo,hi, False, mv=(.5,))
for i,(a,b,lo,hi) in enumerate(WC): window('wc%d'%i, 'z-', BZ0, a,b,lo,hi, True, mv=(.5,))
for i,(a,b,lo,hi) in enumerate(WCS): window('wcs%d'%i, 'x+', BX1, a,b,lo,hi, i == 1, mv=(.5,))
window('wk', 'z-', BZ0, *KWIN, True, mv=(.5,), depth=.2)
for i,c in enumerate(CL): window('cl%d'%i, 'z-', BZ0, c-.2, c+.2, CLY[0], CLY[1], False, depth=.2)
window('gw', 'x-', GXL, -1.4, .2, 1.2, 2.2, False, mv=(.5,), depth=.2)

# tidy: every face gets the right material (great room inside painted, cut faces white, roof underside / edges)
P, S, CUT, ROOF, SOF, FAS, CEIL = [MATS[k] for k in ('paint','stucco','cut','roof','soffit','fascia','ceil')]
def slot(o, m):
    i = o.data.materials.find(m.name)
    if i < 0: o.data.materials.append(m); i = len(o.data.materials)-1
    return i
def in_room(X, Y, Z, e=.06): return IX0-e < X < IX1+e and IZ0-e < Z < BZ1+e and Y > FL-.06 and not (X > CORE[0]-e and Z < CORE[3]+e)
for o in SC.objects:
    if o.type != 'MESH': continue
    me = o.data
    for f in me.polygons:
        c = o.matrix_world @ f.center; n = (o.matrix_world.to_3x3() @ f.normal).normalized()
        X, Y, Z = c.x, c.z, -c.y; nx, ny, nz = n.x, n.z, -n.y     # back to three coords
        base = me.materials[f.material_index].name
        if base == 'stucco':
            if o.name.startswith(('gr_','core','entry')):
                if nz > .9 and abs(Z - BZ1) < .02 and X > EX1 - .01: f.material_index = slot(o, CUT)        # wall ends on the cut
                elif in_room(X + nx*.05, Y, Z + nz*.05): f.material_index = slot(o, P)
            if o.name.startswith('garage') and GXL+.1 < X < GXR+.05 and GZ0+.1 < Z < BZ1-.1: f.material_index = slot(o, P)
        if base == 'roof' and o.name == 'roof':
            inside = in_room(X + nx*.05, Y, Z + nz*.05) and Z < BZ1 + .01 and Y < DECK - .3
            if ny < -.3: f.material_index = slot(o, CEIL if inside else SOF)
            elif abs(ny) <= .3: f.material_index = slot(o, P if inside else FAS)
        elif base == 'roof':
            if ny < -.3: f.material_index = slot(o, SOF)
            elif abs(ny) <= .3: f.material_index = slot(o, FAS)
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
for name in ('garage','entry','gr_back','gr_right','core','roof','garage_roof','porch_roof','tower','tower_cap','pad'):
    o = SC.objects[name]; md = o.modifiers.new('bv','BEVEL'); md.width = .012; md.segments = 2; md.limit_method = 'ANGLE'; md.angle_limit = math.radians(40)
    md.harden_normals = False; C.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier=md.name)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(W, 'shell.blend'))
print('objects', len([o for o in SC.objects if o.type=='MESH']), 'tris', sum(len(o.data.polygons) for o in SC.objects if o.type=='MESH'))
