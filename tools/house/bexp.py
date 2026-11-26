# Export the tour's static scene (?bakeexport) + its lights for the Cycles bake, through headless Chrome (DevTools protocol).
# Serve the repo first (python3 -m http.server 8766). Writes $HOUSE_WORK/bake/scene.glb and lights.json.
import base64, json, os, socket, struct, subprocess, time, urllib.request, random, shutil, tempfile
W = os.environ.get('HOUSE_WORK', os.path.join(os.getcwd(), 'work')); os.makedirs(os.path.join(W, 'bake'), exist_ok=True)
CHROME = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
class WS:
    def __init__(self, u):
        host, rest = u[len('ws://'):].split('/', 1); h, p = host.split(':')
        self.s = socket.create_connection((h, int(p))); self.s.settimeout(300); k = base64.b64encode(os.urandom(16)).decode()
        self.s.sendall((f'GET /{rest} HTTP/1.1\r\nHost: {host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {k}\r\nSec-WebSocket-Version: 13\r\n\r\n').encode())
        buf = b''
        while b'\r\n\r\n' not in buf: buf += self.s.recv(4096)
        self.buf = buf.split(b'\r\n\r\n', 1)[1]; self.id = 0
    def _recv(self, n):
        chunks = [self.buf]; have = len(self.buf)
        while have < n: c = self.s.recv(1 << 22); chunks.append(c); have += len(c)
        b = b''.join(chunks); self.buf = b[n:]; return b[:n]
    def send(self, method, params=None):
        self.id += 1; data = json.dumps({'id': self.id, 'method': method, 'params': params or {}}).encode()
        mask = os.urandom(4); hdr = bytes([0x81]); L = len(data)
        hdr += bytes([0x80 | L]) if L < 126 else (bytes([0x80 | 126]) + struct.pack('>H', L) if L < 65536 else bytes([0x80 | 127]) + struct.pack('>Q', L))
        self.s.sendall(hdr + mask + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))
        while True:
            m = self.read()
            if m.get('id') == self.id: return m
    def read(self):
        payload = []
        while True:
            b1, b2 = self._recv(2); L = b2 & 0x7f
            if L == 126: L = struct.unpack('>H', self._recv(2))[0]
            elif L == 127: L = struct.unpack('>Q', self._recv(8))[0]
            payload.append(self._recv(L))
            if b1 & 0x80: break
        return json.loads(b''.join(payload))
port = 9600 + random.randint(0, 300); prof = tempfile.mkdtemp(prefix='bexp-')
proc = subprocess.Popen([CHROME, '--headless=new', f'--remote-debugging-port={port}', f'--user-data-dir={prof}', '--no-first-run',
    '--no-default-browser-check', '--disable-extensions', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--window-size=800,600', 'about:blank'],
    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
    for _ in range(100):
        try: tabs = json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json')); break
        except Exception: time.sleep(.2)
    ws = WS([t for t in tabs if t['type'] == 'page'][0]['webSocketDebuggerUrl'])
    ws.send('Page.navigate', {'url': f'http://localhost:8766/pitch/assets/tour/index.html?bakeexport&t={time.time()}'})
    for _ in range(240):
        time.sleep(1)
        r = ws.send('Runtime.evaluate', {'expression': '!!window.__export', 'returnByValue': True})
        if r['result']['result'].get('value'): break
    e = ws.send('Runtime.evaluate', {'expression': '(()=>{const e=window.__export; return e.error?{error:e.error}:{lights:e.lights,size:e.size,density:e.density,n:e.b64.length}})()', 'returnByValue': True})['result']['result']['value']
    print({k: e[k] for k in e if k != 'lights'}, len(e.get('lights', [])))
    b64 = ws.send('Runtime.evaluate', {'expression': 'window.__export.b64', 'returnByValue': True})['result']['result']['value']
    open(os.path.join(W, 'bake/scene.glb'), 'wb').write(base64.b64decode(b64)); json.dump(e, open(os.path.join(W, 'bake/lights.json'), 'w'))
finally:
    proc.terminate(); proc.wait(); shutil.rmtree(prof, ignore_errors=True)
