import asyncio,json,base64
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader']); pg=await (await b.new_context(viewport={'width':800,'height':600})).new_page()
        pg.on('pageerror', lambda e: print('ERR',e))
        await pg.goto('http://localhost:8766/pitch/assets/tour/index.html?v=30&bakeexport'); 
        for i in range(120):
            await pg.wait_for_timeout(1000)
            if await pg.evaluate("!!window.__export"): break
        e=await pg.evaluate("(()=>{const e=window.__export; return e.error?{error:e.error}:{lights:e.lights,size:e.size,density:e.density,n:e.b64.length}})()")
        print(e if 'error' in e else {k:e[k] for k in ('size','density','n')}, len(e.get('lights',[])))
        b64=await pg.evaluate("window.__export.b64")
        open('bake/scene.glb','wb').write(base64.b64decode(b64)); json.dump(e,open('bake/lights.json','w'))
        await b.close()
asyncio.run(main())
