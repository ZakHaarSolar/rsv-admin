#!/usr/bin/env python3
# Red Solar Viva · Oráculo — extractor de corpus
# =================================================================
# Convierte los .docx de "Códices de Luz/DOCs/" en .txt UTF-8 limpios
# bajo admin/oraculo/corpus/. Un .docx es un zip: leemos word/document.xml,
# convertimos los párrafos en saltos de línea y quitamos las etiquetas XML.
#
# Uso:  python3 admin/oraculo/extract_corpus.py
# (corre desde la raíz del repo)

import zipfile
import re
import html
import os
import sys
import unicodedata

# (archivo .docx fuente, nombre de salida .txt, título legible para el índice)
# Los 9 Códices de Luz completos.
CORPUS = [
    ("Arquitecto de la Realidad.docx", "arquitecto-de-la-realidad.txt", "Arquitecto de la Realidad"),
    ("Cuerpo de Silicio.docx", "cuerpo-de-silicio.txt", "Cuerpo de Silicio"),
    ("La Física de la Voluntad.docx", "fisica-de-la-voluntad.txt", "La Física de la Voluntad"),
    ("La Muerte no Existe.docx", "la-muerte-no-existe.txt", "La Muerte no Existe"),
    ("Lenguaje Holográfico.docx", "lenguaje-holografico.txt", "Lenguaje Holográfico"),
    ("Protocolo de Entrada.docx", "protocolo-de-entrada.txt", "Protocolo de Entrada"),
    ("Singularidad Orgánica.docx", "singularidad-organica.txt", "Singularidad Orgánica"),
    ("Sintiencia.docx", "sintiencia.txt", "Sintiencia"),
    ("Terra Cristal.docx", "terra-cristal.txt", "Terra Cristal"),
]

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC_DIR = os.path.join(ROOT, "Códices de Luz", "DOCs")
OUT_DIR = os.path.join(ROOT, "admin", "oraculo", "corpus")


def docx_to_text(path: str) -> str:
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8", "replace")
    # Paragraph end -> newline; tabs; line breaks inside a run -> space
    xml = re.sub(r"</w:p>", "\n", xml)
    xml = re.sub(r"<w:tab\s*/>", "\t", xml)
    xml = re.sub(r"<w:br\s*/>", "\n", xml)
    # Strip every remaining XML tag
    xml = re.sub(r"<[^>]+>", "", xml)
    text = html.unescape(xml)
    # Normalize unicode (NFC) so accents are single codepoints
    text = unicodedata.normalize("NFC", text)
    # Collapse runs of blank lines to at most 2, trim trailing whitespace per line
    lines = [ln.rstrip() for ln in text.split("\n")]
    out, blanks = [], 0
    for ln in lines:
        if ln.strip() == "":
            blanks += 1
            if blanks <= 2:
                out.append("")
        else:
            blanks = 0
            out.append(ln)
    return "\n".join(out).strip() + "\n"


def main() -> int:
    os.makedirs(OUT_DIR, exist_ok=True)
    ok = True
    for src_name, out_name, title in CORPUS:
        src = os.path.join(SRC_DIR, src_name)
        if not os.path.exists(src):
            print(f"  ✗ FALTA: {src}")
            ok = False
            continue
        text = docx_to_text(src)
        out = os.path.join(OUT_DIR, out_name)
        with open(out, "w", encoding="utf-8") as f:
            f.write(text)
        n = len(text)
        flag = "✓" if n > 2000 else "⚠ (corto)"
        print(f"  {flag} {title}: {n:,} chars -> {out_name}")
        if n <= 2000:
            ok = False
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
