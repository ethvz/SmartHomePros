# quick Eevee/Workbench preview renders of the shell
import bpy, math, sys
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath='/home/claude/work/shell/shell.blend')
sc = bpy.context.scene; sc.render.engine = 'BLENDER_WORKBENCH'; sc.display.shading.light = 'STUDIO'; sc.display.shading.color_type = 'MATERIAL'
sc.display.shading.show_cavity = True; sc.render.resolution_x, sc.render.resolution_y = 1100, 760
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('c')); sc.collection.objects.link(cam); sc.camera = cam; cam.data.lens = 32
def B(x,y,z): return Vector((x,-z,y))
for i,(p,t) in enumerate([((28,10,22),(1,3,-1)), ((-20,12,24),(0,3,0)), ((22,7,-4),(4,4,-1)), ((3,22,30),(1,3,0))]):
    cam.location = B(*p); d = B(*t) - cam.location; cam.rotation_euler = d.to_track_quat('-Z','Y').to_euler()
    sc.render.filepath = f'/home/claude/work/shell/v{i}.png'; bpy.ops.render.render(write_still=True)
