import bpy
bpy.ops.wm.open_mainfile(filepath='/home/claude/work/shell/shell.blend')
C = bpy.context; SC = C.scene
objs = [o for o in SC.objects if o.type=='MESH' and not o.name.endswith('_glass')]
for o in objs:
    if 'LM' not in o.data.uv_layers: o.data.uv_layers.new(name='LM')
    o.data.uv_layers.active = o.data.uv_layers['LM']
bpy.ops.object.select_all(action='DESELECT')
for o in objs: o.select_set(True)
C.view_layer.objects.active = objs[0]
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=.004, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
bpy.ops.object.mode_set(mode='OBJECT')
for o in objs: o.data.uv_layers.active = o.data.uv_layers['UVMap']   # UVMap stays TEXCOORD_0
bpy.ops.wm.save_as_mainfile(filepath='/home/claude/work/shell/shell_lm.blend')
bpy.ops.export_scene.gltf(filepath='/home/claude/work/shell/house.glb', export_format='GLB', export_materials='EXPORT', export_cameras=False, export_lights=False, export_image_format='NONE', export_texcoords=True, export_normals=True, export_apply=True)
print('ok')
