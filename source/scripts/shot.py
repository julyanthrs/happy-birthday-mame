"""Usage: python3 scripts/shot.py "units,comma,separated" [width] [height] [prefix]
Serves dist/ with vite preview, scrolls to each timeline unit and saves a screenshot."""
import sys, os, time, subprocess, re
from playwright.sync_api import sync_playwright

units = [float(u) for u in sys.argv[1].split(',')]
W = int(sys.argv[2]) if len(sys.argv) > 2 else 960
H = int(sys.argv[3]) if len(sys.argv) > 3 else 540
prefix = sys.argv[4] if len(sys.argv) > 4 else 'shot'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = '/tmp/shots'; os.makedirs(OUT, exist_ok=True)

srv = subprocess.Popen(['npx','vite','preview','--port','4173','--strictPort'], cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
time.sleep(2.5)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl'])
        ctx = b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=1, reduced_motion='reduce' if os.environ.get('REDUCED') else 'no-preference')
        page = ctx.new_page()
        logs = []
        page.on('console', lambda m: logs.append(f'[{m.type}] {m.text}') if m.type in ('error','warning') else None)
        page.on('pageerror', lambda e: logs.append(f'[pageerror] {e}'))
        page.goto('http://localhost:4173/', wait_until='load')
        page.wait_for_timeout(int(os.environ.get('BOOT', '5200')))
        SCALE_VH = 0.6   # BASE_UNIT_VH * scrollLength
        for u in units:
            y = u * SCALE_VH * H / 100.0
            page.evaluate(f'window.scrollTo(0, {y})')
            page.wait_for_timeout(int(os.environ.get('WAIT', '2600')))
            path = f'{OUT}/{prefix}_{int(u):05d}.png'
            page.screenshot(path=path)
            print('saved', path)
        for l in logs[:25]: print(l)
        b.close()
finally:
    srv.terminate()
