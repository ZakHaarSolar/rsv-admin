#!/usr/bin/env python3
"""build_resume.py v1.0 — CV en inglés para micro1: QA Engineer · 2D & Creative Applications (2026-10-09).

Un solo origen para el PDF que se sube y el texto limpio (.md) que se pega en formularios. Mismo diseño que
los demás CV de aplicaciones/ (Times, azul marino, reglas finas) y la misma maquetación que se ajusta sola a
una hoja.

Enfoque (Zak): pruebas manuales y funcionales de software creativo 2D, consistencia de interfaz, casos
límite, artefactos visuales y reportes de bugs reproducibles. NADA de backend ni algoritmos: lo técnico se
queda en flujos de interfaz, comportamiento visual y software creativo.

Todo es comprobable. El puesto en micro1 va con su título real (Video Annotation Specialist) porque este CV
lo lee la misma empresa que lo contrató; cada ejemplo de las viñetas pasó de verdad (ver CLAUDE.md de
aplicaciones/). Herramientas: Photoshop, Illustrator, DaVinci Resolve y Blender están instalados y con
proyectos en la Mac; Figma lo puso Zak.

Uso:  ../../.venv/bin/python build_resume.py
"""

import os

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

AQUI = os.path.dirname(os.path.abspath(__file__))
OUT_PDF = os.path.join(AQUI, "Diego_Soto_Borja_Almeida_Resume.pdf")
OUT_MD = os.path.join(AQUI, "Diego_Soto_Borja_Almeida_Resume.md")

W, H = letter
LEFT = 0.68 * inch
RIGHT = W - 0.68 * inch
TOP = H - 0.55 * inch
BOTTOM = 0.55 * inch
WIDTH = RIGHT - LEFT
NAVY = (0.12, 0.16, 0.22)
GRAY = (0.32, 0.34, 0.38)
RULE = (0.78, 0.80, 0.82)

# ── Contenido ──────────────────────────────────────────────────────────────
NAME = "Diego Soto Borja Almeida"
HEADLINE = "QA Engineer | 2D Creative Applications & UI/UX Evaluation"
CONTACT = [
    "Cancún, Mexico (UTC-5)  ·  Remote  ·  Native Spanish  ·  Fluent professional English",
    "zakhaarsol@pm.me  ·  escanervibracional.com  ·  play.redsolarviva.com  ·  fotoncero.com",
]

SUMMARY = (
    "Analytical QA specialist and digital creator with a foundation in telematics engineering and "
    "data, hands-on UX work and multimodal AI evaluation. I test creative and interactive software "
    "the way people actually use it: running 2D design, editing and animation workflows end to end, "
    "reproducing interface edge cases on iOS, Android, macOS and the web, and catching visual "
    "artifacts and inconsistencies that automated checks miss. I write clear, structured bug reports "
    "(exact steps, environment, expected vs. actual, evidence) and verify every fix on the same device "
    "before release. Detail-oriented, consistent with long guidelines, and fully bilingual."
)

SKILLS = [
    ("QA methods", "Manual testing, functional testing, exploratory testing, test case design, edge case "
                   "discovery, bug reproduction and reporting, regression checks, UI/UX consistency "
                   "verification"),
    ("Creative tools", "Figma, Adobe Photoshop, Adobe Illustrator, DaVinci Resolve, Blender"),
    ("Platforms", "Web and mobile app testing (iOS, Android, macOS), cross-browser and responsive "
                  "verification (Safari/WebKit, Chrome), real-device testing"),
    ("Concepts", "Export format optimization (image, video, audio), visual component architecture and "
                 "design systems, localization QA, reduced-motion accessibility"),
    ("Languages", "Spanish (native), English (fluent, professional)"),
]

JOBS = [
    {
        "role": "Video Annotation Specialist  ·  AI Data Quality (Multimodal Robotics)",
        "dates": "Sep 2026 – Present",
        "sub": "micro1  ·  Remote contract  ·  Under NDA: client name withheld",
        "bullets": [
            "Review long multi-camera video episodes of robotic manipulation (up to 8 synchronized "
            "views, about 18 minutes each) frame by frame and annotate them as AI training data; "
            "full-time load of 40 hours per week.",
            "Make precise visual and temporal calls: action boundaries, left vs. right arm, object "
            "contact, and whether the outcome matches the instruction, cross-checking camera views "
            "when one is occluded.",
            "Apply a long, evolving guideline with strict consistency; surface edge cases and "
            "inconsistencies, resolve them by the guideline's decision rules, and document true "
            "ambiguities in short, objective written notes.",
            "Self-QA every episode before submitting; deliver in a single pass at about 35% under "
            "the per-task time budget.",
        ],
    },
    {
        "role": "Founder, Product & QA  ·  Escáner Vibracional / Red Solar Viva",
        "dates": "2024 – Present",
        "sub": "Cross-platform consumer app  ·  iOS, Android, macOS and web  ·  escanervibracional.com",
        "bullets": [
            "Own manual, functional and exploratory testing for every release on real devices before "
            "it ships: iPhone, Android, Mac and the web, in portrait and landscape, light and dark "
            "themes, Spanish and English, online and offline.",
            "Report bugs with exact steps, device, time and screenshots, then verify the fix on the "
            "same device; e.g., a launch animation that froze after the app resumed from background, "
            "and an invisible layer that silently blocked taps on iOS.",
            "Test the app's 2D creative tools: a rich-text note editor (formatting, color, highlight), "
            "a photo vision board, an avatar cropper and a wallpaper gallery, probing long text, empty "
            "states, large images and lost connections.",
            "Verify UI/UX consistency across the design system: light and dark themes built from "
            "shared tokens, a desktop visual grammar applied screen by screen, and about 3,700 "
            "bilingual interface strings checked for fit and tone.",
            "Catch rendering artifacts across engines and devices: a glow effect that made low-end "
            "Android Chrome drop card layers, fixed by rewriting it for that engine; app icons "
            "re-cropped to stay legible at 16 to 32 px.",
        ],
    },
]

PROJECTS = [
    {
        "role": "Creator  ·  Ludus Cero (2D and WebGL games)",
        "dates": "2026 – Present",
        "sub": "play.redsolarviva.com  ·  pixel-art tactical RPG, exploration game, music-driven "
               "navigation game",
        "bullets": [
            "Playtest every build for pixel-perfect scaling to any window size, input across keyboard, "
            "mouse, trackpad and touch, difficulty measured room by room, and audio levels checked "
            "against approved references.",
        ],
    },
    {
        "role": "Founder  ·  Fotón Cero (audiovisual studio)",
        "dates": "2025 – Present",
        "sub": "fotoncero.com  ·  youtube.com/@zakhaarsolar",
        "bullets": [
            "Produce and quality-check animated music videos, series and game trailers for "
            "continuity, timing and intent; catch export defects (a stereo mix collapsed to one "
            "channel, effects masking the music) and define the corrected delivery settings in "
            "DaVinci Resolve.",
            "Ship the studio's screening site with video encoded in three qualities; found a video "
            "that flickered black on real GPUs (a CSS mask over the video) and verified the fix.",
        ],
    },
]


# ── Maquetación (con medición previa: elige el tamaño más grande que cabe en una hoja) ──
def wrap(c, text, font, size, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if c.stringWidth(trial, font, size) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


class Pluma:
    """Dibuja (o solo mide, con dry=True) el CV a una escala de letra dada."""

    def __init__(self, c, s, dry):
        self.c, self.s, self.dry = c, s, dry
        self.y = TOP
        self.paginas = 1

    def salto(self, alto):
        if self.y - alto < BOTTOM:
            self.paginas += 1
            if not self.dry:
                self.c.showPage()
            self.y = TOP

    def texto(self, x, y, txt, font, size, color=NAVY):
        if not self.dry:
            self.c.setFillColorRGB(*color)
            self.c.setFont(font, size)
            self.c.drawString(x, y, txt)

    def derecha(self, y, txt, font, size, color=GRAY):
        if not self.dry:
            tw = self.c.stringWidth(txt, font, size)
            self.c.setFillColorRGB(*color)
            self.c.setFont(font, size)
            self.c.drawString(RIGHT - tw, y, txt)

    def encabezado(self):
        s = self.s
        self.texto(LEFT, self.y, NAME, "Times-Bold", 20 * s)
        self.y -= 15 * s
        self.texto(LEFT, self.y, HEADLINE, "Times-Bold", 11.2 * s, GRAY)
        self.y -= 13 * s
        for linea in CONTACT:
            self.texto(LEFT, self.y, linea, "Times-Roman", 9.4 * s, GRAY)
            self.y -= 11.6 * s
        self.y -= 8 * s

    def seccion(self, titulo):
        s = self.s
        self.salto(34 * s)
        self.texto(LEFT, self.y, titulo.upper(), "Times-Bold", 10.4 * s)
        self.y -= 5 * s
        if not self.dry:
            self.c.setStrokeColorRGB(*RULE)
            self.c.setLineWidth(0.6)
            self.c.line(LEFT, self.y, RIGHT, self.y)
        self.y -= 13 * s

    def parrafo(self, txt):
        s = self.s
        size, lead = 9.6 * s, 12.2 * s
        for linea in wrap(self.c, txt, "Times-Roman", size, WIDTH):
            self.salto(lead)
            self.texto(LEFT, self.y, linea, "Times-Roman", size)
            self.y -= lead
        self.y -= 7 * s

    def vineta(self, txt):
        s = self.s
        size, lead = 9.5 * s, 12 * s
        x = LEFT + 12
        lineas = wrap(self.c, txt, "Times-Roman", size, RIGHT - x)
        self.salto(lead * min(len(lineas), 2))
        self.texto(LEFT, self.y, "•", "Times-Roman", size)
        for linea in lineas:
            self.salto(lead)
            self.texto(x, self.y, linea, "Times-Roman", size)
            self.y -= lead
        self.y -= 2.2 * s

    def habilidades(self):
        s = self.s
        size, lead = 9.5 * s, 12 * s
        # La columna de etiquetas mide lo que mide su etiqueta más larga.
        etiqueta_w = max(
            self.c.stringWidth(k, "Times-Bold", size) for k, _ in SKILLS
        ) + 10 * s
        for k, v in SKILLS:
            lineas = wrap(self.c, v, "Times-Roman", size, WIDTH - etiqueta_w)
            self.salto(lead * len(lineas))
            self.texto(LEFT, self.y, k, "Times-Bold", size)
            for linea in lineas:
                self.texto(LEFT + etiqueta_w, self.y, linea, "Times-Roman", size)
                self.y -= lead
        self.y -= 6 * s

    def puesto(self, j):
        s = self.s
        self.salto(52 * s)
        self.texto(LEFT, self.y, j["role"], "Times-Bold", 10.3 * s)
        self.derecha(self.y, j["dates"], "Times-Italic", 9.3 * s)
        self.y -= 12.5 * s
        self.texto(LEFT, self.y, j["sub"], "Times-Italic", 8.9 * s, GRAY)
        self.y -= 13.5 * s
        for b in j["bullets"]:
            self.vineta(b)
        self.y -= 6 * s

    def todo(self):
        self.encabezado()
        self.seccion("Summary")
        self.parrafo(SUMMARY)
        self.seccion("Core skills")
        self.habilidades()
        self.seccion("Professional experience")
        for j in JOBS:
            self.puesto(j)
        self.seccion("Selected projects")
        for p in PROJECTS:
            self.puesto(p)


def escribir_pdf():
    c = canvas.Canvas(OUT_PDF, pagesize=letter)
    c.setTitle(f"{NAME} · Resume")
    c.setAuthor(NAME)
    c.setSubject(HEADLINE)
    # Medir primero: la escala más grande (hasta 1.0) que cabe en una sola hoja.
    escala = 1.0
    while escala > 0.86:
        p = Pluma(c, escala, dry=True)
        p.todo()
        if p.paginas == 1:
            break
        escala = round(escala - 0.01, 2)
    p = Pluma(c, escala, dry=False)
    p.todo()
    c.showPage()
    c.save()
    return escala, p.paginas


def escribir_md():
    out = [f"# {NAME}", f"**{HEADLINE}**", ""]
    out += [f"{linea}  " for linea in CONTACT]
    out += ["", "## Summary", SUMMARY, "", "## Core skills"]
    out += [f"- **{k}:** {v}" for k, v in SKILLS]
    for titulo, grupo in (("Professional experience", JOBS), ("Selected projects", PROJECTS)):
        out += ["", f"## {titulo}"]
        for j in grupo:
            out += ["", f"### {j['role']}", f"*{j['dates']}  ·  {j['sub']}*", ""]
            out += [f"- {b}" for b in j["bullets"]]
    out += [""]
    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.write("\n".join(out))


if __name__ == "__main__":
    escala, paginas = escribir_pdf()
    escribir_md()
    print(f"{OUT_PDF}\n{OUT_MD}\nescala={escala} paginas={paginas}")
