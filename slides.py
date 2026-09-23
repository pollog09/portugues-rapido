import os, imagehash, shutil
from PIL import Image

os.makedirs("slides", exist_ok=True)
fs = sorted(os.listdir("frames")); prev = None; n = 0
for f in fs:
    im = Image.open(f"frames/{f}"); w, h = im.size
    crop = im.crop((0, 0, int(w * 0.62), h)).convert("L")  # ignore webcam bubble on the right
    hh = imagehash.dhash(crop, hash_size=16)
    if prev is None or hh - prev > 12:
        s = (int(f[2:7]) - 1) * 4
        shutil.copy(f"frames/{f}", f"slides/{s//60:02d}m{s%60:02d}s.jpg"); n += 1
    prev = hh
print(n)
