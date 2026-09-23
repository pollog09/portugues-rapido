from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8", cpu_threads=16)
segs, info = m.transcribe("video/curso.mp4", vad_filter=True)
with open("transcripcion.txt", "w") as f:
    for s in segs:
        t = int(s.start)
        f.write(f"[{t//60:02d}:{t%60:02d}] {s.text.strip()}\n"); f.flush()
print("lang", info.language)
