#!/usr/bin/env python3
"""build_resume.py v1.0 — CV en inglés para DataAnnotation (2026-10-07).

Un solo origen para las dos salidas: el PDF que se sube a las plataformas y el
texto limpio (.md) que se pega en formularios. Mismo diseño que el CV original
(cv/2026-09 micro1 (original)/): Times, azul marino, reglas finas.

Perfil doble: Software Engineer (pruebas de código, multimodal) + AI Data
Evaluator, con el español nativo y la localización como respaldo del puesto de
Spanish Specialist. Todo lo que dice está comprobado contra el código y los
registros del ecosistema (ver LEEME.md de aplicaciones/): el stack es el que
corre en producción (Vite, no Next.js) y los números salen del repo.

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
HEADLINE = "Software Engineer & AI Data Evaluator"
CONTACT = [
    "Cancún, Mexico (UTC-5)  ·  Remote, flexible hours  ·  Native Spanish (Mexico)  ·  "
    "Professional working English",
    "zakhaarsol@pm.me  ·  escanervibracional.com  ·  redsolarviva.com",
]

SUMMARY = (
    "Software engineer and AI data evaluator. I build and ship a full-stack app for iOS, Android, "
    "macOS and the web, working hands-on with frontier coding models: I write the spec, drive the "
    "model through each change, and verify it on real devices before it ships. Since September "
    "2026 I also annotate multimodal robotics video for AI training, full time. Strengths: "
    "reviewing AI-generated output against written specs, catching confidently wrong answers, "
    "strong visual judgment, and following long guidelines without drifting. Native Spanish "
    "(Mexico), with years of bilingual writing and localization."
)

STACK = [
    ("Languages", "TypeScript, JavaScript, SQL (PostgreSQL), Python"),
    ("Front end", "React, Vite, Framer Motion, Three.js (React Three Fiber), WebGL, Web Audio API"),
    ("Apps", "Capacitor (iOS, Android), Tauri (macOS), native iOS plugins in Swift and Metal, "
             "App Store and Google Play releases"),
    ("Back end", "Supabase (Postgres, row-level security, RPCs, Edge Functions), Clerk auth, Stripe, "
                 "RevenueCat, Vercel, Cloudflare R2"),
    ("AI", "Claude Code (agentic coding), Gemini API, Cloud Vision OCR, ElevenLabs voice; prompt "
           "design and output evaluation"),
    ("Tools", "Git and GitHub, Xcode, Android Studio, Blender, ffmpeg"),
]

JOBS = [
    {
        "role": "AI Data Evaluator (Video Annotation Specialist)  ·  Multimodal Robotics",
        "dates": "Sep 2026 – Present",
        "sub": "Remote contract  ·  AI training data  ·  Under NDA: client name withheld",
        "bullets": [
            "Evaluate and annotate long multi-camera video episodes of robotic manipulation (up to "
            "8 synchronized views, about 18 minutes each) that become AI training data; full-time "
            "load of 40 hours per week.",
            "Make frame-accurate spatial and temporal calls across views: where each action starts "
            "and ends, left vs. right arm, object contact, and whether the outcome matches the "
            "instruction.",
            "Apply a long, evolving rubric with strict consistency; reason through ambiguous moments "
            "(occlusions, retries, overlapping actions) with its decision rules and flag true edge "
            "cases in short, objective English.",
            "Self-QA every episode before submitting; deliver in a single pass at about 35% under "
            "the per-task time budget.",
        ],
    },
    {
        "role": "Founder & Software Engineer  ·  Escáner Vibracional / Red Solar Viva",
        "dates": "2024 – Present",
        "sub": "escanervibracional.com  ·  App Store, Google Play, macOS and web  ·  Cancún, remote",
        "bullets": [
            "Built the full-stack architecture of a self-tracking app that measures six life domains "
            "and routes each user to a next action: React and TypeScript (Vite) with Framer Motion, "
            "Capacitor for iOS and Android, Tauri for macOS, and Supabase (Postgres, RPCs, Edge "
            "Functions) with Clerk auth. Three.js drives the 3D scenes of the companion site.",
            "In production: about 245,000 lines of TypeScript, 349 database migrations and 59 "
            "serverless functions. Own specs, implementation, QA, store releases, payments (Stripe, "
            "RevenueCat) and copy.",
            "Work daily with frontier coding models (Claude Code): spec the change, drive the model, "
            "test on real devices before release. Catch regressions, confidently wrong fixes and "
            "verifications that never ran; tighten the spec when the model drifts.",
            "Debug with evidence: traced an iOS freeze to the animation-frame clock stalling after "
            "background resume, using logs pulled from the device, and shipped a watchdog that keeps "
            "the interface responsive.",
            "Built a two-stage vision pipeline (Google Cloud Vision OCR, then Gemini evaluation); "
            "review failures and edge cases (glare, curved bottles, low contrast) and rewrite the "
            "guideline when the model is wrong.",
        ],
    },
]

SPANISH = [
    "Review and edit AI-generated Spanish every day for fidelity, fluency and tone: catch regional "
    "drift (Rioplatense voseo, or Spain's \"bombilla\" where Mexico says \"foco\"), wrong register, "
    "and punctuation that reads as machine-written; turn each fix into a style-guide rule.",
    "Localized the whole product: about 3,700 interface strings written in Spanish with their "
    "English versions, under a locked glossary of which terms never get translated and which have "
    "fixed equivalents. The same discipline as applying an annotation rubric.",
    "Author, as Zak'Haar, of Spanish-language nonfiction in the Códices de Luz book series "
    "(ebook, PDF and audiobook). Direct and QA Spanish AI voice narration: pronunciation, pacing, "
    "sibilance.",
]

FOTON = {
    "role": "Founder  ·  Fotón Cero (audiovisual catalog)",
    "dates": "2025 – Present",
    "sub": "fotoncero.com  ·  youtube.com/@zakhaarsolar  ·  Cancún, remote",
    "bullets": [
        "Run an independent catalog of animated music videos, original series and game trailers. "
        "Review sequences for continuity, timing, completeness of an action, and whether a shot "
        "matches the intended instruction: the same visual judgment used to label robot videos.",
    ],
}


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

    def stack(self):
        s = self.s
        size, lead = 9.5 * s, 12 * s
        etiqueta_w = 62 * s
        for k, v in STACK:
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
        self.seccion("Tech stack (in production)")
        self.stack()
        self.seccion("Experience")
        for j in JOBS:
            self.puesto(j)
        self.seccion("Native Spanish & localization")
        for b in SPANISH:
            self.vineta(b)
        self.y -= 6 * self.s
        self.seccion("Creative work")
        self.puesto(FOTON)


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
    out += ["", "## Summary", SUMMARY, "", "## Tech stack (in production)"]
    out += [f"- **{k}:** {v}" for k, v in STACK]
    out += ["", "## Experience"]
    for j in JOBS + [FOTON]:
        if j is FOTON:
            out += ["", "## Creative work"]
        out += ["", f"### {j['role']}", f"*{j['dates']}  ·  {j['sub']}*", ""]
        out += [f"- {b}" for b in j["bullets"]]
        if j is JOBS[-1]:
            out += ["", "## Native Spanish & localization"]
            out += [f"- {b}" for b in SPANISH]
    out += [""]
    with open(OUT_MD, "w", encoding="utf-8") as f:
        f.write("\n".join(out))


if __name__ == "__main__":
    escala, paginas = escribir_pdf()
    escribir_md()
    print(f"{OUT_PDF}\n{OUT_MD}\nescala={escala} paginas={paginas}")
