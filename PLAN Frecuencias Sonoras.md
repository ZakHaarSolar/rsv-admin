# PLAN — Panel "Frecuencias Sonoras" (generador de prompts para Suno)

Panel admin NUEVO, pestaña propia al nivel de **Motor de Intervención** y **Atelier
de Marketing** (NO sub-tab del Atelier). Genera prompts listos para pegar en Suno
(que no tiene API oficial general) con el vibe de Red Solar Viva. Estilo visual:
**holográfico cyan de la Holoteca / Escáner Vibracional** (tarjetas cristalinas
azul-cyan). Súper didáctico, súper profesional.

Fuente de datos: `admin/RSV DB/Frecuencias Sonoras - Albumes y Tracks.md` (7 álbumes).

---

## 1. EL ADN SONORO DE RED SOLAR VIVA (destilado de los 7 álbumes)

**Géneros firma:** Ethereal Ambient · Solarwave · Lucidwave · Psybient · Deep
Soulful / Solar Ascending House · Cinematic Organic World · Ambient Minimalism.

**Instrumentación firma:** arpa y glass harmonica · coros etéreos (angelical, mixto,
wordless, susurrado) · arpegios y texturas cristalinas · strings cálidos que se
elevan · flautas de madera / pan / "alien" · percusión suave de mano y frame drums
(NUNCA batería dura) · Rhodes (en la cara house) · pads sumergidos / bioluminiscentes
· texturas de agua.

**Frecuencias sagradas (marca distintiva, muy presente):** 963 Hz (pineal) · 528 Hz
(sanación/ADN) · 639 Hz (relaciones) · 432 Hz (afinación natural) · 111/222/285/333/
396/852/888 Hz · Schumann 7.83 Hz · sub-ondas binaurales (13 Hz, 2 Hz).

**Moods:** sereno · sanador · elevador · celestial · cristalino · pacífico · euforia
espiritual · quietud/presencia · aventura pacífica · unidad. **SIEMPRE alta
frecuencia** (regla de oro, aplica también a los lyrics).

**Imaginería conceptual:** agua/líquido/ríos de luz · bioluminiscencia · sol interior
· amanecer · aurora · civilizaciones antiguas (Atlantis/Lemuria) · naturaleza viva ·
cosmos · cristal · geometría sagrada · raíces/memoria planetaria.

**Voz:** cuando hay, es angelical/coral/**lenguaje lumínico** (idioma vocal propio) o
wordless. NUNCA pop vocals.

**Excludes universales (aparecen en casi todo el catálogo):** dark, heavy, aggressive,
fast, drums (duros), rock, metal, trap, hip-hop, pop vocals, chaotic, tense,
melancholic, industrial, distorted, EDM festival duro, reggaeton, dubstep.

**Parámetros Suno observados:** primer % = **Weirdness** (rango 8–80, mediana ~40),
segundo % = **Style Influence** (rango 15–88, mediana ~70). Correlación observada:
lo ORGÁNICO/ACÚSTICO → style influence alto (85%) + weirdness bajo (18–20%); lo
AMBIENT/DISOLUCIÓN → style influence bajo (15–35%) + weirdness medio-alto; lo CORAL/
FONÉTICO → ambos medios-altos (40–75).

### Los 7 ARQUETIPOS DE DIRECCIÓN (derivados de la obra real — base de las "candidatas")
1. **Etéreo Acuático** (Lumeria) — agua · arpa · coro angelical · sanación · atlante.
2. **Orgánico Cinemático de Vuelo** (Donde Viven los Cielos) — acústico · strings +
   flautas + percusión de mano · aventura · world · style influence alto.
3. **House Solar Ascendente** (Prisma) — deep soulful house 4/4 · Rhodes · 963 Hz ·
   danza-meditación · euforia espiritual.
4. **Ambient de Disolución / Solarwave puro** (Punto de No Retorno) — minimalista ·
   frecuencias puras · no-dualidad · quietud · "silencio es el lienzo".
5. **Ancestral Lucidwave Planetario** (Donde la Tierra Aún Canta) — tribal-etéreo ·
   agua consciente · pineal drones · raíces · 64–72 BPM.
6. **Solarwave Luminoso** (Sintonías de Sol Navegante) — ríos de luz · amanecer · sol
   interior · ligero/ascendente.
7. **Coral de Lenguaje Solar** (Códigos Aurora) — fonética lumínica cantada · aurora ·
   del susurro (Silentis) al fuego solar (Ignis/Flamma/Sorah).

---

## 2. DECISIONES CONFIRMADAS POR ZAK
- ✅ Pestaña PROPIA "Frecuencias Sonoras" (nivel Motor/Atelier, no sub-tab).
- ✅ Elegir instrumental vs con lyrics; si lyrics, el panel los crea.
- ✅ Idiomas de lyrics como perilla — incluye **español**, **inglés**, **lenguaje
  lumínico** (idioma vocal propio de fonemas solares), **mantra/vocalizaciones**.
- ✅ **TODOS los lyrics son de alta frecuencia** (regla dura, sin excepción).
- ✅ Norte por álbum: crear alrededor de un álbum, desactivarlo, o mezclar 1 álbum
  con otros / con otras creaciones.
- ✅ **También elegir CANCIONES ESPECÍFICAS** de cada álbum (no solo álbumes) para
  las fusiones + lógica de fusiones.
- ✅ Selector de inspiración **Low / Med / High** (cuánto pesa el Norte).
- ✅ El output DEBE traer el **% de Weirdness y % de Style Influence sugeridos**
  (Suno los pide; NO los elige Zak — el panel los recomienda). 1º weirdness, 2º
  style influence.
- ✅ Cada creación se guarda; al crear MÁS canciones del mismo álbum/vibe de lyrics
  que ya gustó, el panel **lee las canciones ya creadas para NO repetir lyrics**,
  pero manteniendo un **Norte temático** (mismo hilo). Anti-repetición de lyrics
  (patrón "Códice de Luz" aplicado a letras).
- ✅ Estilo visual holográfico cyan (Holoteca / Escáner Vibracional).
- ✅ 3 capas de refinamiento con iteración libre.
- ✅ Cerebro recomendado: **DeepSeek vía OpenRouter** (independiente del billing de
  Google, casi gratis, sin filtros) + un multimodal para el modo imagen.

---

## 3. FLUJO — 3 CAPAS DE REFINAMIENTO
**Semilla (elige una o combina):**
- Texto libre.
- **Imagen** (visión → vibe sonoro).
- **Referencia "tipo…"** (artista/canción por nombre → descripción de estilo SIN
  nombrar al artista — Suno bloquea nombres reales, igual que el filtro de imagen).
- **Norte de álbum/track**: seleccionar álbum(es) y/o track(s) específicos +
  inspiración Low/Med/High + modo (Anclar en la obra / Explorar fuera / Fusionar).

**Capa 1 — Dirección:** 3–4 candidatas distintas de verdad, tomadas de los 7
arquetipos + la semilla (ej. "Etéreo Acuático", "House Solar", "Coral Lumínico",
"Ambient de Disolución"). Eliges una; si no, regeneras.

**Capa 2 — Afinar:** perillas → variaciones significativas. Perillas:
- Con voz ↔ Instrumental puro (toggle Suno).
- Íntimo/emocional ↔ Épico/expansivo.
- Etéreo/celestial ↔ Terrenal/orgánico.
- Meditativo/lento ↔ Rítmico/activo (tempo/BPM).
- Minimal/ambient ↔ Denso/orquestal.
- Frecuencial (drone/Hz sagrados) ↔ Melódico/estructurado.
- Cristalino/digital ↔ Análogo/cálido (producción).
- Idioma de lyrics (si con voz): español / inglés / lumínico / mantra-vocalizaciones.

**Capa 3 — Pulido final (listo para Suno):** el prompt completo + variaciones A/B.
La **letra tiene su propio botón de regenerar** (como la narración de los videos), y
respeta el anti-repetición + Norte temático.

---

## 4. LÓGICA DE FUSIONES
- Seleccionar N álbumes y/o N tracks específicos → el panel destila el vibe combinado
  y genera una dirección híbrida coherente.
- **Inspiración Low/Med/High** = cuánto pesa el Norte vs. la libertad creativa
  (mapea aprox. a un rango sugerido de Style Influence en el output: Low→~40, Med→~65,
  High→~85, ajustable por dirección).
- "Fusionar con otras creaciones": mezclar un álbum/track con una creación previa del
  propio panel.
- Cada álbum/track lleva su vibe ya conocido (excludes + Hz + instrumentación); la
  fusión promedia/combina respetando los excludes universales.

## 5. ANTI-REPETICIÓN DE LYRICS + NORTE TEMÁTICO
- Al pedir lyrics para una canción nueva de un vibe/álbum ya trabajado, el edge LEE
  los lyrics ya generados (guardados en DB, keyed por álbum/norte) y los pasa como
  "NO repitas estas letras" — igual que el `pulso_nucleo`/`fetchRecentCodicePulsos`
  del storyboard.
- A la vez, un **Norte temático** (el hilo del álbum/proyecto) mantiene coherencia.
- **Lenguaje lumínico:** el panel puede generar lyrics en el idioma vocal propio
  (fonemas solares: -ae/-ii/-oo, Raé, Lumi, Solae, Kaii, Sohar, Oriah, Mirabilis,
  luminae, Lioraé…). Guardar un pequeño "léxico lumínico" semilla para consistencia.
- **Regla dura: todos los lyrics de alta frecuencia** (unidad, luz, elevación,
  gratitud, no-dualidad; nunca miedo/escasez/oscuridad).

## 6. OUTPUT PARA SUNO (lo que Zak copia)
- **Título**.
- **Estilo** (campo Styles): género + mood + instrumentación + voz + tempo +
  producción, SIN nombres de artistas.
- **Excluir estilos** (los `-`): parte del ADN + los propios de la dirección.
- **Weirdness sugerido %** · **Style Influence sugerido %** (en ese orden).
- **Instrumental sí/no**.
- **Letra** (si con voz): meta-tags `[Intro][Verso][Coro][Puente][Outro]
  [Instrumental]`, en el idioma elegido (o lenguaje lumínico / vocalizaciones).
- **Notas de config** (modelo Suno v4.5, etc.).

---

## 7. ARQUITECTURA TÉCNICA (a construir)
- **Componente** `Code/FrecuenciasSonoras.tsx` (o split de sello `FS_` si crece >300KB).
  Registrar en `Domo.tsx` (ruta nueva, ej. `/frecuencias`) + `Auth2Header.tsx`
  (ícono + entrada admin en el dropdown, como Atelier) + `NavegadorLente.tsx` (regex
  modo minimal). Estilo holográfico cyan (portar las HoloCards del Escáner).
- **Tablas** (migración nueva):
  - `suno_albums` (id, name, vibe_tag, orden) + `suno_tracks` (id, album_id, title,
    style_prompt, excludes[], weirdness, style_influence, lyrics, orden). Seed desde
    el .md de álbumes. Es el catálogo de Norte/Fusiones.
  - `suno_creations` (las generaciones del panel: semilla, dirección, perillas,
    output completo, weirdness/style_influence, lyrics, álbum/tracks-norte, variaciones,
    galería). Espejo de `vtli_drafts`.
  - `suno_adn` (opcional: destilado global cacheado, como `codices_luz.digest`).
  - RPCs admin (get/create/delete/list) por gateway `admin-action` (patrón Atelier).
- **Edges:**
  - `generate-suno-prompt` — cerebro DeepSeek (OpenRouter, como `oraculo-chat`);
    cascada robusta (retry/backoff/timeout, `isolateJsonObject`); modos: direcciones
    (capa 1), afinar (capa 2), pulido (capa 3), regenerar-lyrics (con anti-repetición
    leyendo `suno_creations` del mismo norte). Salida JSON estructurada.
  - `describe-suno-image` — visión (Gemini o multimodal OpenRouter) para el modo
    imagen → vibe sonoro. ⚠️ Ojo: si usa Gemini, depende del billing de Google (hoy
    en dunning). Preferir un multimodal de OpenRouter para independencia.
- **Patrones reusados 1:1:** "solo prompts" ($0), destilado tipo Códice de Luz,
  regenerar-por-partes (lyrics como la narración), galería, anti-repetición por norte,
  gateway admin-action, HoloCards cyan.

## 8. PENDIENTE / A DEFINIR CON ZAK EN LA IMPLEMENTACIÓN
- Nombre final de la pestaña (candidato: "Frecuencias Sonoras").
- Confirmar cerebro: DeepSeek para texto (recomendado); multimodal para imagen.
- Léxico lumínico semilla (fonemas + reglas) — puedo derivarlo de Códigos Aurora.
- Si el seed de tracks va completo (los 7 álbumes) o por lotes.
