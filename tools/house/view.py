# quick Workbench preview renders of the shell: blender -b -P view.py  (HOUSE_WORK = folder with shell.blend)
import bpy, math, os
from mathutils import Vector
W = os.environ.get('HOUSE_WORK', os.path.join(os.getcwd(), 'work'))
bpy.ops.wm.open_mainfile(filepath=os.path.join(W, 'shell.blend'))
sc = bpy.context.scene; sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'MATERIAL'
sc.display.shading.show_cavity = True; sc.render.resolution_x, sc.render.resolution_y = 960, 520
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('c')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.lens = 40
def B(x,y,z): return Vector((x,-z,y))
for i,(p,t) in enumerate([((-1,10,32),(-2,3,0)), ((-22,12,24),(-2,3,-2)), ((24,9,20),(0,3,-2)), ((10,12,-28),(-1,3,-2))]):
    cam.location = B(*p); d = B(*t) - cam.location; cam.rotation_euler = d.to_track_quat('-Z','Y').to_euler()
    sc.render.filepath = os.path.join(W, f'v{i}.png'); bpy.ops.render.render(write_still=True)
