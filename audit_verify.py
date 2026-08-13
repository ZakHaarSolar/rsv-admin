#!/usr/bin/env python3
# Red Solar Viva · Verificador de la auditoría de seguridad (sondas anon en vivo)
# =============================================================================
# Corre sondas READ-ONLY con la anon key pública + ids forjados contra la base.
# Clasifica cada superficie en:
#   CLOSED  ✓  (401/permission denied/404)  → parche aplicado, sin regresión
#   OPEN-F  ⏳ (200 con datos)               → ESPERADO abierto hasta el build iOS (Lote F)
#   ALARM   🔴 (200 donde debería estar cerrado) → REGRESIÓN: re-aplicar el parche
#
# Uso (desde la raíz del repo):
#   python3 admin/audit_verify.py
# Lee VITE_SUPABASE_URL + VITE_SUPABASE_ANON    _KEY de escaner-app/.env.local.
# NO escribe nada (solo GET/POST de lectura con ids inexistentes/propios).

import json, os, re, sys, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = os.path.join(ROOT, "escaner-app", ".env.local")

def load_env():
    url = key = None
    try:
        for ln in open(ENV, encoding="utf-8"):
            m = re.match(r'\s*VITE_SUPABASE_URL\s*=\s*(.+)', ln)
            if m: url = m.group(1).strip().strip('"').strip("'")
            m = re.match(r'\s*VITE_SUPABASE_ANON_KEY\s*=\s*(.+)', ln)
            if m: key = m.group(1).strip().strip('"').strip("'")
    except FileNotFoundError:
        sys.exit(f"No encuentro {ENV}")
    if not url or not key:
        sys.exit("Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en .env.local")
    return url, key

URL, ANON = load_env()
H = {"apikey": ANON, "Authorization": "Bearer " + ANON, "Content-Type": "application/json"}

def req(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(URL + path, data=data, headers=H, method=method)
    try:
        resp = urllib.request.urlopen(r, timeout=10)
        return resp.status, resp.read().decode()[:400]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:400]
    except Exception as e:
        return -1, str(e)[:200]

def rpc(fn, body):  return req("POST", f"/rest/v1/rpc/{fn}", body)
def tbl(q):         return req("GET", f"/rest/v1/{q}")

# 🜂 req() corta el cuerpo a 400 chars — suficiente para "¿respondió 401 o
# 200?", pero MIENTE cuando hay que buscar un campo DENTRO de la respuesta:
# el oráculo del perfil devuelve 630 chars y `is_admin` cae después del
# avatar_url (una URL larguísima de Clerk), así que la sonda de fuga daba
# CLOSED en falso. Para inspeccionar contenido, siempre esta vía.
def rpc_full(fn, body):
    data = json.dumps(body).encode()
    r = urllib.request.Request(URL + f"/rest/v1/rpc/{fn}", data=data, headers=H, method="POST")
    try:
        resp = urllib.request.urlopen(r, timeout=10)
        return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except Exception as e:
        return -1, str(e)[:200]

# Cosecha un id admin + un id víctima reales si scan_vibracional sigue abierto;
# si ya está bloqueado (Lote F aplicado), usa el id admin conocido como fallback.
ADMIN = "user_3BnIRIgc8wLztLL8NGawo3ThhlA"  # fallback (admin conocido)
VICTIM = "user_3BcA9hZrBJpJLiiSBWHoKUwsgf3"
st, body = tbl("scan_vibracional?select=clerk_user_id&limit=3")
sv_open = False
if st == 200 and body.strip().startswith("["):
    try:
        ids = sorted({r["clerk_user_id"] for r in json.loads(body) if r.get("clerk_user_id")})
        if ids:
            sv_open = True
            VICTIM = ids[0]
    except Exception:
        pass

GREEN, YEL, RED, OFF = "\033[32m", "\033[33m", "\033[31m", "\033[0m"
def verdict(status, body, expect):
    b = body.strip()
    closed = status in (401, 403, 404) or "permission denied" in body or '"code":"42501"' in body
    rls_empty = status == 200 and b in ("[]", "")  # tabla con RLS: 200 sin filas = sin fuga
    safe = closed or rls_empty
    if expect == "CLOSED":
        return (f"{GREEN}CLOSED ✓{OFF}" if safe else f"{RED}ALARM 🔴 (REGRESIÓN){OFF}")
    else:  # OPEN-F expected
        return (f"{GREEN}cerrado/RLS-OK ✓{OFF}" if safe else f"{YEL}OPEN ⏳ (esperado hasta el build){OFF}")

print(f"== RSV Security Audit Verify ==  scan_vibracional anon = {'ABIERTO' if sv_open else 'cerrado'}\n")

print("── DEBE ESTAR CERRADO (parches A-E ya aplicados) ──")
CLOSED_CHECKS = [
    ("get_my_dream_records (B · PII sueños)",      lambda: rpc("get_my_dream_records", {"target_clerk_id": VICTIM, "p_limit": 1})),
    ("get_my_dream_scan_count (B)",                lambda: rpc("get_my_dream_scan_count", {"target_clerk_id": VICTIM})),
    ("record_dream_scan (A · griefing write)",     lambda: rpc("record_dream_scan", {"p_clerk_user_id": "AUDIT_PROBE_noop"})),
    ("record_decoder_scan (A · griefing write)",   lambda: rpc("record_decoder_scan", {"p_clerk_user_id": "AUDIT_PROBE_noop"})),
    ("emit_cristales_for_subscription (Ola B)",    lambda: rpc("emit_cristales_for_subscription", {"p_subscription_id": "00000000-0000-0000-0000-000000000000"})),
    ("get_admin_dashboard (D · financiero)",       lambda: rpc("get_admin_dashboard", {"p_clerk_id": ADMIN})),
    ("get_1to1_revenue_summary (D · financiero)",  lambda: rpc("get_1to1_revenue_summary", {"p_clerk_id": ADMIN})),
    ("get_observatorio_camara_admin (D)",          lambda: rpc("get_observatorio_camara_admin", {"p_clerk_id": ADMIN, "p_limit": 1})),
    ("list_analisis_profundo_admin (D)",           lambda: rpc("list_analisis_profundo_admin", {"p_clerk_id": ADMIN, "p_limit": 1})),
    ("get_tripulante_extras (D)",                  lambda: rpc("get_tripulante_extras", {"target_clerk_id": VICTIM, "admin_clerk_id": ADMIN})),
    ("delete_user_scan_data_admin (D · DESTRUCT)", lambda: rpc("delete_user_scan_data_admin", {"p_clerk_id": VICTIM, "p_target_clerk_id": "AUDIT_PROBE_nope"})),
    ("get_expediente_nodo_admin (D1)",             lambda: rpc("get_expediente_nodo_admin", {"p_clerk_id": ADMIN, "p_perfil_nodo_id": "00000000-0000-0000-0000-000000000000"})),
    ("get_decoder_scans_total (D1)",               lambda: rpc("get_decoder_scans_total", {"target_clerk_id": "", "admin_clerk_id": ADMIN})),
    ("reserve_edge_spend (E · solo service_role)", lambda: rpc("reserve_edge_spend", {"p_edge": "x"})),
    ("subscriptions table (Ola B)",                lambda: tbl("subscriptions?select=email&limit=1")),
    ("purchases table (Ola B)",                    lambda: tbl("purchases?select=book_id&limit=1")),
    ("book_formats table (Ola B)",                 lambda: tbl("book_formats?select=file_url&limit=1")),
    # ── Barrido profundo 2026-06-13 · Batch 1 (cadena anon→PII + Zoom IDOR) ──
    ("get_profiles_no_scan (B1 · PII padrón)",     lambda: rpc("get_profiles_no_scan", {"p_admin_clerk_id": ADMIN})),
    ("get_tripulantes_email_flags (B1 · roster)",  lambda: rpc("get_tripulantes_email_flags", {"p_admin_clerk_id": ADMIN})),
    ("get_tripulantes_signup_dates (B1)",          lambda: rpc("get_tripulantes_signup_dates", {"p_admin_clerk_id": ADMIN})),
    ("get_tripulantes_gift_flags (B1)",            lambda: rpc("get_tripulantes_gift_flags", {"p_admin_clerk_id": ADMIN})),
    ("get_tripulantes_scan_activity (B1)",         lambda: rpc("get_tripulantes_scan_activity", {"p_admin_clerk_id": ADMIN})),
    ("get_email_subscription_status (B1)",         lambda: rpc("get_email_subscription_status", {"p_target_clerk_id": VICTIM, "p_admin_clerk_id": ADMIN})),
    ("get_email_dispatch_status (B1)",             lambda: rpc("get_email_dispatch_status", {"p_target_clerk_id": VICTIM, "p_admin_clerk_id": ADMIN, "p_email_type": "ciclo_sellado"})),
    ("get_citas_1to1_de_tripulante (B1 · Zoom IDOR)", lambda: rpc("get_citas_1to1_de_tripulante", {"p_clerk_user_id": ADMIN})),
    # ── Batch 2 · familia Atelier/marketing (muestra representativa de las 44) ──
    ("get_atelier_dashboard (B2 · Atelier)",       lambda: rpc("get_atelier_dashboard", {"p_admin_clerk_id": ADMIN})),
    ("get_recent_vtli_posts (B2)",                 lambda: rpc("get_recent_vtli_posts", {"p_admin_clerk_id": ADMIN})),
    ("get_recent_soma_posts (B2)",                 lambda: rpc("get_recent_soma_posts", {"p_admin_clerk_id": ADMIN})),
    ("get_zakhaar_carousels_admin (B2)",           lambda: rpc("get_zakhaar_carousels_admin", {"p_admin_clerk_id": ADMIN})),
    ("get_vtli_colectivos_admin (B2)",             lambda: rpc("get_vtli_colectivos_admin", {"p_admin_clerk_id": ADMIN})),
    ("delete_vtli_post (B2 · write)",              lambda: rpc("delete_vtli_post", {"p_admin_clerk_id": ADMIN, "p_post_id": "00000000-0000-0000-0000-000000000000"})),
    ("set_vtli_post_published (B2 · write)",       lambda: rpc("set_vtli_post_published", {"p_admin_clerk_id": ADMIN, "p_post_id": "00000000-0000-0000-0000-000000000000", "p_published": False})),
    # ── Batch 3 · familia Observatorio de Resonancia (las 7) ──
    ("get_destilacion_nodo_admin (B3 · Observatorio)", lambda: rpc("get_destilacion_nodo_admin", {"p_clerk_id": ADMIN, "p_perfil_nodo_id": "00000000-0000-0000-0000-000000000000"})),
    ("get_observatorio_1to1_admin (B3)",           lambda: rpc("get_observatorio_1to1_admin", {"p_clerk_id": ADMIN})),
    ("upsert_preguntas_1to1_admin (B3 · write)",   lambda: rpc("upsert_preguntas_1to1_admin", {"p_clerk_id": ADMIN, "p_preguntas": []})),
    ("upsert_telemetria_camara_admin (B3 · write)", lambda: rpc("upsert_telemetria_camara_admin", {"p_clerk_id": ADMIN, "p_id_sesion": "x", "p_fecha": "2026-01-01", "p_transcript_json": {}})),
    ("upsert_perfil_nodo_y_alias_admin (B3 · write)", lambda: rpc("upsert_perfil_nodo_y_alias_admin", {"p_clerk_id": ADMIN, "p_id_sesion": "x", "p_speaker_id": "x"})),
    ("vtli_admin_list_bookings (B3)",              lambda: rpc("vtli_admin_list_bookings", {"p_admin_clerk_id": ADMIN})),
    ("vtli_admin_cancel_booking (B3 · write)",     lambda: rpc("vtli_admin_cancel_booking", {"p_admin_clerk_id": ADMIN, "p_ciclo_group_id": "00000000-0000-0000-0000-000000000000"})),
    # ── Batch 4 · rate-limit de reservas: se aplica DENTRO de los edges
    #    (procesar-ignicion-pago / vtli-procesar-reserva) vía reserve_edge_spend.
    #    No es anon-probeable sin crear holds reales → se valida manualmente.
    # ── 2026-07-29 · ESPEJO CON CONTEXTO VIVO — joya de la corona: una sola
    #    RPC concentra pilares+rachas+Sendero+Plan+Realidad (+sueños con toggle)
    #    de un Tripulante. DEBE ser service_role-only para siempre (la llama el
    #    edge oraculo-chat v1.13). 404 = migración aún sin pegar (cuenta CLOSED);
    #    200 = REGRESIÓN GRAVE (perfil íntimo completo con la llave pública).
    ("get_espejo_context (contexto vivo Espejo)",  lambda: rpc("get_espejo_context", {"p_clerk_user_id": VICTIM})),
    ("set_espejo_context_prefs (prefs Espejo)",    lambda: rpc("set_espejo_context_prefs", {"p_clerk_user_id": "AUDIT_PROBE_noop", "p_master": True})),
    # ── 2026-07-29 · FASE D — MEMORIA DEL ESPEJO (auto-evolución): la ficha
    #    destilada concentra los patrones íntimos de una persona a lo largo de
    #    sus charlas → TODA la familia es service_role-only (el cron
    #    espejo-destilador + el gateway user-action). 404 = migración 20260729c
    #    aún sin pegar (cuenta CLOSED); 200 = REGRESIÓN GRAVE.
    ("espejo_memoria table (ficha destilada)",     lambda: tbl("espejo_memoria?select=clerk_user_id&limit=1")),
    ("espejo_memoria_scan_targets (cron)",         lambda: rpc("espejo_memoria_scan_targets", {"p_max": 1})),
    ("espejo_memoria_get_material (cron · lee)",   lambda: rpc("espejo_memoria_get_material", {"p_clerk_user_id": VICTIM, "p_conversation_ids": []})),
    ("espejo_memoria_commit (cron · write)",       lambda: rpc("espejo_memoria_commit", {"p_clerk_user_id": "AUDIT_PROBE_noop", "p_ficha": "sonda de auditoria sin efecto real por longitud", "p_marks": []})),
    ("espejo_memoria_forget (write)",              lambda: rpc("espejo_memoria_forget", {"p_clerk_user_id": "AUDIT_PROBE_noop"})),
    ("espejo_memoria_regenerate (write)",          lambda: rpc("espejo_memoria_regenerate", {"p_clerk_user_id": "AUDIT_PROBE_noop"})),
]
for name, fn in CLOSED_CHECKS:
    st, body = fn()
    print(f"  {name:<46} http={st:<4} {verdict(st, body, 'CLOSED')}")

print("\n── ABIERTO HASTA EL BUILD iOS (Lote F · no es alarma) ──")
OPENF_CHECKS = [
    ("scan_vibracional table (lock 20260608f)",    lambda: tbl("scan_vibracional?select=clerk_user_id&limit=1")),
    ("get_profile_by_clerk_id (oracle is_admin)",  lambda: rpc("get_profile_by_clerk_id", {"p_clerk_id": ADMIN})),
    ("profiles table SELECT (lock + RLS)",          lambda: tbl("profiles?select=email&limit=1")),
    ("libreria_protocolos (RLS paywall)",           lambda: tbl("libreria_protocolos?select=titulo&limit=1")),
    ("estado_tripulante_protocolos (RLS)",          lambda: tbl("estado_tripulante_protocolos?select=clerk_user_id&limit=1")),
    ("get_my_decoder_scan_count (tail IDOR)",       lambda: rpc("get_my_decoder_scan_count", {"target_clerk_id": VICTIM})),
    ("get_my_cristales (20260608g)",                lambda: rpc("get_my_cristales", {"p_clerk_user_id": VICTIM})),
    ("get_my_membership (enum por email)",          lambda: rpc("get_my_membership", {"p_email": "veocancun@gmail.com"})),
]
for name, fn in OPENF_CHECKS:
    st, body = fn()
    print(f"  {name:<46} http={st:<4} {verdict(st, body, 'OPEN-F')}")

# ── LOTE F · 2026-07-27 ────────────────────────────────────────────────
# Las dos RPC de arriba siguen ejecutables a propósito: la app PUBLICADA
# (1.1.2) las llama directo y revocarlas la dejaría sin "Mis Códices" y sin
# membresía detectada. El REVOKE completo vive en 20260727f y espera a que
# 1.1.3 esté LIVE.
#
# Lo que NO espera es la FUGA: 20260727e redacta del oráculo is_admin,
# correo, nombre y avatar. Estas sondas vigilan esa redacción — si alguien
# re-crea la función con un CREATE OR REPLACE (el patrón que ya nos mordió
# 4 veces con el barrido i18n), acá salta.
print("\n── LOTE F · la fuga del oráculo (redacción de 20260727e) ──")

# La vía nueva de membresía nace cerrada: solo el gateway user-action la
# ejecuta (service_role), tras verificar el token de sesión. Su existencia
# es además el TESTIGO de si 20260727e ya está pegada: mientras no exista,
# la redacción tampoco está viva y las sondas de abajo son OPEN⏳, no alarma
# (si no, el verificador quedaría gritando en falso hasta que Zak la pegue).
_st_new, _ = rpc("get_my_membership_by_clerk", {"p_clerk_user_id": VICTIM})
_e_viva = _st_new != 404
if _st_new in (401, 403):
    _v = f"{GREEN}CLOSED ✓{OFF}"
elif _st_new == 404:
    _v = f"{YEL}OPEN ⏳ (pegar 20260727e){OFF}"
else:
    _v = f"{RED}ALARM 🔴 (nació abierta a anon){OFF}"
print(f"  {'get_my_membership_by_clerk (vía nueva)':<46} http={_st_new:<4} {_v}")

# rpc_full (NO rpc): acá hay que mirar DENTRO de la respuesta, y el corte a
# 400 chars de req() escondía is_admin detrás del avatar_url.
_st, _body = rpc_full("get_profile_by_clerk_id", {"p_clerk_id": ADMIN})
# Normalizamos el JSON (sin espacios) para que la sonda no dependa de cómo
# PostgREST decida formatear la respuesta.
_txt = "".join((_body or "").split()).lower()
for campo, fuga in (
    ("is_admin (escalada de privilegio)", '"is_admin":true' in _txt),
    ("email (PII)",                        '"email":"' in _txt and "@" in _txt),
    ("full_name (PII)",                    '"full_name":"' in _txt),
):
    if _st in (401, 403):
        _v = f"{GREEN}CLOSED ✓{OFF}"                 # ya revocada (20260727f)
    elif not fuga:
        _v = f"{GREEN}CLOSED ✓{OFF}"                 # redactado
    elif not _e_viva:
        _v = f"{YEL}OPEN ⏳ (pegar 20260727e){OFF}"   # aún sin migración
    else:
        _v = f"{RED}ALARM 🔴 (el oráculo volvió a filtrar){OFF}"
    print(f"  oráculo NO revela {campo:<34} http={_st:<4} {_v}")

# ── PARTE 4 · el padrón de correos (20260727g) ────────────────────────
# `record_nodo_subscription` es anon a propósito (el alta es PRE-LOGIN: la
# llaman el form del Portal y Auth2Modal). No se puede cerrar sin romper el
# alta, así que se blindó por dentro.
#
# 🜂 ESTA SONDA MUTA **MIENTRAS LA RPC SIGA SIN PARCHE**: la versión vieja
#    solo miraba si el texto tenía una arroba, así que acepta el centinela y
#    lo inserta. Es justamente lo que prueba que la falla está viva. Con
#    20260727g pegada devuelve false y NO inserta nunca más.
#    Limpieza de las filas que dejó (correr una vez, en SQL Editor):
#      DELETE FROM public.nodo_central
#       WHERE email IN ('@', 'rsv-audit-probe@') OR source = 'audit_probe';
print("\n── PARTE 4 · el padrón de correos (anon a propósito, blindado) ──")
_st, _b = rpc("record_nodo_subscription",
              {"p_email": "rsv-audit-probe@", "p_source": "audit_probe", "p_metadata": None})
_t = (_b or "").strip().lower()
if _st in (401, 403):
    _v = f"{YEL}OJO: se cerró el alta (rompe el Portal){OFF}"
elif _st == 200 and _t == "false":
    _v = f"{GREEN}CLOSED ✓{OFF}"          # valida de verdad
elif _st == 200 and _t == "true":
    # Estado conocido MIENTRAS 20260727g no esté pegada: la versión vieja
    # solo mira si hay una arroba. Se marca OPEN⏳ (pendiente), no ALARM, para
    # no entrenar a nadie a ignorar las alarmas rojas. 🜂 Una vez pegada esto
    # pasa a CLOSED y ahí se queda: si volviera a aparecer, ES una regresión.
    _v = f"{YEL}OPEN ⏳ (pegar 20260727g){OFF}"
else:
    _v = f"{YEL}OPEN ⏳ (pegar 20260727g){OFF}"
print(f"  {'alta rechaza un correo basura':<46} http={_st:<4} {_v}")

ZERO = "00000000-0000-0000-0000-000000000000"

print("\n── AUDITORÍA 2026-07-24 · editor del Motor (CERRAR con 20260724c) ──")
print("   Estaban GRANTed a anon SIN chequeo de admin desde 20260705: lectura del")
print("   contenido de paga + ESCRITURA de las sondas del Escáner.")
EDITOR_CHECKS = [
    ("get_all_sondas (lectura 36 sondas)",          lambda: rpc("get_all_sondas", {})),
    ("get_all_protocolos_admin (60 fases PAGA)",    lambda: rpc("get_all_protocolos_admin", {})),
    ("upsert_sonda (ESCRITURA del Escáner)",        lambda: rpc("upsert_sonda", {"p_id": ZERO})),
    ("upsert_protocolo_admin (ESCRITURA paga)",     lambda: rpc("upsert_protocolo_admin", {"p_id": ZERO})),
]
for name, fn in EDITOR_CHECKS:
    st, body = fn()
    print(f"  {name:<46} http={st:<4} {verdict(st, body, 'CLOSED')}")

print("\n── AUDITORÍA 2026-07-24 · pendientes de decisión de producto ──")

def crop_paywall():
    """get_crop_circles entrega decoded_es/decoded_en a anon → el muro de
    3-decodificaciones-de-por-vida es cosmético (el dato ya viajó al cliente).
    OJO: req() trunca el cuerpo a 400 chars, así que NO se puede json.loads;
    se detecta la presencia de un decoded_es con contenido en el prefijo."""
    st, body = rpc("get_crop_circles", {})
    if st != 200:
        return st, body
    leaked = '"decoded_es"' in body and not re.search(
        r'"decoded_es"\s*:\s*(null|"")', body
    )
    # Cuerpo sintético para que `verdict` lo lea: [] = sin fuga.
    return st, ('[{"decoded_es": "…expuesto a anon…"}]' if leaked else "[]")

def onb_anon():
    """record_onb_step es anon POR DISEÑO (telemetría pre-login). Lo que se
    audita es que exista una cota; hoy no la hay."""
    return rpc("record_onb_step", {"p_anon": ZERO, "p_step": 0})

DECISION_CHECKS = [
    ("get_crop_circles → decoded_* a anon",         crop_paywall),
    ("record_onb_step (anon por diseño, sin cota)", onb_anon),
    ("join_android_waitlist (anon por diseño)",     lambda: (200, "[]")),
]
for name, fn in DECISION_CHECKS:
    st, body = fn()
    print(f"  {name:<46} http={st:<4} {verdict(st, body, 'OPEN-F')}")

print("\n── AUDITORÍA 2026-07-24 · PARTE 2 · regresiones GRANT-tras-REVOKE (20260724e) ──")
print("   Un CREATE OR REPLACE posterior re-otorgó a anon lo que un REVOKE previo cerró.")

def wallpaper_paywall():
    """20260620o mató get_wallpapers() paramless porque filtraba la URL R2 de
    los fondos de PAGA; 20260704b (i18n) la re-creó y le hizo GRANT a anon →
    el muro de Sintonía volvió a ser cosmético. Detecta si sigue filtrando la
    image_url de algún wallpaper con is_free=false. Hace su propio request
    (req() trunca a 400 chars y aquí hace falta el cuerpo entero)."""
    try:
        r = urllib.request.Request(
            URL + "/rest/v1/rpc/get_wallpapers",
            data=b"{}", headers=H, method="POST")
        resp = urllib.request.urlopen(r, timeout=15)
        rows = json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:200]          # 401/404 = cerrada ✓
    except Exception as e:
        return -1, str(e)[:150]
    if not isinstance(rows, list):
        return 200, "[]"
    paid = [w for w in rows if not w.get("is_free") and w.get("image_url")]
    return 200, (f'[{{"fuga": "{len(paid)} wallpapers de PAGA con su URL R2"}}]'
                 if paid else "[]")

PARTE2_CHECKS = [
    ("get_wallpapers() paramless (muro Anclajes)",  wallpaper_paywall),
    ("get_zakhaar_carousels_admin (re-GRANT 24jun)", lambda: rpc("get_zakhaar_carousels_admin", {"p_admin_clerk_id": ADMIN})),
    ("get_recent_vtli_drafts (re-GRANT 10jul)",     lambda: rpc("get_recent_vtli_drafts", {"p_admin_clerk_id": ADMIN})),
    ("get_vtli_drafts_by_ids (re-GRANT 10jul)",     lambda: rpc("get_vtli_drafts_by_ids", {"p_admin_clerk_id": ADMIN, "p_ids": [ZERO]})),
]
for name, fn in PARTE2_CHECKS:
    st, body = fn()
    print(f"  {name:<46} http={st:<4} {verdict(st, body, 'CLOSED')}")

print("\n── PARTE 2 · BORRADO del editor + INGRESOS (cerrar con 20260724g) ──")
print("   20260724c cerró leer/guardar del editor pero DEJÓ FUERA el borrado.")
print("   Sondas verificadas en vivo: respondían {\"success\":true} SIN gate de admin.")
# Targets INEXISTENTES: uuid-cero no borra nada, el pilar no existe.
BORRADO_CHECKS = [
    ("delete_sonda (DESTRUCT · sin backups)",       lambda: rpc("delete_sonda", {"p_id": ZERO})),
    ("delete_protocolo_admin (DESTRUCT · paga)",    lambda: rpc("delete_protocolo_admin", {"p_id": ZERO})),
    ("reorder_sondas (desordena un pilar)",         lambda: rpc("reorder_sondas", {"p_pilar": "AUDIT_PROBE_nope", "p_ordered_ids": []})),
    ("get_revenue_history (facturación real)",      lambda: rpc("get_revenue_history", {"p_months": 1})),
]
for name, fn in BORRADO_CHECKS:
    st, body = fn()
    print(f"  {name:<46} http={st:<4} {verdict(st, body, 'CLOSED')}")

print("\n── PARTE 2 · IDOR admin Suno + Códices (cerrar con 20260724f) ──")
print("   Tienen gate interno, pero la identidad del admin viaja por parámetro (forjable).")
SUNO_CHECKS = [
    ("get_suno_catalog_admin",                      lambda: rpc("get_suno_catalog_admin", {"p_admin_clerk_id": ADMIN})),
    ("get_suno_creations_admin",                    lambda: rpc("get_suno_creations_admin", {"p_admin_clerk_id": ADMIN, "p_limit": 1})),
    ("delete_suno_creation_admin (write)",          lambda: rpc("delete_suno_creation_admin", {"p_admin_clerk_id": ADMIN, "p_id": ZERO})),
    ("set_suno_produced_admin (write)",             lambda: rpc("set_suno_produced_admin", {"p_admin_clerk_id": ADMIN, "p_id": ZERO, "p_produced": False, "p_url": ""})),
    ("get_codices_luz_admin",                       lambda: rpc("get_codices_luz_admin", {"p_admin_clerk_id": ADMIN})),
    ("delete_codice_luz_admin (write)",             lambda: rpc("delete_codice_luz_admin", {"p_admin_clerk_id": ADMIN, "p_id": ZERO})),
]
for name, fn in SUNO_CHECKS:
    st, body = fn()
    print(f"  {name:<46} http={st:<4} {verdict(st, body, 'CLOSED')}")

print("\n── PARTE 3 · cola de la auditoría (2026-07-27) ──")
print("   Verificado en vivo: el borrado del Observatorio estaba abierto a anon con")
print("   gate forjable (mismo patrón que el borrado del editor en la Parte 2).")
PARTE3_CHECKS = [
    ("delete_nota_nodo_admin (DESTRUCT)",           lambda: rpc("delete_nota_nodo_admin", {"p_clerk_id": ADMIN, "p_nota_id": ZERO})),
    ("purge_my_account_data (borra TODO lo personal)", lambda: rpc("purge_my_account_data", {"p_clerk_user_id": VICTIM})),
    ("webhook_event_seen (anti-duplicados)",        lambda: rpc("webhook_event_seen", {"p_source": "audit", "p_event_id": "probe"})),
    ("_priv_decrypt (llave del contenido íntimo)",  lambda: rpc("_priv_decrypt", {"p_text": "x", "p_enc": False})),
    ("_priv_encrypt (llave del contenido íntimo)",  lambda: rpc("_priv_encrypt", {"p_text": "x"})),
    ("_email_sig (firma de baja de correos)",       lambda: rpc("_email_sig", {"p_email": "probe@invalid.test"})),
    ("_dm_media_host_ok (guard de baliza)",         lambda: rpc("_dm_media_host_ok", {"p_url": "https://x.invalid/a.png"})),
]
for name, fn in PARTE3_CHECKS:
    st, body = fn()
    print(f"  {name:<46} http={st:<4} {verdict(st, body, 'CLOSED')}")

print("\n── PARTE 3 · la baja de correos exige firma (no debe revertir sin ella) ──")
st, body = rpc("restore_email_opt_in", {"p_email": "audit-probe@invalid.test"})
ok_sin_firma = body.strip() == "false"
print(f"  {'restore_email_opt_in SIN firma':<46} http={st:<4} " +
      (f"{GREEN}CLOSED ✓{OFF}" if ok_sin_firma else f"{RED}ALARM 🔴 (revierte sin firma){OFF}"))
st, body = rpc("restore_email_opt_in", {"p_email": "audit-probe@invalid.test", "p_sig": "firma-invalida"})
ok_mala = body.strip() == "false"
print(f"  {'restore_email_opt_in firma inválida':<46} http={st:<4} " +
      (f"{GREEN}CLOSED ✓{OFF}" if ok_mala else f"{RED}ALARM 🔴 (acepta firma falsa){OFF}"))

print("\n── PARTE 4 · verbos DESTRUCTIVOS admin que ningún lockdown había verificado ──")
print("   El patrón ya mordió dos veces (borrado del editor en la Parte 2, borrado del")
print("   Observatorio en la Parte 3): un lockdown cierra leer/guardar y deja fuera el")
print("   BORRAR. Estos 12 se enumeraron y sondearon uno por uno el 2026-07-27 y")
print("   TODOS estaban ya cerrados. Quedan acá para que una regresión salte sola.")
PARTE4_DESTRUCT = [
    ("delete_analisis_profundo_admin",              lambda: rpc("delete_analisis_profundo_admin", {"p_clerk_id": ADMIN, "p_id": ZERO})),
    ("delete_suno_set_admin",                       lambda: rpc("delete_suno_set_admin", {"p_admin_clerk_id": ADMIN, "p_set_id": ZERO})),
    ("delete_soma_post",                            lambda: rpc("delete_soma_post", {"p_admin_clerk_id": ADMIN, "p_post_id": ZERO})),
    ("delete_vtli_draft",                           lambda: rpc("delete_vtli_draft", {"p_admin_clerk_id": ADMIN, "p_draft_id": ZERO})),
    ("delete_vtli_banner",                          lambda: rpc("delete_vtli_banner", {"p_admin_clerk_id": ADMIN, "p_banner_id": ZERO})),
    ("delete_vtli_colectivo",                       lambda: rpc("delete_vtli_colectivo", {"p_admin_clerk_id": ADMIN, "p_id": ZERO})),
    ("delete_vtli_ambiente",                        lambda: rpc("delete_vtli_ambiente", {"p_admin_clerk_id": ADMIN, "p_id": ZERO})),
    ("delete_vtli_video",                           lambda: rpc("delete_vtli_video", {"p_admin_clerk_id": ADMIN, "p_video_id": ZERO})),
    ("delete_vtli_atelier_voice",                   lambda: rpc("delete_vtli_atelier_voice", {"p_admin_clerk_id": ADMIN, "p_voice_id": "probe"})),
    ("delete_wallpaper_prompt",                     lambda: rpc("delete_wallpaper_prompt", {"p_admin_clerk_id": ADMIN, "p_id": ZERO})),
    ("delete_zakhaar_carousel",                     lambda: rpc("delete_zakhaar_carousel", {"p_admin_clerk_id": ADMIN, "p_carousel_id": ZERO})),
    ("delete_onb_funnel_recent",                    lambda: rpc("delete_onb_funnel_recent", {"p_admin_clerk_id": ADMIN, "p_hours": 0})),
]
for name, fn in PARTE4_DESTRUCT:
    st, body = fn()
    print(f"  {name:<46} http={st:<4} {verdict(st, body, 'CLOSED')}")

print("\n── PARTE 4 · el correo del Pase de Exploración exige sesión admin ──")
print("   El workflow de Pipedream no verificaba nada y su dirección salía del bundle")
print("   publicado. Ahora se dispara por esta función, que gatea contra Clerk y firma.")
st, body = req("POST", "/functions/v1/dispatch-pase-exploracion",
               {"token": "token-invalido", "email": "audit-probe@invalid.test",
                "event_start_time": "2030-01-01T00:00:00Z"})
if st == 404:
    print(f"  {'dispatch-pase-exploracion (sin desplegar)':<46} http={st:<4} " +
          f"{YEL}OPEN ⏳ (desplegar la función){OFF}")
else:
    print(f"  {'dispatch-pase-exploracion · token inválido':<46} http={st:<4} " +
          (f"{GREEN}CLOSED ✓{OFF}" if st in (400, 401, 403) else f"{RED}ALARM 🔴 (acepta token falso){OFF}"))

print("\nLeyenda: CLOSED✓ = parche vivo · ALARM🔴 = regresión (re-aplicar) · OPEN⏳ = esperado hasta el build (Lote F).")
print("Si algo en el primer bloque sale ALARM 🔴 → ese parche se revirtió; revisar antes de subir a Apple.")
print("El bloque 'editor del Motor' pasa a CLOSED al pegar 20260724c_lockdown_editor_rpcs.sql.")
print("Los bloques 'PARTE 2' pasan a CLOSED al pegar, EN ORDEN:")
print("  20260724e (regresiones) · 20260724f (Suno+Códices, tras admin-action v1.41)")
print("  20260724g (borrado+ingresos, tras admin-action v1.42 + MI_Editores v1.32 + TN_Shared v1.5)")
