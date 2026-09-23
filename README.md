# Portugués rápido 🇧🇷

Material de estudio para hispanohablantes que quieren hablar portugués de Brasil lo antes posible.

- **[guia-portugues.md](guia-portugues.md)**: resumen por temas del curso gratuito [*Habla Português en 60 Minutos*](https://youtu.be/zb5YFaoXpKw) de Sonia Rodríguez Mella, con pronunciación, falsos amigos, gramática mínima, verbos clave, frases comodín y un plan de 30 días.
- **[anki.csv](anki.csv)**: tarjetas español → portugués (separadas por tabulaciones) para importar en Anki.

## Regenerar el material local

El video y sus frames no se incluyen: pertenecen a su autora.

```bash
python3 -m venv .venv && .venv/bin/pip install yt-dlp imagehash faster-whisper
.venv/bin/yt-dlp -f "bv*[height<=720]+ba/b[height<=720]" --merge-output-format mp4 -o "video/curso.%(ext)s" https://youtu.be/zb5YFaoXpKw
mkdir -p frames && ffmpeg -i video/curso.mp4 -vf fps=1/4,scale=960:-1 -q:v 3 frames/f_%05d.jpg
.venv/bin/python slides.py        # diapositivas distintas -> slides/
.venv/bin/python transcribe.py    # transcripción del audio (lento en CPU)
```
