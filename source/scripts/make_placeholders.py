"""Generates tasteful placeholder photos + a soft music-box loop.
Replace public/assets/memories/*.jpg and public/audio/birthday.mp3 with your own."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy.io import wavfile
import subprocess, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTO_DIR = os.path.join(ROOT, 'public/assets/memories')
AUDIO_DIR = os.path.join(ROOT, 'public/audio')
os.makedirs(PHOTO_DIR, exist_ok=True); os.makedirs(AUDIO_DIR, exist_ok=True)

def hex2rgb(h): h=h.lstrip('#'); return np.array([int(h[i:i+2],16) for i in (0,2,4)],dtype=np.float32)

PALETTES = {
 'mom-01':    (1200,1500,'#f6c9a0','#c9707f','#3a1a2c'),
 'family-01': (1600,1200,'#f2d4b0','#b5677a','#2b1424'),
 'mom-02':    (1200,1500,'#f4b6a6','#8a3f5d','#2a1222'),
 'memory-01': (1600,1200,'#f7dca8','#d4869a','#3a1c2e'),
 'family-02': (1200,1200,'#efc7a4','#a55b74','#2d1526'),
 'mom-03':    (1200,1500,'#f8cfb4','#c97b8c','#341829'),
}
rng = np.random.default_rng(7)
for name,(w,h,c1,c2,c3) in PALETTES.items():
    a,b,c = hex2rgb(c1),hex2rgb(c2),hex2rgb(c3)
    yy,xx = np.mgrid[0:h,0:w].astype(np.float32)
    t = (yy/h*0.85 + (xx/w)*0.25)
    t = np.clip(t,0,1)[...,None]
    img = a*(1-t)**1.6 + b*(1-np.abs(t-0.5)*2)**1.2*0.9 + c*t**1.4*0.9
    img = np.clip(img/ img.max()*255,0,255)
    base = Image.fromarray(img.astype(np.uint8))
    # bokeh
    bok = Image.new('RGB',(w,h),(0,0,0)); d = ImageDraw.Draw(bok)
    for _ in range(26):
        r = int(rng.uniform(0.03,0.11)*min(w,h)); x=int(rng.uniform(0,w)); y=int(rng.uniform(0,h*0.75))
        col = tuple(int(v) for v in (a*0.8+np.array([40,30,10])).clip(0,255))
        d.ellipse((x-r,y-r,x+r,y+r),fill=col)
    bok = bok.filter(ImageFilter.GaussianBlur(int(min(w,h)*0.02)))
    base = Image.blend(base, Image.eval(bok, lambda v: v), 0.0)
    arr = np.asarray(base).astype(np.float32) + np.asarray(bok).astype(np.float32)*0.35
    # soft silhouette blob (head + shoulders) so the crop reads like a portrait placeholder
    sil = Image.new('L',(w,h),0); sd = ImageDraw.Draw(sil)
    cx = w*0.5; sd.ellipse((cx-w*0.13,h*0.30,cx+w*0.13,h*0.30+w*0.30),fill=255)
    sd.ellipse((cx-w*0.34,h*0.62,cx+w*0.34,h*1.25),fill=255)
    sil = sil.filter(ImageFilter.GaussianBlur(int(min(w,h)*0.025)))
    m = (np.asarray(sil).astype(np.float32)/255.0)[...,None]*0.55
    arr = arr*(1-m) + c*0.9*m
    # grain + vignette
    arr += rng.normal(0,5,(h,w,1)).astype(np.float32)
    vy = ((yy-h/2)/(h/2))**2; vx=((xx-w/2)/(w/2))**2
    arr *= (1 - 0.32*np.clip(vx+vy,0,1.4))[...,None]
    out = Image.fromarray(np.clip(arr,0,255).astype(np.uint8))
    dd = ImageDraw.Draw(out)
    try: f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', int(min(w,h)*0.028))
    except Exception: f = ImageFont.load_default()
    label = f'{name}.jpg  -  replace with your photo'
    tw = dd.textlength(label,font=f)
    dd.text(((w-tw)/2,h-int(min(w,h)*0.07)),label,fill=(255,240,225),font=f)
    out.save(os.path.join(PHOTO_DIR,f'{name}.jpg'),quality=80,optimize=True,progressive=True)
    print('photo',name,out.size)

# ── music box loop ──────────────────────────────────────────────────────────
sr = 44100
bpm = 66; beat = 60/bpm
# original progression: Am – F – C – G (two beats per chord, 8 notes each bar)
chords = [[57,60,64,69],[53,57,60,65],[48,52,55,60],[55,59,62,67]]
bars = 8   # 2 passes of the progression
total = bars*4*beat + 3.0
buf = np.zeros(int(total*sr)+sr,dtype=np.float32)
def midi(n): return 440.0*2**((n-69)/12)
def bell(freq,dur,vel):
    t = np.arange(int(dur*sr))/sr
    s = np.sin(2*np.pi*freq*t)*np.exp(-t*2.6) + 0.35*np.sin(2*np.pi*freq*2.005*t)*np.exp(-t*4.2) + 0.12*np.sin(2*np.pi*freq*3.99*t)*np.exp(-t*7.5)
    a = np.minimum(1,t/0.004)
    return (s*a*vel).astype(np.float32)
pat = [0,1,2,3,2,1,2,3]  # arpeggio order
melody = {0:[81,79,76,79],1:[77,76,72,76],2:[76,79,84,79],3:[79,78,74,78]}
for bar in range(bars):
    ch = chords[bar%4]
    for i,pi in enumerate(pat):
        t0 = (bar*4 + i*0.5)*beat
        n = bell(midi(ch[pi]+12),3.2,0.20)
        s = int(t0*sr); buf[s:s+len(n)] += n
    if bar>=4:
        for i,mn in enumerate(melody[bar%4]):
            t0 = (bar*4 + i*1.0 + 0.0)*beat
            n = bell(midi(mn),3.6,0.16); s=int(t0*sr); buf[s:s+len(n)] += n
    # soft pad bass
    b = bell(midi(ch[0]-12),4.5,0.22); s=int(bar*4*beat*sr); buf[s:s+len(b)] += b
# simple reverb: decaying noise impulse
ir_len = int(2.4*sr); ir = (np.random.default_rng(3).normal(0,1,ir_len)*np.exp(-np.arange(ir_len)/sr*2.2)).astype(np.float32)
from scipy.signal import fftconvolve
wet = fftconvolve(buf,ir)[:len(buf)]*0.05
mix = buf*0.85 + wet
# gentle loop crossfade: fade tail into head
fade = int(2.0*sr); loop_len = int((bars*4*beat)*sr)
mix = mix[:loop_len+fade]
mix[:fade] += mix[loop_len:loop_len+fade]*np.linspace(1,0,fade)*0 + 0
mix = mix[:loop_len]
mix /= np.max(np.abs(mix))/0.8
mix[:int(0.05*sr)] *= np.linspace(0,1,int(0.05*sr))
mix[-int(0.4*sr):] *= np.linspace(1,0,int(0.4*sr))
wavfile.write('/tmp/birthday.wav',sr,(mix*32767).astype(np.int16))
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','/tmp/birthday.wav','-codec:a','libmp3lame','-b:a','96k',os.path.join(AUDIO_DIR,'birthday.mp3')],check=True)
print('audio ok', len(mix)/sr,'s')
