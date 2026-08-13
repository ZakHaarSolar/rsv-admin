// AT_ZakHaarCarrusel.tsx v1.9 — ARQUITECTURA DE DIÁLOGO ASCENDENTE: las tarjetas del Manga Diálogo reflejan la mecánica de 3 fases (premisa contemplativa → analogía física → axioma). Travesía se redefine "De la pregunta al axioma" (ya no herida→luz; el drama quedó prohibido en el motor) y Coherencia Pura co-construye la analogía entre pares. Pareja de generate-zakhaar-carousel v1.15.
// v1.8 — CÓDICES DE LUZ: nueva FUENTE del carrusel. Eliges "Pulso de Sexta Densidad" (lo de siempre) o "Códice de Luz" → un libro tuyo destilado. Grid de libros (sub-categorías) + "+ Agregar Códice" que pega el texto completo y lo destila (edge distill-codice). El carrusel sale de UNA enseñanza del libro, fiel a tu voz. Manda codice_id al edge; pill del libro en la galería. Pareja de generate-zakhaar-carousel v1.14 + distill-codice v1.0 + migración 20260624_codices_luz.sql.
// v1.7 — Manga Diálogo ahora tiene SELECTOR DE MODO NARRATIVO (sub-tarjeta que solo aparece al elegir Manga Diálogo): "Travesía" (arco emocional herida→luz, el actual, default) y "Coherencia Pura" (seres ya en su centro, sin dolor ni rescate; emisiones de coherencia). Manda dialogo_mode al edge; pill del modo en cada tarjeta de la galería. Pareja del edge generate-zakhaar-carousel v1.10 + migración 20260623_zakhaar_dialogo_mode.sql.
// v1.6 — Portada manual por carrusel (caja "+ Portada" en cada tarjeta → sube a R2 vía edge upload-vtli-draft-cover con target carousel) para identificar visualmente cada carrusel publicado; timeout de cliente 130s→175s (el Manga Diálogo genera más texto).
// v1.5 — Nuevo estilo "Manga Diálogo" (cómic con personajes que conversan) en el selector; desc del Manga Astral actualizada (cierra con invitación al Escáner); strip de comillas angulares («») al mostrar/copiar para carruseles viejos.
// v1.4 — RPC admin por gateway admin-action (cierra IDOR Atelier, barrido 2026-06-13)
// v1.3 — Ola C #3: callEdge manda el token de Clerk verificado en cada llamada.
// v1.2 — Estilos: fuera "Códice de Silicio" y "Tablilla Solar". Quedan
//        "Vitral Cuántico" + el nuevo "Manga Astral" (ilustración espiritual
//        narrativa con texto sobre la imagen). Default = Manga Astral. Grid de
//        estilos a auto-fit. Pareja del edge generate-zakhaar-carousel v1.2.
// v1.1 — Anti-cuelgue + descripción. (a) handleGenerate ahora tiene
//        try/catch/finally + timeout de cliente (130s): el botón NUNCA queda
//        colgado en "Generando…"; si falla o tarda, avisa y recarga la lista.
//        (b) La caja de caption se rotula "Descripción para Instagram" (es el
//        texto del post). Pareja del edge generate-zakhaar-carousel v1.1.
// v1.0 — MOTOR DE CARRUSELES Zak'Haar (pestaña "Zak'Haar Posts" del Atelier).
//        Genera carruseles de Instagram de 5 a 8 slides en uno de 3 ESTILOS
//        únicos de marca (Códice de Silicio · Tablilla Solar · Vitral Cuántico),
//        en modo SOLO PROMPTS ($0): cada slide trae su prompt listo para
//        copiar/pegar en Nano Banana. La NOTA DE REFERENCIA (qué slide previo
//        subir para conservar el mismo ser) viaja APARTE, dirigida a Zak — nunca
//        dentro del prompt de Nano Banana. Pareja del edge generate-zakhaar-carousel
//        v1.0 + migración 20260606_zakhaar_carruseles.sql. Tema claro VTLI.

import { useState, useEffect, useCallback, useRef } from "react"

// ── Paleta TEMA CLARO "VTLI" (igual que el resto del Atelier) ──
const INK = "#2E333C"
const INK2 = "#4A515B"
const MUTE = "#7A828C"
const MUTE2 = "#6B7480"
const GOLD = "#A9781F"
const GOLD_DK = "#8A6418"
const BLUE = "#3F6E96"

interface Props {
    supabaseUrl?: string
    supabaseAnonKey?: string
    clerkUserId?: string
    isMobile?: boolean
}

interface StyleOpt {
    key: string
    name: string
    tag: string
    glyph: string
    desc: string
}

// Los 3 estilos de marca (espejo del edge generate-zakhaar-carousel).
const STYLE_OPTS: StyleOpt[] = [
    {
        key: "manga",
        name: "Manga Astral",
        tag: "Frases · texto sobre la imagen",
        glyph: "☄",
        desc: "Escenas ilustradas estilo manga cósmico de alta vibración que narran el despertar, con UNA frase-enseñanza encima de cada imagen. Azul/púrpura/cian/magenta luminoso. Cierra con la invitación a descargar el Escáner Vibracional.",
    },
    {
        key: "manga_dialogo",
        name: "Manga Diálogo",
        tag: "Cómic espiritual · personajes que conversan",
        glyph: "✺",
        desc: "Una conversación ilustrada entre personajes MUY variados (humanos, seres estelares, animales-guía…) que avanza como un manga, en globos de cómic. Arquitectura de 3 fases: pregunta semilla → UNA analogía física simple → axioma que expande la mente. Elige abajo el modo narrativo. Cierra con la invitación a descargar el Escáner Vibracional.",
    },
    {
        key: "vitral",
        name: "Vitral Cuántico",
        tag: "Vitral holográfico",
        glyph: "❖",
        desc: "Ilustración ornamental de vitral de luz viva: mandalas, refracciones prismáticas, cian/oro/violeta. Onírico, ceremonial, poético.",
    },
]

// ── Modos narrativos del estilo "Manga Diálogo" (espejo del edge). ──
interface DialogoModeOpt {
    key: string
    name: string
    subtitle: string
    glyph: string
    desc: string
}
const DIALOGO_MODE_OPTS: DialogoModeOpt[] = [
    {
        key: "travesia",
        name: "Travesía",
        subtitle: "De la pregunta al axioma",
        glyph: "❂",
        desc: "El que Pregunta abre con una premisa contemplativa (pura curiosidad, jamás queja) y El que Revela responde con UNA analogía física simple (óptica, resonancia, semillas…). Quien preguntó colapsa la certeza en un axioma corto.",
    },
    {
        key: "coherencia",
        name: "Coherencia Pura",
        subtitle: "Comunión entre seres en su centro",
        glyph: "✶",
        desc: "Dos seres ya completos despliegan una verdad juntos: la analogía física se construye a dos voces, de mano en mano, y el axioma cae sereno. Sin dolor, sin miedo, sin rescate — asombro compartido que irradia.",
    },
]

function dialogoModeOptByKey(k: string | null | undefined): DialogoModeOpt | null {
    if (!k) return null
    return DIALOGO_MODE_OPTS.find((m) => m.key === k) ?? null
}

const SLIDE_COUNTS = [5, 6, 7, 8]

interface Slide {
    id: string
    slide_index: number
    slide_label: string
    copy_line: string | null
    prompt_image: string
    director_note: string | null
    image_r2_url: string | null
}

interface Carousel {
    id: string
    style_key: string
    dialogo_mode: string | null
    codice_id: string | null
    slides_count: number
    concept_title: string
    narrative: string
    caption: string
    hashtags: string[]
    pulso_nucleo: string | null
    status: string
    is_published: boolean
    generated_at: string
    cover_image_url: string | null
    slides: Slide[]
}

interface Codice {
    id: string
    title: string
    author: string
    ensenanzas_count: number
    generated_at: string
}

/* ═══════════════════════════════════════════════════════════════
   Helpers REST
   ═══════════════════════════════════════════════════════════════ */

async function rpc(
    url: string,
    key: string,
    fn: string,
    params: Record<string, any> = {}
) {
    if (!url || !key) return null
    try {
        // Familia admin del Atelier por gateway admin-action (token verificado;
        // el server inyecta el id admin, descarta el del body). Fallback
        // transitorio a la llamada directa hasta el REVOKE.
        const token = await (window as any).Clerk?.session?.getToken?.()
        if (token) {
            const g = await fetch(`${url}/functions/v1/admin-action`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: key,
                    Authorization: `Bearer ${key}`,
                },
                body: JSON.stringify({ token, action: fn, params }),
            })
            if (g.ok) return await g.json()
        }
        const r = await fetch(`${url}/rest/v1/rpc/${fn}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: key,
                Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify(params),
        })
        return r.ok ? await r.json() : null
    } catch {
        return null
    }
}

async function callEdge(
    url: string,
    key: string,
    fn: string,
    payload: Record<string, any>,
    signal?: AbortSignal
) {
    const r = await fetch(`${url}/functions/v1/${fn}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            apikey: key,
            Authorization: `Bearer ${key}`,
        },
        // Ola C #3: token de sesión de Clerk verificado server-side por el edge.
        body: JSON.stringify({
            ...payload,
            token: await (window as any).Clerk?.session?.getToken?.(),
        }),
        signal,
    })
    let body: any = null
    try {
        body = await r.json()
    } catch {}
    return { ok: r.ok, status: r.status, body }
}

function styleOptByKey(k: string): StyleOpt {
    return STYLE_OPTS.find((s) => s.key === k) ?? STYLE_OPTS[0]
}

// Quita las comillas angulares (« ») al mostrar/copiar — el motor nuevo ya las
// limpia, esto cubre carruseles viejos que las tengan guardadas.
function noGuillemets(s: string | null | undefined): string {
    return (s ?? "").replace(/[«»]/g, "")
}

// Reduce + convierte una imagen a base64 JPEG para subir la portada del carrusel.
function resizeImageToBase64(
    file: File,
    maxSide = 800
): Promise<{ base64: string; mime: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(new Error("No se pudo leer el archivo"))
        reader.onload = () => {
            const img = new Image()
            img.onerror = () => reject(new Error("No se pudo cargar la imagen"))
            img.onload = () => {
                let w = img.naturalWidth || img.width
                let h = img.naturalHeight || img.height
                const scale = Math.min(1, maxSide / Math.max(w, h))
                w = Math.max(1, Math.round(w * scale))
                h = Math.max(1, Math.round(h * scale))
                const canvas = document.createElement("canvas")
                canvas.width = w
                canvas.height = h
                const ctx = canvas.getContext("2d")
                if (!ctx) {
                    reject(new Error("No se pudo procesar la imagen"))
                    return
                }
                ctx.drawImage(img, 0, 0, w, h)
                const dataUrl = canvas.toDataURL("image/jpeg", 0.9)
                resolve({ base64: dataUrl.split(",")[1] || "", mime: "image/jpeg" })
            }
            img.src = reader.result as string
        }
        reader.readAsDataURL(file)
    })
}

/* ═══════════════════════════════════════════════════════════════
   CSS — tema claro VTLI
   ═══════════════════════════════════════════════════════════════ */

const CSS = `
.zc-wrap{display:flex;flex-direction:column;gap:18px;}
.zc-intro{font-size:13px;line-height:1.55;color:${INK2};max-width:780px;}
.zc-intro strong{color:${GOLD};}

/* ── Selector de estilo (3 tarjetas) ── */
.zc-styles-lbl{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${MUTE2};margin-bottom:-4px;}
.zc-styles{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;}
.zc-style{text-align:left;border:1.5px solid rgba(60,82,115,0.14);border-radius:14px;background:#FFFFFF;padding:15px 15px 16px;cursor:pointer;transition:.16s;display:flex;flex-direction:column;gap:7px;box-shadow:0 4px 16px rgba(60,82,115,0.05);}
.zc-style:hover{border-color:rgba(168,116,24,0.45);transform:translateY(-1px);}
.zc-style.on{border-color:${GOLD};box-shadow:0 6px 22px rgba(168,116,24,0.18);background:linear-gradient(165deg,#FFFDF8,#FFF8EC);}
.zc-style-top{display:flex;align-items:center;gap:9px;}
.zc-style-glyph{font-size:18px;color:${GOLD};line-height:1;}
.zc-style-name{font-size:14.5px;font-weight:700;color:${INK};}
.zc-style-tag{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:${BLUE};font-weight:600;}
.zc-style-desc{font-size:11.5px;line-height:1.5;color:${MUTE};}
.zc-style-check{margin-left:auto;width:18px;height:18px;border-radius:50%;border:1.5px solid rgba(60,82,115,0.25);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;}
.zc-style.on .zc-style-check{background:${GOLD};border-color:${GOLD};}

/* ── Sub-selector de modo narrativo (solo Manga Diálogo) ── */
.zc-submodes-wrap{display:flex;flex-direction:column;gap:9px;padding:14px 16px 16px;border:1px solid rgba(94,137,176,0.28);border-left:3px solid ${GOLD};border-radius:14px;background:linear-gradient(180deg,#FBFCFE,#F6FAFD);}
.zc-submodes-lbl{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${MUTE2};}
.zc-submodes-lbl b{color:${GOLD};}
.zc-submodes{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;}
.zc-submode{text-align:left;border:1.5px solid rgba(60,82,115,0.14);border-radius:12px;background:#FFFFFF;padding:13px 13px 14px;cursor:pointer;transition:.16s;display:flex;flex-direction:column;gap:5px;}
.zc-submode:hover{border-color:rgba(63,110,150,0.5);transform:translateY(-1px);}
.zc-submode.on{border-color:${BLUE};box-shadow:0 5px 18px rgba(63,110,150,0.16);background:linear-gradient(165deg,#FBFDFF,#EFF6FC);}
.zc-submode-top{display:flex;align-items:center;gap:8px;}
.zc-submode-glyph{font-size:16px;color:${BLUE};line-height:1;}
.zc-submode-name{font-size:13.5px;font-weight:700;color:${INK};}
.zc-submode-check{margin-left:auto;width:17px;height:17px;border-radius:50%;border:1.5px solid rgba(60,82,115,0.25);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;}
.zc-submode.on .zc-submode-check{background:${BLUE};border-color:${BLUE};}
.zc-submode-sub{font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:${BLUE};font-weight:600;}
.zc-submode-desc{font-size:11px;line-height:1.5;color:${MUTE};}

/* ── Controles (slides + generar) ── */
.zc-controls{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end;padding:16px;border:1px solid rgba(168,116,24,0.28);border-radius:14px;background:#FFFFFF;box-shadow:0 6px 22px rgba(60,82,115,0.07);}
.zc-field{display:flex;flex-direction:column;gap:6px;}
.zc-field-lbl{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${MUTE2};}
.zc-seg{display:flex;gap:4px;background:#EEF1F5;border-radius:10px;padding:4px;}
.zc-seg button{border:none;background:transparent;color:#5E6772;font-size:14px;padding:9px 16px;border-radius:7px;cursor:pointer;transition:.15s;min-width:44px;font-weight:600;}
.zc-seg button.on{background:rgba(168,116,24,0.18);color:${GOLD_DK};}
.zc-mode-pill{display:inline-flex;align-items:center;gap:6px;font-size:11px;color:${BLUE};border:1px solid rgba(94,137,176,0.3);background:rgba(94,137,176,0.06);border-radius:20px;padding:5px 11px;}
.zc-gen{margin-left:auto;display:flex;align-items:center;gap:10px;border:none;border-radius:12px;padding:14px 24px;cursor:pointer;background:linear-gradient(135deg,#D4A843,#b8893a);color:#1a1206;font-size:15px;font-weight:700;transition:.18s;box-shadow:0 6px 18px rgba(168,116,24,0.25);}
.zc-gen:hover:not(:disabled){transform:translateY(-1px);}
.zc-gen:disabled{opacity:.55;cursor:default;box-shadow:none;}
.zc-gen .g{font-size:18px;}
.zc-spin{width:17px;height:17px;border:2.5px solid rgba(26,18,6,.3);border-top-color:#1a1206;border-radius:50%;animation:zc-rot .8s linear infinite;}
@keyframes zc-rot{to{transform:rotate(360deg)}}

.zc-error{padding:12px 16px;border-radius:10px;background:rgba(214,69,69,0.08);border:1px solid rgba(214,69,69,0.35);color:#B23A3A;font-size:13px;line-height:1.5;}
.zc-empty{padding:44px 20px;text-align:center;color:#8A929C;font-size:14px;border:1px dashed rgba(60,82,115,0.18);border-radius:14px;}

/* ── Tarjeta de carrusel ── */
.zc-car{border:1px solid rgba(60,82,115,0.12);border-radius:16px;padding:18px;background:#FFFFFF;display:flex;flex-direction:column;gap:14px;box-shadow:0 6px 22px rgba(60,82,115,0.06);}
.zc-car-head{display:flex;align-items:flex-start;gap:12px;}
.zc-cover-box{flex-shrink:0;width:54px;height:68px;border-radius:9px;border:1px dashed rgba(60,82,115,0.3);background:#F4F6F8;cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:0;transition:.15s;}
.zc-cover-box:hover{border-color:${GOLD};}
.zc-cover-box:disabled{cursor:default;opacity:.7;}
.zc-cover-box img{width:100%;height:100%;object-fit:cover;}
.zc-cover-ph{font-size:9px;line-height:1.3;color:${MUTE2};text-align:center;padding:0 3px;font-weight:600;}
.zc-car-titles{flex:1;min-width:0;}
.zc-pills{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:7px;}
.zc-pill{font-size:10px;letter-spacing:.05em;text-transform:uppercase;padding:3px 9px;border-radius:20px;border:1px solid rgba(60,82,115,0.18);color:#5E6772;font-weight:600;}
.zc-pill.style{border-color:rgba(168,116,24,0.4);color:${GOLD};}
.zc-pill.count{border-color:rgba(94,137,176,0.35);color:${BLUE};}
.zc-pill.mode{border-color:rgba(63,110,150,0.45);color:${BLUE};background:rgba(63,110,150,0.07);}
.zc-pill.pub{border-color:rgba(80,180,120,0.45);color:#3C8A5C;background:rgba(80,180,120,0.1);}
.zc-car-title{font-size:18px;font-weight:700;color:${INK};margin:0;line-height:1.25;}
.zc-car-narr{font-size:12px;color:${MUTE};margin:5px 0 0;line-height:1.5;}
.zc-car-acts{display:flex;gap:7px;flex-shrink:0;}
.zc-iconbtn{border:1px solid rgba(60,82,115,0.16);background:#FFFFFF;color:${MUTE};border-radius:9px;height:34px;padding:0 11px;cursor:pointer;font-size:12px;font-weight:600;transition:.15s;white-space:nowrap;}
.zc-iconbtn:hover{border-color:rgba(80,180,120,0.5);color:#3C8A5C;}
.zc-iconbtn.on{border-color:rgba(80,180,120,0.6);color:#3C8A5C;background:rgba(80,180,120,0.12);}
.zc-iconbtn.del{width:34px;padding:0;font-size:15px;}
.zc-iconbtn.del:hover{border-color:rgba(214,69,69,0.45);color:#B23A3A;}

/* ── Caption ── */
.zc-cap-box{border:1px solid rgba(60,82,115,0.12);border-radius:11px;background:#F4F6F8;padding:12px 13px;}
.zc-cap-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px;}
.zc-cap-lbl{font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:${MUTE2};font-weight:600;}
.zc-cap-txt{font-size:12.5px;line-height:1.55;color:${INK2};white-space:pre-wrap;}
.zc-cap-tags{margin-top:8px;color:${BLUE};font-size:12px;opacity:.92;word-break:break-word;}
.zc-copybtn{border:1px solid rgba(168,116,24,0.4);background:rgba(212,168,67,0.1);color:${GOLD_DK};border-radius:7px;padding:5px 12px;font-size:11.5px;font-weight:700;cursor:pointer;transition:.15s;white-space:nowrap;}
.zc-copybtn:hover{background:rgba(212,168,67,0.18);}
.zc-copybtn.copied{background:rgba(80,180,120,0.14);border-color:rgba(80,180,120,0.5);color:#3C8A5C;}

/* ── Slides (lista vertical) ── */
.zc-slides{display:flex;flex-direction:column;gap:11px;}
.zc-slide{border:1px solid rgba(60,82,115,0.12);border-radius:13px;background:#FFFFFF;overflow:hidden;}
.zc-slide-head{display:flex;align-items:center;gap:10px;padding:11px 13px;background:#F7F9FB;border-bottom:1px solid rgba(60,82,115,0.08);}
.zc-slide-idx{flex-shrink:0;width:30px;height:30px;border-radius:8px;background:rgba(168,116,24,0.14);color:${GOLD_DK};font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;}
.zc-slide-label{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:${GOLD};font-weight:700;}
.zc-slide-copy{font-size:12.5px;color:${INK};line-height:1.35;flex:1;min-width:0;}
.zc-slide-body{padding:12px 13px;display:flex;flex-direction:column;gap:10px;}
.zc-note{display:flex;gap:8px;align-items:flex-start;font-size:12px;line-height:1.5;color:#7A5A12;background:rgba(212,168,67,0.13);border:1px solid rgba(168,116,24,0.4);border-radius:9px;padding:9px 11px;}
.zc-note b{color:${GOLD_DK};font-weight:700;}
.zc-prompt-head{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.zc-prompt-lbl{font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:${MUTE2};font-weight:600;}
.zc-prompt-txt{font-size:11.5px;line-height:1.5;color:${INK2};white-space:pre-wrap;background:#F4F6F8;border:1px solid rgba(60,82,115,0.1);border-radius:9px;padding:11px 12px;max-height:220px;overflow-y:auto;}

.zc-toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);background:#FFFFFF;border:1px solid rgba(168,116,24,0.4);color:${INK};padding:12px 20px;border-radius:12px;font-size:13px;z-index:2147483646;box-shadow:0 10px 40px rgba(60,82,115,0.2);}

/* ── Fuente: Sexta Densidad vs Códice de Luz + grid de libros + form ── */
.zc-src{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;}
.zc-books-wrap{display:flex;flex-direction:column;gap:8px;}
.zc-books{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-top:10px;}
.zc-book{text-align:left;border:1.5px solid rgba(60,82,115,0.14);border-radius:12px;background:#FFFFFF;padding:13px;cursor:pointer;transition:.16s;display:flex;flex-direction:column;gap:3px;}
.zc-book:hover{border-color:rgba(168,116,24,0.45);transform:translateY(-1px);}
.zc-book.on{border-color:${GOLD};box-shadow:0 5px 18px rgba(168,116,24,0.18);background:linear-gradient(165deg,#FFFDF8,#FFF8EC);}
.zc-book-title{font-size:13.5px;font-weight:700;color:${INK};line-height:1.25;}
.zc-book-meta{font-size:10.5px;color:${MUTE};}
.zc-book-del{align-self:flex-start;margin-top:4px;border:none;background:transparent;color:${MUTE2};font-size:10.5px;cursor:pointer;padding:2px 0;}
.zc-book-del:hover{color:#B23A3A;text-decoration:underline;}
.zc-book-add{border:1.5px dashed rgba(168,116,24,0.5);border-radius:12px;background:rgba(212,168,67,0.05);padding:13px;cursor:pointer;color:${GOLD_DK};font-size:13px;font-weight:700;transition:.16s;display:flex;align-items:center;justify-content:center;min-height:62px;}
.zc-book-add:hover{background:rgba(212,168,67,0.12);}
.zc-codice-form{display:flex;flex-direction:column;gap:10px;padding:16px;border:1px solid rgba(168,116,24,0.3);border-radius:14px;background:#FFFFFF;box-shadow:0 6px 22px rgba(60,82,115,0.07);margin-top:6px;}
.zc-codice-form .row{display:flex;gap:10px;flex-wrap:wrap;}
.zc-inp{flex:1;min-width:150px;border:1px solid rgba(60,82,115,0.2);border-radius:9px;padding:10px 12px;font-size:13px;color:${INK};background:#FBFCFE;box-sizing:border-box;}
.zc-ta{width:100%;min-height:170px;resize:vertical;border:1px solid rgba(60,82,115,0.2);border-radius:9px;padding:11px 12px;font-size:12.5px;line-height:1.5;color:${INK2};background:#FBFCFE;box-sizing:border-box;font-family:inherit;}
.zc-form-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
.zc-form-hint{font-size:11px;color:${MUTE};flex:1;min-width:120px;}
.zc-btn-ghost{border:1px solid rgba(60,82,115,0.2);background:#fff;color:${MUTE};border-radius:9px;padding:9px 14px;font-size:12.5px;font-weight:600;cursor:pointer;}
.zc-pill.codice{border-color:rgba(168,116,24,0.45);color:${GOLD};background:rgba(212,168,67,0.08);}

@media (max-width:720px){
  .zc-styles,.zc-submodes,.zc-src,.zc-books{grid-template-columns:1fr;}
  .zc-gen{margin-left:0;width:100%;justify-content:center;}
  .zc-controls{flex-direction:column;align-items:stretch;}
}
`

/* ═══════════════════════════════════════════════════════════════
   Slide row
   ═══════════════════════════════════════════════════════════════ */

function SlideRow({
    slide,
    notify,
}: {
    slide: Slide
    notify: (m: string) => void
}) {
    const [copied, setCopied] = useState(false)
    const note = (slide.director_note || "").trim()

    const copyPrompt = useCallback(() => {
        try {
            navigator.clipboard?.writeText(noGuillemets(slide.prompt_image))
        } catch {}
        setCopied(true)
        notify(`Prompt del #${slide.slide_index + 1} copiado`)
        setTimeout(() => setCopied(false), 1500)
    }, [slide.prompt_image, slide.slide_index, notify])

    return (
        <div className="zc-slide">
            <div className="zc-slide-head">
                <span className="zc-slide-idx">{slide.slide_index + 1}</span>
                <span className="zc-slide-label">{slide.slide_label}</span>
                {slide.copy_line ? (
                    <span className="zc-slide-copy">
                        "{noGuillemets(slide.copy_line)}"
                    </span>
                ) : null}
            </div>
            <div className="zc-slide-body">
                {note.length > 0 && (
                    <div className="zc-note">
                        <span>🔗</span>
                        <span>
                            <b>Referencia visual (para ti):</b> {note}
                        </span>
                    </div>
                )}
                <div className="zc-prompt-head">
                    <span className="zc-prompt-lbl">
                        Prompt para Nano Banana
                    </span>
                    <button
                        className={`zc-copybtn ${copied ? "copied" : ""}`}
                        onClick={copyPrompt}
                    >
                        {copied ? "Copiado ✓" : "📋 Copiar prompt"}
                    </button>
                </div>
                <div className="zc-prompt-txt">
                    {noGuillemets(slide.prompt_image)}
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   Carousel card
   ═══════════════════════════════════════════════════════════════ */

function CarouselCard({
    carousel,
    codiceTitle,
    supabaseUrl,
    supabaseAnonKey,
    clerkUserId,
    onDeleted,
    onPatch,
    notify,
}: {
    carousel: Carousel
    codiceTitle?: string
    supabaseUrl: string
    supabaseAnonKey: string
    clerkUserId: string
    onDeleted: (id: string) => void
    onPatch: (id: string, patch: Partial<Carousel>) => void
    notify: (m: string) => void
}) {
    const [capCopied, setCapCopied] = useState(false)
    const [busy, setBusy] = useState(false)
    const [coverBusy, setCoverBusy] = useState(false)
    const coverInputRef = useRef<HTMLInputElement>(null)
    const st = styleOptByKey(carousel.style_key)
    const dm =
        carousel.style_key === "manga_dialogo"
            ? dialogoModeOptByKey(carousel.dialogo_mode)
            : null

    // Sube una portada manual (mini portada) para identificar el carrusel ya
    // publicado. Reusa el edge genérico con target "carousel".
    const uploadCover = useCallback(
        async (file: File | null) => {
            if (!file) return
            setCoverBusy(true)
            try {
                const { base64, mime } = await resizeImageToBase64(file)
                const r = await callEdge(
                    supabaseUrl,
                    supabaseAnonKey,
                    "upload-vtli-draft-cover",
                    {
                        admin_clerk_id: clerkUserId,
                        target: "carousel",
                        carousel_id: carousel.id,
                        image_base64: base64,
                        image_mime: mime,
                    }
                )
                if (r.ok && r.body?.cover_image_url) {
                    onPatch(carousel.id, {
                        cover_image_url: r.body.cover_image_url,
                    })
                    notify("Portada lista ✓")
                } else {
                    notify(
                        `No se pudo subir la portada: ${
                            r.body?.error ?? r.status
                        }`
                    )
                }
            } catch (e: any) {
                notify(`No se pudo subir la portada: ${e?.message ?? e}`)
            } finally {
                setCoverBusy(false)
                if (coverInputRef.current) coverInputRef.current.value = ""
            }
        },
        [
            carousel.id,
            supabaseUrl,
            supabaseAnonKey,
            clerkUserId,
            onPatch,
            notify,
        ]
    )

    const copyCaption = useCallback(() => {
        const tags = (carousel.hashtags || []).join(" ")
        const full = tags ? `${carousel.caption}\n\n${tags}` : carousel.caption
        try {
            navigator.clipboard?.writeText(full)
        } catch {}
        setCapCopied(true)
        notify("Caption + hashtags copiados")
        setTimeout(() => setCapCopied(false), 1600)
    }, [carousel.caption, carousel.hashtags, notify])

    const togglePublished = useCallback(async () => {
        const next = !carousel.is_published
        onPatch(carousel.id, { is_published: next })
        await rpc(
            supabaseUrl,
            supabaseAnonKey,
            "set_zakhaar_carousel_published",
            {
                p_admin_clerk_id: clerkUserId,
                p_carousel_id: carousel.id,
                p_published: next,
            }
        )
    }, [
        carousel.is_published,
        carousel.id,
        supabaseUrl,
        supabaseAnonKey,
        clerkUserId,
        onPatch,
    ])

    const remove = useCallback(async () => {
        if (busy) return
        setBusy(true)
        onDeleted(carousel.id)
        await rpc(supabaseUrl, supabaseAnonKey, "delete_zakhaar_carousel", {
            p_admin_clerk_id: clerkUserId,
            p_carousel_id: carousel.id,
        })
    }, [busy, carousel.id, supabaseUrl, supabaseAnonKey, clerkUserId, onDeleted])

    return (
        <div className="zc-car">
            <div className="zc-car-head">
                <button
                    className="zc-cover-box"
                    onClick={() => coverInputRef.current?.click()}
                    title="Subir una portada para identificar este carrusel"
                    disabled={coverBusy}
                >
                    {carousel.cover_image_url ? (
                        <img src={carousel.cover_image_url} alt="portada" />
                    ) : (
                        <span className="zc-cover-ph">
                            {coverBusy ? "Subiendo…" : "+ Portada"}
                        </span>
                    )}
                </button>
                <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) =>
                        uploadCover(e.target.files?.[0] ?? null)
                    }
                />
                <div className="zc-car-titles">
                    <div className="zc-pills">
                        <span className="zc-pill style">
                            {st.glyph} {st.name}
                        </span>
                        {dm && (
                            <span className="zc-pill mode">
                                {dm.glyph} {dm.name}
                            </span>
                        )}
                        {codiceTitle && (
                            <span className="zc-pill codice">
                                📖 {codiceTitle}
                            </span>
                        )}
                        <span className="zc-pill count">
                            {carousel.slides_count} slides
                        </span>
                        {carousel.is_published && (
                            <span className="zc-pill pub">● Publicado</span>
                        )}
                    </div>
                    <h3 className="zc-car-title">{carousel.concept_title}</h3>
                    {carousel.narrative ? (
                        <p className="zc-car-narr">{carousel.narrative}</p>
                    ) : null}
                </div>
                <div className="zc-car-acts">
                    <button
                        className={`zc-iconbtn ${carousel.is_published ? "on" : ""}`}
                        onClick={togglePublished}
                        title="Marcar como publicado"
                    >
                        {carousel.is_published ? "✓ Publicado" : "Publicado"}
                    </button>
                    <button
                        className="zc-iconbtn del"
                        onClick={remove}
                        title="Eliminar carrusel"
                    >
                        🗑
                    </button>
                </div>
            </div>

            <div className="zc-cap-box">
                <div className="zc-cap-head">
                    <span className="zc-cap-lbl">
                        Descripción para Instagram (con hashtags)
                    </span>
                    <button
                        className={`zc-copybtn ${capCopied ? "copied" : ""}`}
                        onClick={copyCaption}
                    >
                        {capCopied ? "Copiado ✓" : "📋 Copiar descripción"}
                    </button>
                </div>
                <div className="zc-cap-txt">{carousel.caption}</div>
                {carousel.hashtags && carousel.hashtags.length > 0 && (
                    <div className="zc-cap-tags">
                        {carousel.hashtags.join(" ")}
                    </div>
                )}
            </div>

            <div className="zc-slides">
                {(carousel.slides || []).map((s) => (
                    <SlideRow key={s.id} slide={s} notify={notify} />
                ))}
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   Main panel
   ═══════════════════════════════════════════════════════════════ */

export default function AtelierZakHaarCarrusel({
    supabaseUrl = "",
    supabaseAnonKey = "",
    clerkUserId = "",
    isMobile = false,
}: Props) {
    const [styleKey, setStyleKey] = useState("manga")
    const [dialogoMode, setDialogoMode] = useState("travesia")
    const [slidesCount, setSlidesCount] = useState(6)
    const [generating, setGenerating] = useState(false)
    const [carousels, setCarousels] = useState<Carousel[]>([])
    // Códices de Luz (libros como fuente)
    const [codices, setCodices] = useState<Codice[]>([])
    const [sourceMode, setSourceMode] = useState<"generic" | "codice">(
        "generic"
    )
    const [selectedCodiceId, setSelectedCodiceId] = useState<string>("")
    const [showAddCodice, setShowAddCodice] = useState(false)
    const [newTitle, setNewTitle] = useState("")
    const [newAuthor, setNewAuthor] = useState("Zak'Haar Solar")
    const [newText, setNewText] = useState("")
    const [distilling, setDistilling] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [toast, setToast] = useState<string | null>(null)
    const toastTimer = useRef<any>(null)

    const notify = useCallback((m: string) => {
        setToast(m)
        if (toastTimer.current) clearTimeout(toastTimer.current)
        toastTimer.current = setTimeout(() => setToast(null), 2600)
    }, [])

    // Cargar carruseles recientes al montar.
    const loadCarousels = useCallback(async () => {
        if (!clerkUserId) return
        const r = await rpc(
            supabaseUrl,
            supabaseAnonKey,
            "get_zakhaar_carousels_admin",
            { p_admin_clerk_id: clerkUserId, p_limit: 30 }
        )
        if (r && Array.isArray(r.carousels)) {
            setCarousels(r.carousels as Carousel[])
        }
    }, [clerkUserId, supabaseUrl, supabaseAnonKey])

    useEffect(() => {
        loadCarousels()
    }, [loadCarousels])

    const loadCodices = useCallback(async () => {
        if (!clerkUserId) return
        const r = await rpc(
            supabaseUrl,
            supabaseAnonKey,
            "get_codices_luz_admin",
            { p_admin_clerk_id: clerkUserId }
        )
        if (r && Array.isArray(r.codices)) setCodices(r.codices as Codice[])
    }, [clerkUserId, supabaseUrl, supabaseAnonKey])

    useEffect(() => {
        loadCodices()
    }, [loadCodices])

    const handleAddCodice = useCallback(async () => {
        if (distilling) return
        if (!newTitle.trim() || newText.trim().length < 500) {
            notify("Pon un título y pega el texto completo del libro.")
            return
        }
        setDistilling(true)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 175000)
        try {
            const r = await callEdge(
                supabaseUrl,
                supabaseAnonKey,
                "distill-codice",
                {
                    admin_clerk_id: clerkUserId,
                    title: newTitle.trim(),
                    author: newAuthor.trim(),
                    full_text: newText,
                },
                controller.signal
            )
            if (r.ok && r.body?.id) {
                notify(
                    `Códice "${r.body.title}" destilado · ${r.body.ensenanzas_count} enseñanzas`
                )
                setNewTitle("")
                setNewText("")
                setShowAddCodice(false)
                await loadCodices()
                setSourceMode("codice")
                setSelectedCodiceId(r.body.id)
            } else {
                notify(
                    `No se pudo destilar: ${
                        r.body?.error ?? r.body?.detail ?? r.status
                    }`
                )
            }
        } catch (e: any) {
            notify(
                e?.name === "AbortError"
                    ? "El destilado tardó demasiado; vuelve a intentar."
                    : "Error de red al destilar."
            )
        } finally {
            clearTimeout(timeoutId)
            setDistilling(false)
        }
    }, [
        distilling,
        newTitle,
        newAuthor,
        newText,
        supabaseUrl,
        supabaseAnonKey,
        clerkUserId,
        notify,
        loadCodices,
    ])

    const deleteCodice = useCallback(
        async (id: string) => {
            setCodices((prev) => prev.filter((c) => c.id !== id))
            setSelectedCodiceId((cur) => (cur === id ? "" : cur))
            await rpc(supabaseUrl, supabaseAnonKey, "delete_codice_luz_admin", {
                p_admin_clerk_id: clerkUserId,
                p_id: id,
            })
        },
        [supabaseUrl, supabaseAnonKey, clerkUserId]
    )

    const handleGenerate = useCallback(async () => {
        if (generating) return
        if (sourceMode === "codice" && !selectedCodiceId) {
            setError(
                "Elige un Códice de Luz (o cambia la fuente a Pulso de Sexta Densidad)."
            )
            return
        }
        setGenerating(true)
        setError(null)
        // Timeout de cliente: si el motor no responde en 175s, cancelamos para
        // que el botón NUNCA quede colgado en "Generando…". (Manga Diálogo genera
        // más texto y el motor puede usar hasta ~158s en el peor caso.)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 175000)
        try {
            const r = await callEdge(
                supabaseUrl,
                supabaseAnonKey,
                "generate-zakhaar-carousel",
                {
                    admin_clerk_id: clerkUserId,
                    style: styleKey,
                    dialogo_mode: dialogoMode,
                    codice_id:
                        sourceMode === "codice" ? selectedCodiceId : undefined,
                    slides_count: slidesCount,
                },
                controller.signal
            )
            if (r.ok && r.body?.carousel) {
                setCarousels((prev) => [r.body.carousel as Carousel, ...prev])
                notify("Carrusel creado · prompts listos para copiar")
            } else {
                setError(
                    `No se pudo generar: ${
                        r.body?.error ?? r.body?.detail ?? r.status
                    }`
                )
            }
        } catch (e: any) {
            const aborted = e?.name === "AbortError"
            setError(
                aborted
                    ? "La generación tardó demasiado y se canceló. Vuelve a intentar (si alcanzó a crearse, aparecerá al recargar la lista)."
                    : "No se pudo generar (error de red). Vuelve a intentar."
            )
            // Por si el carrusel sí se creó en el servidor, refrescamos la lista.
            loadCarousels()
        } finally {
            clearTimeout(timeoutId)
            setGenerating(false)
        }
    }, [
        generating,
        supabaseUrl,
        supabaseAnonKey,
        clerkUserId,
        styleKey,
        dialogoMode,
        sourceMode,
        selectedCodiceId,
        slidesCount,
        notify,
        loadCarousels,
    ])

    const removeCarousel = useCallback((id: string) => {
        setCarousels((prev) => prev.filter((c) => c.id !== id))
    }, [])

    const patchCarousel = useCallback(
        (id: string, patch: Partial<Carousel>) => {
            setCarousels((prev) =>
                prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
            )
        },
        []
    )

    return (
        <div className="zc-wrap">
            <style>{CSS}</style>

            <p className="zc-intro">
                Genera <strong>carruseles</strong> de Zak'Haar para Instagram
                (de 5 a 8 imágenes). Elige uno de los 3 estilos de marca y la
                cantidad de slides: el panel arma el concepto y te entrega el
                prompt de cada slide listo para copiar/pegar en Nano Banana. Si
                un slide reutiliza un ser de otro, te aviso{" "}
                <strong>aparte</strong> qué imagen subir como referencia — eso
                nunca ensucia el prompt.
            </p>

            {/* Fuente del carrusel */}
            <div className="zc-styles-lbl">Fuente del carrusel</div>
            <div className="zc-src">
                <button
                    className={`zc-style ${
                        sourceMode === "generic" ? "on" : ""
                    }`}
                    onClick={() => setSourceMode("generic")}
                >
                    <div className="zc-style-top">
                        <span className="zc-style-glyph">✷</span>
                        <span className="zc-style-name">
                            Pulso de Sexta Densidad
                        </span>
                        <span className="zc-style-check">
                            {sourceMode === "generic" ? "✓" : ""}
                        </span>
                    </div>
                    <span className="zc-style-desc">
                        Enseñanzas vivas de alta vibración (lo de siempre): el
                        motor elige el tema.
                    </span>
                </button>
                <button
                    className={`zc-style ${
                        sourceMode === "codice" ? "on" : ""
                    }`}
                    onClick={() => setSourceMode("codice")}
                >
                    <div className="zc-style-top">
                        <span className="zc-style-glyph">◈</span>
                        <span className="zc-style-name">Códice de Luz</span>
                        <span className="zc-style-check">
                            {sourceMode === "codice" ? "✓" : ""}
                        </span>
                    </div>
                    <span className="zc-style-desc">
                        El carrusel sale de UNO de tus libros: el motor toma una
                        enseñanza del libro, fiel a tu voz.
                    </span>
                </button>
            </div>

            {sourceMode === "codice" && (
                <div className="zc-books-wrap">
                    <div className="zc-books">
                        {codices.map((c) => (
                            <div
                                key={c.id}
                                role="button"
                                className={`zc-book ${
                                    selectedCodiceId === c.id ? "on" : ""
                                }`}
                                onClick={() => setSelectedCodiceId(c.id)}
                            >
                                <span className="zc-book-title">{c.title}</span>
                                <span className="zc-book-meta">
                                    {c.author} · {c.ensenanzas_count} enseñanzas
                                </span>
                                <button
                                    className="zc-book-del"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        deleteCodice(c.id)
                                    }}
                                >
                                    borrar
                                </button>
                            </div>
                        ))}
                        <button
                            className="zc-book-add"
                            onClick={() => setShowAddCodice((v) => !v)}
                        >
                            {showAddCodice ? "× Cerrar" : "+ Agregar Códice"}
                        </button>
                    </div>
                    {codices.length === 0 && !showAddCodice && (
                        <div className="zc-form-hint">
                            Aún no hay códices. Toca «+ Agregar Códice» y pega el
                            texto completo de un libro.
                        </div>
                    )}
                    {showAddCodice && (
                        <div className="zc-codice-form">
                            <div className="row">
                                <input
                                    className="zc-inp"
                                    placeholder="Título del libro"
                                    value={newTitle}
                                    onChange={(e) =>
                                        setNewTitle(e.target.value)
                                    }
                                />
                                <input
                                    className="zc-inp"
                                    placeholder="Autor"
                                    value={newAuthor}
                                    onChange={(e) =>
                                        setNewAuthor(e.target.value)
                                    }
                                    style={{ maxWidth: 200 }}
                                />
                            </div>
                            <textarea
                                className="zc-ta"
                                placeholder="Pega aquí el TEXTO COMPLETO del libro…"
                                value={newText}
                                onChange={(e) => setNewText(e.target.value)}
                            />
                            <div className="zc-form-actions">
                                <span className="zc-form-hint">
                                    {newText.trim()
                                        ? `${newText
                                              .trim()
                                              .length.toLocaleString()} caracteres · el motor lo destila una sola vez (~30-60s)`
                                        : "El motor lo destila una sola vez (~30-60s). Después cada carrusel es barato y fino."}
                                </span>
                                <button
                                    className="zc-btn-ghost"
                                    onClick={() => setShowAddCodice(false)}
                                    disabled={distilling}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="zc-gen"
                                    style={{ margin: 0, padding: "12px 20px" }}
                                    onClick={handleAddCodice}
                                    disabled={distilling}
                                >
                                    {distilling ? (
                                        <>
                                            <span className="zc-spin" />{" "}
                                            Destilando…
                                        </>
                                    ) : (
                                        <>
                                            <span className="g">⚗</span>{" "}
                                            Destilar libro
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Selector de estilo */}
            <div className="zc-styles-lbl">Estilo del carrusel</div>
            <div className="zc-styles">
                {STYLE_OPTS.map((s) => (
                    <button
                        key={s.key}
                        className={`zc-style ${styleKey === s.key ? "on" : ""}`}
                        onClick={() => setStyleKey(s.key)}
                    >
                        <div className="zc-style-top">
                            <span className="zc-style-glyph">{s.glyph}</span>
                            <span className="zc-style-name">{s.name}</span>
                            <span className="zc-style-check">
                                {styleKey === s.key ? "✓" : ""}
                            </span>
                        </div>
                        <span className="zc-style-tag">{s.tag}</span>
                        <span className="zc-style-desc">{s.desc}</span>
                    </button>
                ))}
            </div>

            {/* Sub-selector de modo narrativo — solo para Manga Diálogo */}
            {styleKey === "manga_dialogo" && (
                <div className="zc-submodes-wrap">
                    <div className="zc-submodes-lbl">
                        Modo narrativo · <b>Manga Diálogo</b>
                    </div>
                    <div className="zc-submodes">
                        {DIALOGO_MODE_OPTS.map((m) => (
                            <button
                                key={m.key}
                                className={`zc-submode ${
                                    dialogoMode === m.key ? "on" : ""
                                }`}
                                onClick={() => setDialogoMode(m.key)}
                            >
                                <div className="zc-submode-top">
                                    <span className="zc-submode-glyph">
                                        {m.glyph}
                                    </span>
                                    <span className="zc-submode-name">
                                        {m.name}
                                    </span>
                                    <span className="zc-submode-check">
                                        {dialogoMode === m.key ? "✓" : ""}
                                    </span>
                                </div>
                                <span className="zc-submode-sub">
                                    {m.subtitle}
                                </span>
                                <span className="zc-submode-desc">
                                    {m.desc}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Controles */}
            <div className="zc-controls">
                <div className="zc-field">
                    <span className="zc-field-lbl">Número de slides</span>
                    <div className="zc-seg">
                        {SLIDE_COUNTS.map((n) => (
                            <button
                                key={n}
                                className={slidesCount === n ? "on" : ""}
                                onClick={() => setSlidesCount(n)}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="zc-field">
                    <span className="zc-field-lbl">Modo</span>
                    <span className="zc-mode-pill">
                        ◇ Solo prompts · $0 (Nano Banana a mano)
                    </span>
                </div>
                <button
                    className="zc-gen"
                    onClick={handleGenerate}
                    disabled={generating}
                >
                    {generating ? (
                        <>
                            <span className="zc-spin" /> Generando…
                        </>
                    ) : (
                        <>
                            <span className="g">✦</span> Generar carrusel
                        </>
                    )}
                </button>
            </div>

            {error && <div className="zc-error">{error}</div>}

            {/* Lista de carruseles */}
            {carousels.length === 0 ? (
                <div className="zc-empty">
                    Todavía no hay carruseles. Elige un estilo, la cantidad de
                    slides y toca «Generar carrusel».
                </div>
            ) : (
                carousels.map((c) => (
                    <CarouselCard
                        key={c.id}
                        carousel={c}
                        codiceTitle={
                            c.codice_id
                                ? codices.find((x) => x.id === c.codice_id)
                                      ?.title ?? ""
                                : ""
                        }
                        supabaseUrl={supabaseUrl}
                        supabaseAnonKey={supabaseAnonKey}
                        clerkUserId={clerkUserId}
                        onDeleted={removeCarousel}
                        onPatch={patchCarousel}
                        notify={notify}
                    />
                ))
            )}

            {toast && <div className="zc-toast">{toast}</div>}
        </div>
    )
}
