import asyncio,sys
from playwright.async_api import async_playwright
q=sys.argv[1]; tag=sys.argv[2] if len(sys.argv)>2 else 'h'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(args=['--use-gl=swiftshader','--enable-unsafe-swiftshader']); pg=await (await b.new_context(viewport={'width':1180,'height':820})).new_page()
        pg.on('pageerror', lambda e: print('ERR',e)); pg.on('console', lambda m: m.type=='error' and print('CON',m.text[:200]))
        await pg.goto('http://localhost:8766/pitch/assets/tour/index.html?'+q); await pg.wait_for_timeout(15000)
        await pg.screenshot(path=f'cx/{tag}1.png')
        await pg.evaluate("""(()=>{const t=__tour,c=t.camera,o=t.controls; c.position.set(24,8,10); o.target.set(4,3,-1); c.lookAt(o.target); o.update();})()"""); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=f'cx/{tag}2.png')
        await pg.evaluate("""(()=>{const t=__tour,c=t.camera,o=t.controls; c.position.set(5.5,4,14); o.target.set(5.5,4,-3); c.lookAt(o.target); o.update();})()"""); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=f'cx/{tag}3.png')
        await b.close()
asyncio.run(main())
