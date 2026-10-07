#!/usr/bin/env python3
"""One-page English resume for Diego Soto Borja Almeida — micro1 Generalist.

build_resume.py v1.1 — 2026-10-07: se mudó a cv/2026-09 micro1 (original)/ y ahora escribe el PDF junto a
sí mismo. El contenido del CV queda intacto (es la versión con la que entró a micro1).
"""

import os

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Diego Soto Borja Almeida Resume.pdf")

W, H = letter
LEFT = 0.7 * inch
RIGHT = W - 0.7 * inch
WIDTH = RIGHT - LEFT
NAVY = (0.12, 0.16, 0.22)
GRAY = (0.32, 0.34, 0.38)
RULE = (0.78, 0.80, 0.82)


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


def section(c, y, title):
    c.setFillColorRGB(*NAVY)
    c.setFont("Times-Bold", 10.5)
    c.drawString(LEFT, y, title.upper())
    y -= 5
    c.setStrokeColorRGB(*RULE)
    c.setLineWidth(0.6)
    c.line(LEFT, y, RIGHT, y)
    return y - 14


def bullet(c, y, text, size=9.6, leading=12.4):
    c.setFillColorRGB(*NAVY)
    c.setFont("Times-Roman", size)
    c.drawString(LEFT, y, "•")
    x = LEFT + 12
    for i, line in enumerate(wrap(c, text, "Times-Roman", size, RIGHT - x)):
        c.drawString(x, y, line)
        y -= leading
    return y - 2.2


def job_head(c, y, role, dates):
    c.setFillColorRGB(*NAVY)
    c.setFont("Times-Bold", 10.4)
    c.drawString(LEFT, y, role)
    c.setFont("Times-Italic", 9.4)
    c.setFillColorRGB(*GRAY)
    tw = c.stringWidth(dates, "Times-Italic", 9.4)
    c.drawString(RIGHT - tw, y, dates)
    return y - 13


def main():
    c = canvas.Canvas(OUT, pagesize=letter)
    c.setTitle("Diego Soto Borja Almeida — Resume")
    c.setAuthor("Diego Soto Borja Almeida")

    y = H - 0.62 * inch

    c.setFillColorRGB(*NAVY)
    c.setFont("Times-Bold", 20)
    c.drawString(LEFT, y, "Diego Soto Borja Almeida")
    y -= 16

    c.setFont("Times-Roman", 9.6)
    c.setFillColorRGB(*GRAY)
    c.drawString(LEFT, y, "Cancún, Mexico  ·  Remote  ·  Native Spanish  ·  Professional working English")
    y -= 12
    c.drawString(LEFT, y, "zakhaarsol@pm.me  ·  escanervibracional.com  ·  redsolarviva.com")
    y -= 22

    y = section(c, y, "Summary")
    summary = (
        "Independent product builder. I design, ship, and quality-check consumer software "
        "and audiovisual work end to end — including reviewing AI-generated output against "
        "written specs. Strong visual judgment, high attention to detail, and comfort following "
        "long guidelines without drifting. Available up to 24 hours per week on a flexible remote "
        "schedule (Cancún, UTC−5), with overlap for U.S. morning hours."
    )
    c.setFillColorRGB(*NAVY)
    c.setFont("Times-Roman", 9.8)
    for line in wrap(c, summary, "Times-Roman", 9.8, WIDTH):
        c.drawString(LEFT, y, line)
        y -= 12.6
    y -= 10

    y = section(c, y, "Experience")

    y = job_head(c, y, "Founder & Product Builder — Escáner Vibracional / Red Solar Viva", "2024 – Present")
    c.setFillColorRGB(*GRAY)
    c.setFont("Times-Italic", 9)
    c.drawString(LEFT, y, "escanervibracional.com  ·  iOS, Android, and desktop  ·  Cancún, remote")
    y -= 14
    for t in [
        "Built Escáner Vibracional, a self-tracking app that measures six life domains, stores results, and routes the user to the next action. Own specs, implementation, QA, store releases, payments, and user-facing copy.",
        "Wrote and maintain ~1,700 bilingual UI strings (Spanish / English) with a locked glossary so wording stays consistent across the product — the same discipline as applying an annotation rubric.",
        "Designed a two-stage visual pipeline: extract text from product photos, then evaluate the result with a language model. I review failures and edge cases (glare, curved bottles, low contrast) and rewrite the guideline when the model is wrong.",
        "Work independently against written specs and a quality bar, not a manager’s calendar. Daily work includes judging whether an AI output matches the intended instruction.",
    ]:
        y = bullet(c, y, t)
    y -= 8

    y = job_head(c, y, "Founder — Fotón Cero (audiovisual catalog)", "2025 – Present")
    c.setFillColorRGB(*GRAY)
    c.setFont("Times-Italic", 9)
    c.drawString(LEFT, y, "fotoncero.com  ·  youtube.com/@zakhaarsolar  ·  Cancún, remote")
    y -= 14
    for t in [
        "Run an independent catalog of animated music videos and original series. Review visual sequences for continuity, timing, completeness of an action, and whether a shot matches the intended instruction.",
        "Produce and quality-check motion, composition, and episode catalogs before they go public. This is the same visual judgment used to label videos of robots performing tasks.",
    ]:
        y = bullet(c, y, t)
    y -= 10

    y = section(c, y, "Relevant strengths for this role")
    for t in [
        "Visual review of video and stills: action start/end, left vs. right, object contact, instruction vs. outcome.",
        "Following long written guidelines without improvising; flagging edge cases in short, objective English.",
        "Remote, independent delivery. Up to 24 hours/week. Core overlap 09:00–13:00 Cancún (10:00–14:00 U.S. Eastern), plus an additional async block.",
        "Bilingual product work (native Spanish, professional working English). Comfortable writing short labels and justifications in English.",
    ]:
        y = bullet(c, y, t)
    y -= 10

    y = section(c, y, "Availability")
    avail = (
        "Contractor, up to 24 hours per week, fully remote. Hours are flexible and mostly asynchronous. "
        "I can shift the morning block to 08:00 or 10:00 Cancún time if a briefing needs U.S. overlap. "
        "Happy to keep this alongside my own products."
    )
    c.setFillColorRGB(*NAVY)
    c.setFont("Times-Roman", 9.8)
    for line in wrap(c, avail, "Times-Roman", 9.8, WIDTH):
        c.drawString(LEFT, y, line)
        y -= 12.6

    c.showPage()
    c.save()
    print(OUT)


if __name__ == "__main__":
    main()
