#!/usr/bin/env python3
# nucleo_extradimensional.py v1.0 · Red Solar Viva · Oráculo (2026-10-08)
# =====================================================================
# Rehace en español limpio las 15 sesiones de Bashar del Núcleo Extradimensional
# (corpus/nucleo-extradimensional-03 a 15). El 01, el 02 y el principio del 03 son
# libros (Los Fundamentos, Plano para el Cambio, Maestros de la Limitación) y no
# se tocan.
#
# Por qué: 12 de esos archivos traían la transcripción automática CRUDA (los
# segmentos de Whisper con "speaker": "SPEAKER_11"), en inglés, y las sesiones
# Paso 3, 4 y 6 una prosa con marcas Q:/Bashar: que fallaban a media frase. Al
# preguntarle al Espejo "¿Qué quiero de verdad?", el primer fragmento era la
# anécdota de alguien del público ("anoche estuve en una ceremonia y el
# facilitador me preguntó qué quería recibir") y el Espejo se la contaba al
# Tripulante como si fuera suya (1 de cada 3 respuestas).
#
# Qué hace: lee las transcripciones originales (Escaner Vibracional IA/Bashar/),
# junta los segmentos en turnos, los parte en tramos y le pide a Claude que cada
# tramo quede en prosa en español: la enseñanza de Bashar completa y fiel, y lo
# que dice el público en tercera persona, en un párrafo que empieza con
# "Pregunta:". Nada de lo que dice el público queda en primera persona.
#
# Uso (requiere el paquete anthropic: pip install anthropic, dentro de un venv):
#   export ANTHROPIC_API_KEY="$(security find-generic-password -s rsv-anthropic -w)"
#   python3 nucleo_extradimensional.py preparar    → los tramos en .trabajo_nucleo/
#   python3 nucleo_extradimensional.py probar [id] → 3 tramos (o los que nombres) directos, para revisar el tono
#   python3 nucleo_extradimensional.py enviar      → un lote con lo que falta (Batches API, mitad de precio)
#   python3 nucleo_extradimensional.py recoger     → espera el lote y guarda cada tramo
#   python3 nucleo_extradimensional.py rehacer     → repite directo los tramos que fallaron
#   python3 nucleo_extradimensional.py armar       → escribe corpus/nucleo-extradimensional-03..15
#   python3 nucleo_extradimensional.py revisar     → busca restos (JSON, inglés, rayas, voseo, primera persona)
# Después se reindexa con index_corpus.sh (SOLO="nucleo-extradimensional-*").
# El trabajo intermedio vive en oraculo/.trabajo_nucleo/ (fuera de git): si algo
# se corta, cada paso retoma desde lo que ya quedó guardado.

import collections
import json
import os
import re
import sys
import time

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FUENTES = os.path.join(RAIZ, "Escaner Vibracional IA", "Bashar")
CORPUS = os.path.join(RAIZ, "admin", "oraculo", "corpus")
TRABAJO = os.path.join(RAIZ, "admin", "oraculo", ".trabajo_nucleo")
RESULTADOS = os.path.join(TRABAJO, "resultados")
MODELO = "claude-opus-5-5"
ESFUERZO = "low"

# (título de la sesión en el corpus, transcripción original), en el orden del corpus.
SESIONES = [
    ("Experimento Social Interestelar, Paso 3", "BSE3_final.txt"),
    ("Experimento Social Interestelar, Paso 4", "BSE4_final.txt"),
    ("Experimento Social Interestelar, Paso 5", "BSE5_final.txt"),
    ("Experimento Social Interestelar, Paso 6", "BSE6_final.txt"),
    ("Experimento Social Interestelar, Parte 1", "Bashar Social Experiment 1.txt"),
    ("Experimento Social Interestelar, Parte 2", "Bashar Social Experiment 2.txt"),
    ("Cuenta Regresiva al Contacto", "CountdownToContact.txt"),
    ("ETU, Tu Universo Emocional", "ETU.txt"),
    ("Ecos de Sedona", "EchoesOfSedona.txt"),
    ("Sigue Tus Sueños", "FYDFinal.txt"),
    ("No Más Secretos", "No More Secrets.txt"),
    ("Contacto Abierto, Parte 1", "Open Contact Part 1.txt"),
    ("Contacto Abierto, Parte 2", "Open Contact Part 2.txt"),
    ("Cambiando de Realidades", "ShiftingRealities.txt"),
    ("El Ciclo del Alma", "Soul Cycle.txt"),
]
# La 1ª sesión se agrega al final del archivo 03 (después de los libros); las
# otras 14 se reparten enteras en los archivos 04 a 15.
PRIMER_ARCHIVO, ULTIMO_ARCHIVO = 3, 15

TRAMO_MIN, TRAMO_MAX = 6000, 11000

SISTEMA = """Conviertes en prosa limpia, en español, la transcripción automática de una sesión pública de Bashar (canalizado por Darryl Anka), grabada en inglés. El resultado va a una biblioteca de consulta que una inteligencia artificial lee como conocimiento de fondo para acompañar a personas. Esa IA confunde las anécdotas del público contadas en primera persona con la vida de quien le escribe; por eso lo que dice el público nunca puede quedar en primera persona.

Cómo llega la transcripción: turnos marcados [Bashar] o [Participante N], salidos de un reconocedor de voz con errores. Las marcas de quién habla fallan a menudo: un turno marcado como participante puede ser Bashar, y al revés, y a veces cambian a media frase. Decide quién habla por el sentido. También trae muletillas, palabras mal oídas (como «Peshawar» o «Bashir» por Bashar), frases repetidas por error y restos sin sentido.

Lo que entregas:
1. La enseñanza de Bashar traducida completa y fiel: sus ideas, explicaciones, ejemplos, metáforas, las preguntas que hace y su manera de razonar. No la resumas ni la acortes, y no agregues nada que él no haya dicho. Bashar habla de sí en primera persona del plural, se dirige a quien pregunta de tú y al público de ustedes.
2. Cada intervención del público, condensada en tercera persona en su propio párrafo, que empieza con «Pregunta:». Una o dos frases con la duda o la situación interior, lo indispensable para entender la respuesta, por ejemplo: «Pregunta: una persona dice que, cuando le preguntan qué quiere recibir, se queda en blanco; quiere saber qué se lo impide.» Sin nombres, sin primera persona (tampoco «somos» ni «nuestro»: «la persona plantea que la humanidad…») y sin la escena: dónde estaba, en qué evento, con quién o cuándo (una ceremonia, un viaje, una terapia, «anoche») se omite, salvo que la respuesta de Bashar trate justo de eso.
3. Si Bashar repite detalles de la vida de quien pregunta (nombres, lugares, fechas, sucesos), conserva solo lo indispensable para entender la enseñanza.
4. Cuando el diálogo es un ir y venir de frases cortas, cuéntalo en prosa: las preguntas y afirmaciones de Bashar (puedes citarlas entre comillas «»), y lo que contesta la persona, siempre en tercera persona.
5. Fuera: saludos, despedidas, agradecimientos, aplausos, risas, los «sí», «muy bien» y «gracias» sueltos, la logística (micrófonos, tiempo, quién sigue, avisos del evento) y todo lo que sea error de transcripción.
6. Formato: párrafos de prosa separados por una línea en blanco. Sin títulos, viñetas, marcas de hablante (salvo «Pregunta:»), tiempos ni comentarios tuyos.
7. Español neutro de México: tú y ustedes, nunca voseo (tienes, puedes, haz, mira; jamás tenés, podés, hacé, mirá). Sin rayas largas (—) ni guiones de diálogo: usa comas, punto y coma, dos puntos o paréntesis.
8. Los nombres propios quedan como están (Bashar, Darryl Anka, Essassani, Yah-el, Shakana, Sasani, Orión, las Pléyades). «Excitement», en el sentido de Bashar, es «entusiasmo»: «sigue tu entusiasmo».
9. Si el tramo empieza o termina a media idea, conviértelo tal cual, sin inventar lo que falta ni cerrarlo.
10. Si el tramo no trae nada de contenido (solo saludos o logística), devuelve exactamente: (vacío)

Devuelve solo la prosa en español."""


def die(msg):
    print("✗ " + msg)
    sys.exit(1)


# ── 1. transcripción → turnos → tramos ──────────────────────────────────────
NO_LATINO = re.compile(r"[^\x00-\u024F\u1E00-\u1EFF\u2000-\u206F\u00A0-\u00FF\s]+")


def limpiar(t):
    return re.sub(r"\s+", " ", NO_LATINO.sub("", t or "")).strip()


def leer_segmentos(archivo):
    crudo = open(os.path.join(FUENTES, archivo), encoding="utf-8").read().lstrip()
    if crudo.startswith("+"):  # algunas transcripciones traen un "+" suelto al principio
        crudo = crudo[1:]
    return json.loads(crudo)


def a_turnos(segmentos):
    turnos, previo, repetido = [], None, 0
    for s in segmentos:
        t = limpiar(s.get("text"))
        if not t:
            continue
        # a partir de la tercera repetición idéntica seguida es eco del reconocedor
        repetido = repetido + 1 if t == previo else 0
        previo = t
        if repetido >= 2:
            continue
        hablante = s.get("speaker") or ""
        quien = "Bashar" if hablante == "Bashar" else "Participante " + str(int(re.sub(r"\D", "", hablante) or 0))
        if turnos and turnos[-1][0] == quien:
            turnos[-1][1].append(t)
        else:
            turnos.append([quien, [t]])
    return [(q, " ".join(ts)) for q, ts in turnos]


def partir_oraciones(texto, tam):
    oraciones = re.findall(r"[^.!?]+[.!?]+[\"')\]]*\s*|[^.!?]+$", texto) or [texto]
    partes, buf = [], ""
    for o in oraciones:
        if buf and len(buf) + len(o) > tam:
            partes.append(buf.strip())
            buf = ""
        buf += o
    if buf.strip():
        partes.append(buf.strip())
    return partes


def a_tramos(turnos):
    """Tramos de 6.000 a 11.000 caracteres. Se corta de preferencia justo antes de que
    alguien del público tome la palabra después de Bashar: ahí empieza una pregunta nueva."""
    tramos, cur, n = [], [], 0
    for quien, texto in turnos:
        for parte in [texto] if len(texto) <= TRAMO_MAX else partir_oraciones(texto, TRAMO_MAX - 3000):
            pregunta_nueva = quien != "Bashar" and cur and cur[-1][0] == "Bashar"
            if cur and ((n >= TRAMO_MIN and pregunta_nueva) or n + len(parte) > TRAMO_MAX):
                tramos.append(cur)
                cur, n = [], 0
            cur.append((quien, parte))
            n += len(parte) + len(quien) + 4
    if cur:
        tramos.append(cur)
    return ["\n".join(f"[{q}] {t}" for q, t in tr) for tr in tramos]


def preparar():
    os.makedirs(RESULTADOS, exist_ok=True)
    todos = []
    for k, (titulo, archivo) in enumerate(SESIONES, 1):
        textos = a_tramos(a_turnos(leer_segmentos(archivo)))
        for j, texto in enumerate(textos, 1):
            contexto = ""
            if j > 1:
                cola = textos[j - 2][-700:]
                contexto = "…" + cola[cola.find(" ") + 1:]
            todos.append({"id": f"s{k:02d}-t{j:03d}", "sesion": k, "titulo": titulo,
                          "texto": texto, "contexto": contexto})
        print(f"  {titulo}: {len(textos)} tramos, {sum(len(t) for t in textos):,} caracteres")
    with open(os.path.join(TRABAJO, "tramos.json"), "w", encoding="utf-8") as f:
        json.dump(todos, f, ensure_ascii=False, indent=1)
    print(f"✓ {len(todos)} tramos, {sum(len(t['texto']) for t in todos):,} caracteres en inglés")


def cargar_tramos():
    ruta = os.path.join(TRABAJO, "tramos.json")
    if not os.path.exists(ruta):
        die("primero: preparar")
    return json.load(open(ruta, encoding="utf-8"))


def pendientes(tramos):
    return [t for t in tramos if not os.path.exists(os.path.join(RESULTADOS, t["id"] + ".txt"))]


# ── 2. Claude ───────────────────────────────────────────────────────────────
def mensaje(t):
    previo = ""
    if t["contexto"]:
        previo = ("<contexto_previo>\nEsto ya quedó convertido en el tramo anterior: NO lo conviertas, "
                  "solo sirve para entender dónde empieza este.\n" + t["contexto"] + "\n</contexto_previo>\n\n")
    return previo + f"<tramo sesion=\"{t['titulo']}\">\n{t['texto']}\n</tramo>"


def parametros(t):
    return {
        "model": MODELO,
        "max_tokens": 16000,
        "system": SISTEMA,
        "messages": [{"role": "user", "content": mensaje(t)}],
        "output_config": {"effort": ESFUERZO},
    }


def cliente():
    try:
        import anthropic
    except ImportError:
        die("falta el paquete anthropic (pip install anthropic, dentro de un venv)")
    return anthropic, anthropic.Anthropic()


def guardar(t_id, texto, uso, modelo):
    with open(os.path.join(RESULTADOS, t_id + ".txt"), "w", encoding="utf-8") as f:
        f.write(texto.strip() + "\n")
    with open(os.path.join(RESULTADOS, t_id + ".json"), "w", encoding="utf-8") as f:
        json.dump({"modelo": modelo, "uso": uso}, f)


def directo(anthropic, client, t):
    """Un tramo fuera del lote (pruebas y repeticiones). Con el respaldo del servidor:
    si un clasificador declina, la misma llamada sigue con el modelo que Anthropic recomienda."""
    r = client.beta.messages.create(**parametros(t), betas=["server-side-fallback-2026-07-01"], fallbacks="default")
    if r.stop_reason != "end_turn":
        return None, f"{r.stop_reason}"
    texto = "".join(b.text for b in r.content if b.type == "text")
    return texto, r


def uso_dict(u):
    return {k: getattr(u, k, 0) or 0 for k in ("input_tokens", "output_tokens",
                                                   "cache_read_input_tokens", "cache_creation_input_tokens")}


def probar(*ids):
    tramos = cargar_tramos()
    elegidos = [t for t in tramos if t["id"] in ids] or [
        next(t for t in tramos if "ceremony and the facilitator" in t["texto"]),
        tramos[0],
        max(tramos, key=lambda t: t["texto"].count("\n[")),
    ]
    anthropic, client = cliente()
    os.makedirs(os.path.join(TRABAJO, "prueba"), exist_ok=True)
    for t in elegidos:
        t0 = time.time()
        texto, r = directo(anthropic, client, t)
        if texto is None:
            print(f"✗ {t['id']}: {r}")
            continue
        with open(os.path.join(TRABAJO, "prueba", t["id"] + ".txt"), "w", encoding="utf-8") as f:
            f.write(texto)
        print(f"\n━━ {t['id']} · {t['titulo']} · {time.time() - t0:.0f} s · "
              f"{len(t['texto']):,} → {len(texto):,} caracteres · {uso_dict(r.usage)}\n{texto}")


def enviar():
    tramos = pendientes(cargar_tramos())
    if not tramos:
        print("✓ no falta ningún tramo")
        return
    anthropic, client = cliente()
    from anthropic.types.message_create_params import MessageCreateParamsNonStreaming
    from anthropic.types.messages.batch_create_params import Request
    lote = client.messages.batches.create(requests=[
        Request(custom_id=t["id"], params=MessageCreateParamsNonStreaming(**parametros(t))) for t in tramos])
    ruta = os.path.join(TRABAJO, "lotes.json")
    lotes = json.load(open(ruta)) if os.path.exists(ruta) else []
    lotes.append({"id": lote.id, "tramos": len(tramos), "creado": time.strftime("%Y-%m-%d %H:%M:%S")})
    json.dump(lotes, open(ruta, "w"), indent=1)
    print(f"✓ lote {lote.id} con {len(tramos)} tramos ({lote.processing_status})")


def recoger():
    ruta = os.path.join(TRABAJO, "lotes.json")
    if not os.path.exists(ruta):
        die("no hay lotes: primero enviar")
    anthropic, client = cliente()
    fallos = {}
    for info in json.load(open(ruta)):
        while True:
            lote = client.messages.batches.retrieve(info["id"])
            c = lote.request_counts
            print(f"  {info['id']}: {lote.processing_status} · listos {c.succeeded} · en curso {c.processing} "
                  f"· errores {c.errored} · {time.strftime('%H:%M:%S')}", flush=True)
            if lote.processing_status == "ended":
                break
            time.sleep(30)
        for res in client.messages.batches.results(info["id"]):
            t_id, r = res.custom_id, res.result
            if os.path.exists(os.path.join(RESULTADOS, t_id + ".txt")):
                continue
            if r.type != "succeeded":
                fallos[t_id] = r.type
                continue
            m = r.message
            if m.stop_reason != "end_turn":
                fallos[t_id] = m.stop_reason
                continue
            guardar(t_id, "".join(b.text for b in m.content if b.type == "text"), uso_dict(m.usage), m.model)
    json.dump(fallos, open(os.path.join(TRABAJO, "fallos.json"), "w"), indent=1)
    falta = pendientes(cargar_tramos())
    print(f"✓ guardados; fallos en este lote: {len(fallos)} {dict(collections.Counter(fallos.values()))}; "
          f"tramos sin resultado: {len(falta)}")


def rehacer():
    falta = pendientes(cargar_tramos())
    anthropic, client = cliente()
    for t in falta:
        texto, r = directo(anthropic, client, t)
        if texto is None:
            print(f"✗ {t['id']}: {r}")
            continue
        guardar(t["id"], texto, uso_dict(r.usage), r.model)
        print(f"✓ {t['id']} ({r.model})")
    print(f"tramos sin resultado: {len(pendientes(cargar_tramos()))}")


# ── 3. el corpus ────────────────────────────────────────────────────────────
def encabezado(titulo):
    return f"### Bashar — {titulo} ###"


def coser(parrafos):
    """Un párrafo que arranca a media frase (minúscula o puntos suspensivos) continúa
    el anterior; pasa sobre todo en la costura entre dos tramos."""
    out = []
    for p in parrafos:
        limpio = re.sub(r"^(\.\.\.|…)\s*", "", p)
        if out and (limpio != p or limpio[:1].islower()):
            previo = re.sub(r"\s*(\.\.\.|…)$", "", out[-1])
            if limpio[:1].islower() and not re.search(r"[.!?»\"”)]$", previo):
                out[-1] = previo + " " + limpio
                continue
            p = limpio[:1].upper() + limpio[1:]
        out.append(p)
    return out


def cuerpo_sesion(k, tramos):
    partes = []
    for t in (x for x in tramos if x["sesion"] == k):
        texto = open(os.path.join(RESULTADOS, t["id"] + ".txt"), encoding="utf-8").read().strip()
        if texto == "(vacío)":
            continue
        # cada renglón es un párrafo (el indexador parte por línea en blanco)
        partes.extend(p.strip() for p in re.split(r"\n+", texto) if p.strip())
    return "\n\n".join(coser(partes))


def repartir(tamanos, grupos):
    """Partición contigua que minimiza el archivo más grande."""
    n = len(tamanos)
    pref = [0]
    for x in tamanos:
        pref.append(pref[-1] + x)
    INF = float("inf")
    mejor = [[INF] * (n + 1) for _ in range(grupos + 1)]
    corte = [[0] * (n + 1) for _ in range(grupos + 1)]
    mejor[0][0] = 0
    for g in range(1, grupos + 1):
        for i in range(g, n + 1):
            for j in range(g - 1, i):
                v = max(mejor[g - 1][j], pref[i] - pref[j])
                if v < mejor[g][i]:
                    mejor[g][i], corte[g][i] = v, j
    limites, i = [], n
    for g in range(grupos, 0, -1):
        limites.append((corte[g][i], i))
        i = corte[g][i]
    return list(reversed(limites))


def armar():
    tramos = cargar_tramos()
    falta = pendientes(tramos)
    if falta:
        die(f"faltan {len(falta)} tramos ({', '.join(t['id'] for t in falta[:6])}…): recoger o rehacer")
    secciones = [f"{encabezado(titulo)}\n\n{cuerpo_sesion(k, tramos)}\n" for k, (titulo, _) in enumerate(SESIONES, 1)]

    # 03: los libros tal cual + la primera sesión
    ruta03 = os.path.join(CORPUS, f"nucleo-extradimensional-{PRIMER_ARCHIVO:02d}.txt")
    actual = open(ruta03, encoding="utf-8").read()
    i = actual.find(encabezado(SESIONES[0][0]))
    if i < 0:
        die("no encuentro en el 03 el encabezado de la primera sesión")
    archivos = {PRIMER_ARCHIVO: actual[:i].rstrip("\n") + "\n\n" + secciones[0]}

    resto = secciones[1:]
    grupos = ULTIMO_ARCHIVO - PRIMER_ARCHIVO
    for g, (a, b) in enumerate(repartir([len(s) for s in resto], grupos)):
        archivos[PRIMER_ARCHIVO + 1 + g] = "\n".join(resto[a:b])
    for num, texto in sorted(archivos.items()):
        ruta = os.path.join(CORPUS, f"nucleo-extradimensional-{num:02d}.txt")
        with open(ruta, "w", encoding="utf-8") as f:
            f.write(texto)
        titulos = re.findall(r"^### Bashar — (.*) ###$", texto, flags=re.M)
        print(f"  {os.path.basename(ruta)}: {len(texto):,} caracteres · {' + '.join(titulos)}")
    print("✓ corpus armado")


ESPANOL_NO = re.compile(r"\b(tenés|podés|querés|sabés|sos|hacé|mirá|fijate|decime|poné|andá|sentí|escuchá|vos|acá)\b", re.I)
INGLES = re.compile(r"\b(the|and|you|that|is|of|to|in|it|what|this|your|are|we|have|be|for|not|with)\b", re.I)
PRIMERA = re.compile(r"\b(yo|me|mi|mis|conmigo|anoche|estoy|tengo|quiero|siento)\b", re.I)


def revisar():
    tramos = cargar_tramos()
    avisos = collections.Counter()
    for k, (titulo, _) in enumerate(SESIONES, 1):
        cuerpo = cuerpo_sesion(k, tramos)
        ingles = sum(len(t["texto"]) for t in tramos if t["sesion"] == k)
        parrafos = cuerpo.split("\n\n")
        en = [p for p in parrafos if len(INGLES.findall(p)) > 0.15 * max(1, len(p.split()))]
        preg = [p for p in parrafos if p.startswith("Pregunta:")]
        preg_yo = [p for p in preg if PRIMERA.search(p.split(":", 1)[1])]
        rayas = cuerpo.count("—")
        voseo = ESPANOL_NO.findall(cuerpo)
        restos = len(re.findall(r'"speaker"|"start"|SPEAKER_|\[Participante|\[Bashar\]|<tramo|contexto_previo', cuerpo))
        print(f"  {titulo}: {len(cuerpo):,} caracteres ({100 * len(cuerpo) / ingles:.0f}% del inglés) · "
              f"{len(preg)} preguntas · inglés {len(en)} · rayas {rayas} · voseo {len(voseo)} · restos {restos} · "
              f"preguntas con primera persona {len(preg_yo)}")
        for p in preg_yo[:2]:
            print("      ·", p[:160])
        for p in en[:2]:
            print("      EN", p[:160])
        avisos.update({"inglés": len(en), "rayas": rayas, "voseo": len(voseo), "restos": restos})
    usos = [json.load(open(os.path.join(RESULTADOS, f))) for f in os.listdir(RESULTADOS) if f.endswith(".json")]
    tok_in = sum(u["uso"]["input_tokens"] for u in usos)
    tok_out = sum(u["uso"]["output_tokens"] for u in usos)
    print(f"✓ {dict(avisos)} · {len(usos)} tramos · {tok_in:,} tokens de entrada y {tok_out:,} de salida")


if __name__ == "__main__":
    pasos = {"preparar": preparar, "probar": probar, "enviar": enviar, "recoger": recoger,
             "rehacer": rehacer, "armar": armar, "revisar": revisar}
    if len(sys.argv) < 2 or sys.argv[1] not in pasos:
        die("uso: python3 nucleo_extradimensional.py " + " | ".join(pasos))
    pasos[sys.argv[1]](*sys.argv[2:])
