-- 20260709c_suno_frecuencias.sql
-- Panel "Frecuencias Sonoras" — generador de prompts para Suno con el ADN musical
-- de Red Solar Viva. Este archivo crea el CATÁLOGO DE NORTE (los 7 álbumes reales
-- de Spotify + sus 70 tracks, con su style_prompt, excludes, weirdness/style-
-- influence y lyrics lumínicos) y la GALERÍA de creaciones del panel.
--
-- Fuente del seed: admin/RSV DB/Frecuencias Sonoras - Albumes y Tracks.md
-- Convención Suno: los `-` de cada prompt son EXCLUDES; los dos % son
--   (1º Weirdness · 2º Style Influence). Se conservan como columnas.
--
-- Arquitectura (espejo de codices_luz / zakhaar_carousels):
--   · Lockdown RLS SIN policies. Nadie lee/escribe con la anon key directa.
--   · El PANEL lee/edita por RPCs SECURITY DEFINER ruteadas por el gateway
--     admin-action (que inyecta el id admin verificado del token de Clerk).
--   · El EDGE generate-suno-prompt lee el catálogo + escribe la galería con
--     service_role (BYPASSRLS).
--
-- Idempotente: re-correr NO duplica (ON CONFLICT). Pegar en Supabase Dashboard
-- → SQL Editor → New Query → Run.

-- ============================================================
-- 1. TABLAS
-- ============================================================

-- 1.a — ÁLBUMES (el Norte: cada álbum es un arquetipo de dirección sonora)
CREATE TABLE IF NOT EXISTS public.suno_albums (
    id         text PRIMARY KEY,               -- slug estable (referenciado por las fusiones)
    name       text NOT NULL,                  -- nombre display ("LUMERIA")
    vibe_tag   text NOT NULL DEFAULT '',        -- descriptor de vibe (el paréntesis del .md)
    archetype  text NOT NULL DEFAULT '',        -- arquetipo de dirección ("Etéreo Acuático")
    genre      text NOT NULL DEFAULT '',        -- género firma
    orden      int  NOT NULL DEFAULT 0,
    active     boolean NOT NULL DEFAULT true,    -- Zak puede desactivar un álbum del Norte
    created_at timestamptz NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.suno_albums IS
    'Frecuencias Sonoras — catálogo de álbumes (Norte de fusiones). Lockdown RLS; lectura/edición por RPC SECURITY DEFINER (panel) o service_role (edge generate-suno-prompt).';

-- 1.b — TRACKS (cada canción real, con su prompt de Suno descompuesto)
CREATE TABLE IF NOT EXISTS public.suno_tracks (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    album_id        text NOT NULL REFERENCES public.suno_albums(id) ON DELETE CASCADE,
    title           text NOT NULL,
    style_prompt    text NOT NULL DEFAULT '',    -- el texto de estilo (campo "Styles" de Suno), sin los excludes
    excludes        text[] NOT NULL DEFAULT '{}', -- los `-` (campo "Exclude Styles")
    weirdness       int,                          -- 1º % del prompt (NULL si no lo trae)
    style_influence int,                          -- 2º % del prompt (NULL si no lo trae)
    lyrics          text,                         -- lenguaje lumínico si lo hay (exacto)
    orden           int NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT NOW(),
    UNIQUE (album_id, title)
);

COMMENT ON TABLE public.suno_tracks IS
    'Frecuencias Sonoras — tracks reales de los álbumes (corpus del ADN). Se pueden elegir tracks específicos para las fusiones. style_prompt = campo Styles; excludes = los `-`; weirdness/style_influence = los dos % de Suno.';

CREATE INDEX IF NOT EXISTS idx_suno_tracks_album ON public.suno_tracks(album_id, orden);

-- 1.c — CREACIONES (la galería del panel: cada prompt final generado)
CREATE TABLE IF NOT EXISTS public.suno_creations (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title              text NOT NULL DEFAULT '',
    direction_name     text NOT NULL DEFAULT '',   -- nombre de la dirección elegida
    direction          jsonb,                       -- la dirección refinada completa (para regenerar letra)
    seed_text          text NOT NULL DEFAULT '',
    reference_text     text NOT NULL DEFAULT '',    -- referencia "tipo…" (sin nombrar artista)
    project            text NOT NULL DEFAULT '',    -- Norte temático (hilo del proyecto)
    norte_key          text NOT NULL DEFAULT 'libre',-- agrupador para anti-repetición de letras
    norte_album_ids    text[] NOT NULL DEFAULT '{}',
    norte_track_ids    uuid[] NOT NULL DEFAULT '{}',
    norte_creation_ids uuid[] NOT NULL DEFAULT '{}',
    inspiration        text NOT NULL DEFAULT 'med',  -- low | med | high
    norte_mode         text NOT NULL DEFAULT 'anclar',-- anclar | explorar | fusionar
    knobs              jsonb,                        -- estado de las perillas (capa 2)
    instrumental       boolean NOT NULL DEFAULT false,
    lyrics_lang        text,                         -- es | en | luminico | mantra | NULL
    style_prompt       text NOT NULL DEFAULT '',     -- campo "Styles" final para Suno
    excludes           text[] NOT NULL DEFAULT '{}', -- campo "Exclude Styles" final
    weirdness          int,
    style_influence    int,
    lyrics             text,
    config_notes       text NOT NULL DEFAULT '',
    status             text NOT NULL DEFAULT 'ready',-- ready | deleted
    generated_by_clerk_id text NOT NULL DEFAULT '',
    generated_at       timestamptz NOT NULL DEFAULT NOW(),
    CONSTRAINT suno_creations_status_chk CHECK (status IN ('ready', 'deleted'))
);

COMMENT ON TABLE public.suno_creations IS
    'Frecuencias Sonoras — galería de prompts generados. La CAPA 3 (pulido) inserta acá; regenerar-letra actualiza lyrics. norte_key agrupa creaciones del mismo hilo para NO repetir letras (anti-repetición estilo Códice de Luz).';

CREATE INDEX IF NOT EXISTS idx_suno_creations_status ON public.suno_creations(status, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_suno_creations_norte ON public.suno_creations(norte_key, status);

ALTER TABLE public.suno_albums     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suno_tracks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suno_creations  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. SEED — 7 ÁLBUMES
-- ============================================================

INSERT INTO public.suno_albums (id, name, vibe_tag, archetype, genre, orden) VALUES
('lumeria', 'LUMERIA',
 'oceánico · atlante-lyriano · arpa · coro angelical · agua · sanación · cristalino',
 'Etéreo Acuático', 'Ethereal Ambient', 1),
('donde_viven_los_cielos', 'DONDE VIVEN LOS CIELOS',
 'acústico orgánico cinemático · world · vuelo/aventura · strings + flautas + percusión de mano · coro extático · naturaleza viva · Schumann · H3O2',
 'Orgánico Cinemático de Vuelo', 'Cinematic Organic World', 2),
('prisma', 'PRISMA',
 'dos caras: (a) acústico orgánico; (b) Solar Ascending House / Deep Soulful / Liquid House · 4/4 · Rhodes · 963/528 Hz · danza-meditación · euforia espiritual',
 'House Solar Ascendente', 'Deep Soulful / Solar Ascending House', 3),
('punto_de_no_retorno', 'PUNTO DE NO RETORNO',
 'ambient minimalism · Experimental Electronica · Solarwave · disolución de estructura · frecuencias puras · no-dualidad · el silencio es el lienzo',
 'Ambient de Disolución / Solarwave puro', 'Ambient Minimalism / Solarwave', 4),
('donde_la_tierra_aun_canta', 'DONDE LA TIERRA AÚN CANTA',
 'dream ambient · lucidwave · solarwave ancestral · bioluminiscente · pineal drones 432/639 Hz · agua consciente · tribal-etéreo · 64-72 BPM · raíces/memoria planetaria',
 'Ancestral Lucidwave Planetario', 'Lucidwave / Ancestral Solarwave', 5),
('sintonias_de_sol_navegante', 'SINTONÍAS DE SOL NAVEGANTE',
 'Solarwave · ríos de luz · amanecer · sol interior · ligero/ascendente · psybient · organic electronic',
 'Solarwave Luminoso', 'Solarwave / Psybient', 6),
('codigos_aurora', 'CÓDIGOS AURORA',
 'coral etéreo + LENGUAJE SOLAR FONÉTICO cantado · aurora · códigos de luz · del susurro (Silentis) al fuego solar (Ignis/Flamma/Sorah) · crystalline percussion no-earthly',
 'Coral de Lenguaje Solar', 'Ethereal Choir / Solar Phonetics', 7)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. SEED — 70 TRACKS
--    (album_id, orden, title, style_prompt, excludes, weirdness, style_influence, lyrics)
-- ============================================================

INSERT INTO public.suno_tracks (album_id, orden, title, style_prompt, excludes, weirdness, style_influence, lyrics) VALUES

-- ─── LUMERIA ───
('lumeria', 1, 'Lumeria',
 $P$Ethereal Ambient, Water Sounds, Harp, Liquid Texture, Serene, Flowing Orchestra, Angelic Voice (Texture), Healing, Peaceful, Crystal Clear$P$,
 ARRAY['Drums','Heavy','Dark','Fast','Aggressive','Choppy','Dry'], NULL, NULL, NULL),
('lumeria', 2, 'Kaelia',
 $P$Ethereal Ambient, Water Sounds, Harp, Liquid Texture, Serene, Flowing Orchestra, Angelic Voice (Texture), Healing, Peaceful, Crystal Clear$P$,
 ARRAY['Drums','Heavy','Dark','Fast','Aggressive','Choppy','Dry'], 80, 80, NULL),
('lumeria', 3, 'Aurum',
 $P$Ethereal Ambient, Magical Realism, Sparkling, Uplifting, Nature Sounds (Subtle), New Age, Celestial, Dreamy, Harmonic, Atmospheric, Soft Orchestral Pads, Chimes, Ascending Melodies$P$,
 ARRAY['Dark','Heavy','Aggressive','Melancholy','Chaotic','Industrial','Fast Tempo','Percussive'], NULL, NULL, NULL),
('lumeria', 4, 'Lyra',
 $P$Ethereal, Ambient, Sacred Water, Atlantean Atmosphere, Crystal Ambient, Peaceful, Serene, Cinematic Pads, Ethereal Female Choir, Harp, Ancient Civilization$P$,
 ARRAY['Aggressive','Dark','Heavy','Fast Tempo','Percussive','Drums','Chaotic','Tense','Rock','Loud'], NULL, NULL, NULL),
('lumeria', 5, 'Cristalis',
 $P$Cinematic Orchestral, Glass Harmonica, Soaring Melodies, Majestic, Uplifting, Sacred Geometry Sound, Atmospheric, Wide Stereo, Celestial Choir$P$,
 ARRAY['Dark','Tense','Fast','Chaotic','Low Quality','Noise'], NULL, NULL, NULL),
('lumeria', 6, 'Amarae',
 $P$Ethereal Ambient, Water Sounds, Harp, Liquid Texture, Serene, Flowing Orchestra, Angelic Voice (Texture), Healing, Peaceful, Crystal Clear$P$,
 ARRAY[]::text[], NULL, NULL, NULL),
('lumeria', 7, 'Nereia',
 $P$Ethereal Ambient, Water Sounds, Harp, Liquid Texture, Serene, Flowing Orchestra, Angelic Voice (Texture), Healing, Peaceful, Crystal Clear$P$,
 ARRAY['Drums','Heavy','Dark','Fast','Aggressive','Choppy','Dry'], NULL, NULL,
 $L$Am-nis... rae. (Shala... lu) Fluya... via... / (La corriente sube de tono - brillo) / Omah... elya. (Luz líquida) Sola-vae... amnis.$L$),
('lumeria', 8, 'Cealuma',
 $P$Ambient, Ethereal, Serene, Cosmic Soundscape, Magical, Enchanting, Sparkling Textures, Shimmering, Meditative, Cinematic Pads, Celestial, Peaceful, Dreamy$P$,
 ARRAY['Aggressive','Dark','Heavy','Fast Tempo','Percussive','Drums','Chaotic','Tense','Melancholy','Sad'], 55, 35, NULL),
('lumeria', 9, 'Seleneia',
 $P$Ambient, Ethereal, Serene, Cosmic Soundscape, Magical, Enchanting, Sparkling Textures, Shimmering, Meditative, Cinematic Pads, Celestial, Peaceful, Dreamy$P$,
 ARRAY['Aggressive','Dark','Heavy','Fast Tempo','Percussive','Drums','Chaotic','Tense','Melancholy','Sad'], 70, 35, NULL),

-- ─── DONDE VIVEN LOS CIELOS ───
('donde_viven_los_cielos', 1, 'Donde viven los cielos',
 $P$Purely acoustic organic cinematic textures: soaring warm strings unfolding like giant living wings of earth and forest, breathy wooden flutes and pan flutes dancing on warm winds, soft joyful hand percussion and frame drums pulsing with the heartbeat of the world, radiant ethereal choir overflowing with pure ecstatic wonder and laughter, subtle wind, distant waterfalls and bird calls, continuous gentle forward gliding movement like riding the back of a living dragon through endless skies, pure positive joy and hopeful discovery where heavens are born$P$,
 ARRAY['synths','pads','electronic','arpeggios','digital effects','drums','guitars','rock','pop vocals','dark','solemn','dramatic'], 20, 85, NULL),
('donde_viven_los_cielos', 2, 'Primer Encuentro',
 $P$This organic world music piece opens with breathy alien flutes and faint hand percussion, surrounded by a soft bioluminescent synth texture. Warm strings swell as the sun rises, textures bloom with airy drones, gentle woodwinds, and layered percussion, evoking peaceful adventure and awakening$P$,
 ARRAY['electronic','metal','rap','dark ambient'], 65, 85, NULL),
('donde_viven_los_cielos', 3, 'Ascenso Fractal',
 $P$Epic soaring orchestral, majestic tribal flight, ethnic wind instruments, vast open sky, cinematic world music, ethereal vocal pads, awe-inspiring, lush acoustic, boundless freedom, huge crescendo$P$,
 ARRAY['synth bass','aggressive beats','electronic dance','pop structure','lyrics','fast percussion','tension','fear','dark cinematic'], NULL, NULL, NULL),
('donde_viven_los_cielos', 4, 'Bienvenido a Bordo',
 $P$This organic world music piece opens with breathy alien flutes and faint hand percussion, surrounded by a soft bioluminescent synth texture. Warm strings swell as the sun rises, textures bloom with airy drones, gentle woodwinds, and layered percussion, evoking peaceful adventure and awakening$P$,
 ARRAY['electronic','metal','rap','dark ambient'], 65, 85, NULL),
('donde_viven_los_cielos', 5, 'Vuelo Nocturno',
 $P$The piece opens with deep, organic cinematic textures—layered distant strings and airy woodwinds drift over gentle, breath-like field recordings. Gradually, airy synth pads and soft pulsating percussion (attuned to the Schumann resonance) emerge, building to glowing, bioluminescent swells and expansive orchestration, culminating in an awe-filled, weightless grandeur$P$,
 ARRAY['drums','guitars','electronic dance','rock','pop vocals'], 18, 85, NULL),
('donde_viven_los_cielos', 6, 'Estrellas Interiores',
 $P$Rivers of H3O2 flowing with light, Crystal-clear water textures, liquid light arpeggios cascading, deep resonant sub-bass is the planetary bloodstream, bioluminescent pads shimmer like moonlit rivers, ethereal choir becomes the voice of every droplet remembering its origin, floating caravan of water through glowing canyons, infinite purity and healing$P$,
 ARRAY['drums','guitars','electronic dance','rock','pop vocals'], 20, 85, NULL),
('donde_viven_los_cielos', 7, 'Medusas de cielo nocturno',
 $P$Begin with immersive cosmic drones swelling in indigo layers, underpinned by subsonic bass pulses. Sonic arpeggios resembling crystal latticework entwine with airy flutes, while heartbeat percussion absorbs alien energy—glitchy, spectral, and free of organic trace. Plasma synths radiate above a soft, luminous choir—voices processed to glow like nebulae—embracing boundless, floating euphoria in the outro$P$,
 ARRAY['drums','guitars','electronic dance','rock','pop vocals'], 40, 70, NULL),
('donde_viven_los_cielos', 8, 'Colores del Nuevo Espectro',
 $P$Rivers of H3O2 flowing with light, crystal-clear water textures, flowing harmonic light currents, deep resonant sub-bass like a planetary bloodstream, bioluminescent pads shimmer like moonlit rivers, ethereal choir becomes the voice of every droplet remembering its origin, floating caravan of water through glowing canyons, infinite purity and healing$P$,
 ARRAY['drums','guitars','electronic dance','rock','pop vocals'], NULL, NULL, NULL),
('donde_viven_los_cielos', 9, 'Comunicación Interplanetaria',
 $P$Rivers of H3O2 flowing with light, Crystal-clear water textures, liquid light arpeggios cascading, deep resonant sub-bass is the planetary bloodstream, bioluminescent pads shimmer like moonlit rivers, ethereal choir becomes the voice of every droplet remembering its origin, floating caravan of water through glowing canyons, infinite purity and healing$P$,
 ARRAY['drums','guitars','electronic dance','rock','pop vocals'], NULL, NULL, NULL),
('donde_viven_los_cielos', 10, 'Salto Cuántico',
 $P$This epic uplifting cinematic finale unfolds with soaring orchestral swells, radiant brass, and cascading strings layered over delicate crystal chimes. Ethereal vocalizations and a high Schumann resonance choir weave through golden-blue luminous harmonics. Organic percussion pulses beneath, with intricate synth textures and resonant bass evoking futuristic spiritual triumph. The arrangement rises in intensity, blending quantum-inspired melodic motifs and lush choral grandeur, culminating in a radiant, eternal harmony that marries the organic and the crystalline in transcendent symphonic unity$P$,
 ARRAY['rock','hip hop','metalcore','techno','blues'], 35, 88, NULL),
('donde_viven_los_cielos', 11, 'Un Nuevo Horizonte',
 $P$Cinematic tribal ambient, lush alien jungle, organic ethnic woodwinds, ethereal wordless choir, sweeping orchestral strings, majestic nature, immersive world music, bioluminescent soundscape, pure awe, continuous flow$P$,
 ARRAY['Fast electronic beats','techno','EDM','trap','rap vocals','aggressive percussion','industrial sounds','distorted synths','heavy bass drops','tense cinematic scoring','horror atmosphere','dark drones','chaotic rhythms','fast tempo','jazzy improvisation','country elements','solo piano pieces','dramatic trailer music'], 20, 70, NULL),
('donde_viven_los_cielos', 12, 'Sellando el día',
 $P$The piece opens with lush, soaring string ensembles that swell and ebb like wings in flight, underscored by gentle, earthy frame drums and joyful hand percussion pulsing softly. Breathy wooden flutes and pan flutes weave playful, uplifting melodies, carried on warm gusts. An ethereal choir radiates ecstatic energy, layered with subtle wind, distant waterfalls, and birdsong, all blending into a vibrant, forward-moving current—each section growing in warmth and awe, inviting boundless discovery$P$,
 ARRAY['synths','pads','electronic','arpeggios','digital effects','drums','guitars','rock','pop vocals','dark','solemn','dramatic'], 20, 85, NULL),

-- ─── PRISMA ───
('prisma', 1, 'Prisma',
 $P$The piece opens with lush, soaring string ensembles that swell and ebb like wings in flight, underscored by gentle, earthy frame drums and joyful hand percussion pulsing softly. Breathy wooden flutes and pan flutes weave playful, uplifting melodies, carried on warm gusts. An ethereal choir radiates ecstatic energy, layered with subtle wind, distant waterfalls, and birdsong, all blending into a vibrant, forward-moving current—each section growing in warmth and awe, inviting boundless discovery$P$,
 ARRAY['synths','pads','electronic','arpeggios','digital effects','drums','guitars','rock','pop vocals','dark','solemn','dramatic'], 20, 85, NULL),
('prisma', 2, 'Pulso Radiante',
 $P$Solar Ascending House, Deep soulful house with uplifting "solar" energy, Bright shimmering pads, warm Rhodes chords, soft analog bass with upward movement, 4/4 dance beat, open hi-hats, soft shakers, smooth sidechain breathing, Melodic elements inspired by a cosmic sunrise: glowing plucks, airy vocal textures, and arpeggios rising like solar flares, Atmospheric space-reverb, 963 Hz harmonic overtones, ethereal ambience, Vibe: spiritual, warm, futuristic, elegant, emotionally elevating, Mix: Wide stereo, clean punchy kick, smooth low end, glossy sparkling highs, Perfect for meditation-dance and luminous ascension$P$,
 ARRAY['hyperpop','trap','dubstep','glitch','metal','lofi','chiptune','harsh noise','dark techno','reggaeton','big room','edm festival'], 8, 75, NULL),
('prisma', 3, 'Halo',
 $P$A deep soulful house track opens with lush, bright pads and warm Rhodes chords, anchored by soft analog bass lifting upwards. Powered by a 4/4 dance beat, open hi-hats and shakers blend with smooth sidechain pumps. Glowing plucks, airy vocal layers, and ascending arps evoke a cosmic sunrise. Atmospheric space-reverb and 963 Hz harmonics deepen the ethereal feel. The mix is wide, with a clean, punchy kick, smooth low end, and glossy, sparkling highs—crafted for a spiritual, futuristic, emotionally elevating journey$P$,
 ARRAY['hyperpop','trap','dubstep','glitch','metal','lofi','chiptune','harsh noise','dark techno','reggaeton','big room','edm festival'], 8, 75, NULL),
('prisma', 4, 'Solaris Glow',
 $P$Solar Ascending House, Deep soulful house with uplifting "solar" energy, Bright shimmering pads, warm Rhodes chords, soft analog bass with upward movement, 4/4 dance beat, open hi-hats, soft shakers, smooth sidechain breathing, Melodic elements inspired by a cosmic sunrise: glowing plucks, airy vocal textures, and arpeggios rising like solar flares, Atmospheric space-reverb, 963 Hz harmonic overtones, ethereal ambience, Vibe: spiritual, warm, futuristic, elegant, emotionally elevating, Mix: Wide stereo, clean punchy kick, smooth low end, glossy sparkling highs, Perfect for meditation-dance and luminous ascension$P$,
 ARRAY['hyperpop','trap','dubstep','glitch','metal','lofi','chiptune','harsh noise','dark techno','reggaeton','big room','edm festival'], NULL, NULL, NULL),
('prisma', 5, 'Fractal Interior',
 $P$Solar Ascending House, Deep soulful house with uplifting "solar" energy, Bright shimmering pads, warm Rhodes chords, soft analog bass with ascending groove, 4/4 dance beat, open hi-hats, soft shakers, smooth sidechain, Melodic elements inspired by cosmic sunrise: glowing plucks, airy vocal textures, light arpeggios rising like solar flares, Atmospheric space-reverb, harmonic overtones (963 Hz inspired), ethereal ambience, Vibe: spiritual, warm, futuristic, elevating, elegant, Mix: Wide stereo, clean kick, smooth low end, glossy highs, Perfect for movement, meditation-dance, and luminous ascension$P$,
 ARRAY['hyperpop','trap','dubstep','glitch','metal','lofi','chiptune','harsh noise','dark techno','reggaeton'], NULL, NULL, NULL),
('prisma', 6, 'Cristal Kinético',
 $P$Soulful House track with bright, crisp production, featuring a tight, precise kick and airy space. Intricate, micro-house-inspired percussion sparkles with glassy samples and refractive textures. Glockenspiel and harp weave through uplifting geometric arpeggios, sculpting prismatic, joyful melodies above lush synth layers. Futuristic elegance emerges from transparent mix depth and tonal clarity, enhanced by 963 Hz-infused pads, all wrapped in a spacious, intelligent groove$P$,
 ARRAY['Muddy','dark','trap','rock','screaming','noise','industrial','slow','sad'], NULL, NULL, NULL),
('prisma', 7, 'Helix Sun',
 $P$Solar Ascending House, Deep soulful house with uplifting "solar" energy, Bright shimmering pads, warm Rhodes chords, soft analog bass with upward movement, 4/4 dance beat, open hi-hats, soft shakers, smooth sidechain breathing, Melodic elements inspired by a cosmic sunrise: glowing plucks, airy vocal textures, and arpeggios rising like solar flares, Atmospheric space-reverb, 963 Hz harmonic overtones, ethereal ambience, Vibe: spiritual, warm, futuristic, elegant, emotionally elevating, Mix: Wide stereo, clean punchy kick, smooth low end, glossy sparkling highs, Perfect for meditation-dance and luminous ascension$P$,
 ARRAY['hyperpop','trap','dubstep','glitch','metal','lofi','chiptune','harsh noise','dark techno','reggaeton','big room','edm festival'], 8, 75, NULL),
('prisma', 8, 'Zenon',
 $P$Solar Euphoria Ascendente, Uplifting house with euphoric ascending energy, bright cosmic pads, shimmering leads, warm Rhodes chords, and emotional melodic build-ups, Clean punchy 4/4 kick, wide stereo hi-hats, airy shakers, and smooth sidechain breathing, Analog bassline with an upward motion, glowing plucks that rise like solar flares, and celestial vocal textures floating in the background, Epic chord progressions, luminous arpeggios, spacious reverb, harmonic overtones (963 Hz inspired), Vibe: uplifting, radiant, transcendent, futuristic, emotionally elevating, Mix: clear low end, glossy sparkling highs, warm mid harmonics, festival-grade euphoria with spiritual elegance$P$,
 ARRAY['hyperpop','trap','dubstep','glitch','metal','lofi','chiptune','harsh noise','dark techno','reggaeton'], NULL, NULL, NULL),
('prisma', 9, 'Plasma',
 $P$Solar Euphoria Ascendente, Uplifting house with euphoric ascending energy, bright cosmic pads, shimmering leads, warm Rhodes chords, and emotional melodic build-ups, Clean punchy 4/4 kick, wide stereo hi-hats, airy shakers, and smooth sidechain breathing, Analog bassline with an upward motion, glowing plucks that rise like solar flares, and celestial vocal textures floating in the background$P$,
 ARRAY['hyperpop','trap','dubstep','glitch','metal','lofi','chiptune','harsh noise','dark techno','reggaeton'], 30, 80, NULL),
('prisma', 10, 'Fluido Neón',
 $P$Deep Liquid House pulses with a gentle 4/4 groove; lush submerged pads and smooth sub-bass create a weightless, aquatic blanket. Clean Rhodes with soft delay trades phrases with angelic, echoing vocal chops. Bioluminescent textures accent high frequencies, while 528 Hz resonance saturates the mids. Danceable, yet sophisticated and lounge-ready, the mix is warm, enveloping, and spacious, with every element crisp and high fidelity$P$,
 ARRAY['Aggressive','Dry','distort','aggressive dubstep','jarring','chaotic','dark','heavy techno','lo-fi'], 45, NULL, NULL),
('prisma', 11, 'Aureon',
 $P$Deep Liquid House pulses with a gentle 4/4 groove; lush submerged pads and smooth sub-bass create a weightless, aquatic blanket. Clean Rhodes with soft delay trades phrases with angelic, echoing vocal chops. Bioluminescent textures accent high frequencies, while 528 Hz resonance saturates the mids. Danceable, yet sophisticated and lounge-ready, the mix is warm, enveloping, and spacious, with every element crisp and high fidelity$P$,
 ARRAY['Aggressive','Dry','distort','aggressive dubstep','jarring','chaotic','dark','heavy techno','lo-fi'], NULL, NULL, NULL),
('prisma', 12, 'Novaia',
 $P$Deep Liquid House, underwater solar atmosphere, submerged pads, smooth sub-bass rolling gently, 4/4 groove with soft aquatic textures, Bioluminescent sound design, clean electric piano (Rhodes) with delay, echoing vocal chops (angelic), flow state energy, 528 Hz resonance, sophisticated lounge vibe but danceable, warm and wrapping, high fidelity mix$P$,
 ARRAY['Aggressive','Dry','distort','aggressive dubstep','jarring','chaotic','dark','heavy techno','lo-fi'], 45, NULL, NULL),

-- ─── PUNTO DE NO RETORNO ───
('punto_de_no_retorno', 1, 'Despliegue Inicial',
 $P$An Ambient Minimalism, Experimental Electronica piece in Solarwave genre opens with a warm, pulsing bed at 963Hz, layered with subtle drones and spacious reverberated tones at 222Hz and 639Hz. Gradually, all structure dissolves; rhythm dissipates, leaving floating granules, spectral textures, and swirling cinematic layers that become pure auditory presence, evoking memory over form$P$,
 ARRAY['Pop','Rock','Trap','Hip-Hop','Jazz','Funk','Reggaeton','Singer-Songwriter'], 65, 30, NULL),
('punto_de_no_retorno', 2, 'Fractura Dulce',
 $P$The song opens with a gentle ambient bed—muted pads and subtle piano. Glitch elements and fragmented textures gradually seep in, twisting the harmony. Percussion starts restrained then distorts and fades, leaving broken syncopations. The outro disassembles into sparse, fragile sounds, evoking a fading memory$P$,
 ARRAY['Pop','Rock','Funk','Hip-Hop','Reggaeton','EDM','Orchestral'], 72, 27, NULL),
('punto_de_no_retorno', 3, 'Nada se perdió',
 $P$A meditative ambient piece: warm analog pads subtly layered at 528Hz and 639Hz, joined by gentle heartfield textures and faint solarwave sweeps. A slow, repeating pattern rests atop a 13Hz pulse, with no dramatic shifts—textures subtly evolve, fostering restful, healing stillness$P$,
 ARRAY['Pop','Orchestral','Dramatic Score','Lo-fi','Trap','Dance','Jazz','Funk'], 45, 35, NULL),
('punto_de_no_retorno', 4, 'Luz que no necesita futuro',
 $P$A meditative ambient piece unfolds with continuous, layered sine waves tuned to 963Hz, 432Hz, and 111Hz, undulating gently in long, overlapping drones. The texture is smooth and enveloping, with crystalline high pads and analog warmth blending seamlessly. No percussion, melody, or progression—just an expansive, floating field of sonics. The arrangement maintains a subtle interplay of harmonic overtones, sustained atmospheric presence, and minute fluctuations in timbre, evoking stillness and pure being$P$,
 ARRAY['Pop','Synthwave','Percussive','Cinematic','Jazz','Trap','Tension'], 35, 25, NULL),
('punto_de_no_retorno', 5, 'Nada necesita cambiar',
 $P$Solarwave, Peaceful Static Field, Deep Inner Home, Emotional Stillness, Pineal Resonance. A sound field that feels like nothing needs to change, 285Hz + 396Hz + 852Hz base, gentle harmonic pads, no movement forward, Solarwave frequency$P$,
 ARRAY['Cinematic','Pop','Ambient Drone','Tension','Motivational','Experimental'], 20, 15, NULL),
('punto_de_no_retorno', 6, 'Reflejos de Luz',
 $P$A longform ambient piece spans 3:03 minutes with an unbroken, textureless sound mass. 963 Hz microharmonics subtly overlay a 111 Hz foundational tone, both enveloped in deep, breath-like synth washes. Sustain 2 Hz binaural undertones barely perceptible, expanding a continuous, formless present$P$,
 ARRAY['Pop','EDM','Jazz','Rock','Orchestral','Trap','Dance','Funk','Soundtrack'], NULL, NULL, NULL),
('punto_de_no_retorno', 7, 'El fin de la separación',
 $P$Solarwave, Unity Field, Interbeing Frequency, Sacred Stillness, Pure Connection$P$,
 ARRAY['Drama','Conflict','Tension','Percussion-heavy','Cinematic'], NULL, NULL, NULL),
('punto_de_no_retorno', 8, 'Cero lineal',
 $P$A longform ambient piece spans 3:03 minutes with an unbroken, textureless sound mass. 963 Hz microharmonics subtly overlay a 111 Hz foundational tone, both enveloped in deep, breath-like synth washes. Sustain 2 Hz binaural undertones barely perceptible, expanding a continuous, formless present$P$,
 ARRAY['Pop','EDM','Jazz','Rock','Orchestral','Trap','Dance','Funk','Soundtrack'], NULL, NULL, NULL),
('punto_de_no_retorno', 9, 'Reconocimiento Silente',
 $P$In this sonic minimalism piece, layered tones of 888 Hz and 333 Hz create a soft, continuous field—no melody or rhythm, but subtle, sustained textures. Fold in barely perceptible pulses—structured silence—so the listener feels gently enveloped. Each "sound" is a held presence; silence is the canvas$P$,
 ARRAY['Pop','Rock','EDM','Funk','Jazz','Trap'], NULL, NULL, NULL),
('punto_de_no_retorno', 10, 'Un Nuevo Horizonte',
 $P$Solarwave, Gentle Restoration, Memory Integration, Emotional Stillness, Heartfield Tones, Subtle Healing$P$,
 ARRAY['Pop','Orchestral','Dramatic Score','Lo-fi','Trap','Dance','Jazz','Funk'], NULL, NULL, NULL),
('punto_de_no_retorno', 11, 'Nodo en suspensión',
 $P$A longform ambient piece spans 3:03 minutes with an unbroken, textureless sound mass. 963 Hz microharmonics subtly overlay a 111 Hz foundational tone, both enveloped in deep, breath-like synth washes. Sustain 2 Hz binaural undertones barely perceptible, expanding a continuous, formless present$P$,
 ARRAY['Pop','EDM','Jazz','Rock','Orchestral','Trap','Dance','Funk','Soundtrack'], NULL, NULL, NULL),

-- ─── DONDE LA TIERRA AÚN CANTA ───
('donde_la_tierra_aun_canta', 1, 'Eywa Interior',
 $P$This dream ambient piece weaves lucidwave synth pads layered with bioluminescent glows and pineal drones at 432Hz/639Hz. Solarwave textures pulse softly, merging with organic field-recorded tribal echoes—flutes, breathy chants, coral-inspired resonances. Ethereal, arrhythmic atmospheres ebb and flow, evoking living planetary memory and transcendent unity$P$,
 ARRAY['Vocals','Pop','Synthwave','Orchestral Cinematic','Electronic Beat'], NULL, NULL, NULL),
('donde_la_tierra_aun_canta', 2, 'El agua recuerda tu nombre',
 $P$Ethereal ambient, flowing water textures, organic percussion, lucidwave, solarwave ancestral, whale song echoes, reflective atmosphere. A channel of crystalline water flowing slowly, as if each drop carried an ancient and personal memory. A soft, enveloping sonority: an aquatic foundation with deep, organic lows (like distant water drums or the resonances of bowls), over which fluid, shimmering melodies drift — almost like whale songs or gentle wind instruments. Moments where the flow widens and the music breathes more, as if the water paused to reveal a reflection. Sensation: the listener realizes they are not hearing the water… the water is hearing them$P$,
 ARRAY['aggressive beats','heavy distortion'], 40, 65, NULL),
('donde_la_tierra_aun_canta', 3, 'Comunicación con el Núcleo',
 $P$At 64–72 BPM, the song opens with deep, gentle pulses, setting a meditative pace. Ethereal strings drift in, layered with airy and watery pads, conjuring spaciousness. Submerged crystal resonances add a luminous undercurrent. Every 8–16 bars, distant mixed-choir chants and soft, sparse wooden percussion punctuate the expanding, astral textures, evoking a sensation of boundless upward and outward growth$P$,
 ARRAY['defined/steady beats','heavy bass','aggressive metallic percussion'], NULL, NULL, NULL),
('donde_la_tierra_aun_canta', 4, 'Claro de Agua Luminosa',
 $P$At 64–72 BPM, the song opens with deep, gentle pulses, setting a meditative pace. Ethereal strings drift in, layered with airy and watery pads, conjuring spaciousness. Submerged crystal resonances add a luminous undercurrent. Every 8–16 bars, distant mixed-choir chants and soft, sparse wooden percussion punctuate the expanding, astral textures, evoking a sensation of boundless upward and outward growth$P$,
 ARRAY['defined/steady beats','heavy bass','aggressive metallic percussion'], NULL, NULL, NULL),
('donde_la_tierra_aun_canta', 5, 'Capas de Recordación',
 $P$Ancestral Solarwave + Ambient Lucidwave, Base pulse: 64–72 BPM, slow and deep breathing, Textures: ethereal strings, airy and watery pads, submerged crystal resonances, Punctual elements: distant, diffuse mixed-choir chants; soft, sparse wooden percussion (every 8–16 bars), Sensation: expansion from the heart upward and outward, as if the crown of a tree were opening in slow motion$P$,
 ARRAY['defined/steady beats','heavy bass','aggressive metallic percussion'], NULL, NULL, NULL),
('donde_la_tierra_aun_canta', 6, 'Raíz que sueña en espiral',
 $P$Begin with atmospheric ethereal ambient layers and subtle organic textures; a ceremonial drum sets a slow, reverberant pulse, anchoring the sound. Crystalline arpeggios spiral upward in lucidwave fashion, weaving solarwave ancestral harmonies. Midway, all sound drops to total silence before returning—now deeper, more expansive, with earthy resonance and swirling, spiral motion as textures build, creating the sensation of ascending and descending roots in unity$P$,
 ARRAY['harsh distortion','modern pop'], NULL, NULL, NULL),
('donde_la_tierra_aun_canta', 7, 'Raíz sin nombre',
 $P$The track layers ambient drone textures with deep, subterranean hums evoking vegetal resonance. Ethereal echoes pan laterally, materializing and vanishing at unpredictable intervals. Hazy synths and bioluminescent field recordings create a weightless wash, punctuated by soft, breath-like swells$P$,
 ARRAY['Beats','Orchestral','Melodic Elements'], NULL, NULL, NULL),

-- ─── SINTONÍAS DE SOL NAVEGANTE ───
('sintonias_de_sol_navegante', 1, 'Jardín interior',
 $P$The track layers ambient drone textures with deep, subterranean hums evoking vegetal resonance. Ethereal echoes pan laterally, materializing and vanishing at unpredictable intervals. Hazy synths and bioluminescent field recordings create a weightless wash, punctuated by soft, breath-like swells$P$,
 ARRAY['Beats','Orchestral','Melodic Elements'], NULL, NULL, NULL),
('sintonias_de_sol_navegante', 2, 'Ríos de luz',
 $P$Ambient + Psybient + Organic Electronic, shimmering light rivers, fluid crystalline tones, gentle arpeggios like water ripples, sun reflections, ethereal pads flowing, serene and uplifting, immersive spatial motion$P$,
 ARRAY['Melancholic','Heavy','Percussion-driven'], NULL, 55, NULL),
('sintonias_de_sol_navegante', 3, 'Aliento de Sol',
 $P$ambient, cinematic, ethereal, solarwave, soft nature textures, immersive and airy, natural spaciousness$P$,
 ARRAY['dark','melancholic','aggressive'], 45, 55, NULL),
('sintonias_de_sol_navegante', 4, 'Prisma Suspendido',
 $P$ambient, cinematic, ethereal, solarwave, soft nature textures, Floating and crystalline sonority, like a prism suspended in the air reflecting sun rays in all directions, Light layers of soft synthesizers, echoes of water droplets, and an ethereal rhythmic pulse flowing unhurriedly, evoking a play of light and color in suspension, A delicate sound that invites you to close your eyes, breathe, and feel your inner sun vibrate$P$,
 ARRAY['dark','melancholic','aggressive','heavy beats'], NULL, NULL, NULL),
('sintonias_de_sol_navegante', 5, 'Amanecer sin fronteras',
 $P$Ambient, cinematic, ethereal, solarwave, sunrise textures, uplifting horizon tones, The sensation of a sunrise without edges or limits, where light expands in all directions, Long, soft waves, crystalline pads, bells, and ascending arpeggios like sun rays illuminating the entire horizon, The final pulse of the score leaves the listener floating, with the memory of the inner Sun radiating in all directions$P$,
 ARRAY['dark','melancholic','heavy','percussive'], NULL, NULL, NULL),
('sintonias_de_sol_navegante', 6, 'Puente de Niebla',
 $P$ambient, cinematic, ethereal, solarwave, misty soft textures$P$,
 ARRAY['dark','tense','melancholic','industrial'], NULL, NULL, NULL),
('sintonias_de_sol_navegante', 7, 'Cápsula Viva',
 $P$Opening with layers of lush synth pads and airy, pitched vocal harmonies, the soundscape mimics a living dome—warm and resonant yet airy. Faint pulses and evolving textures ebb and flow, adorned by gentle echoes and subtle bioluminescent timbres. Everything swirls in a fluid, circular motion, as organic bass tones and soft percussive accents pulsate with an earthly, solar energy—forming an immersive, evolving sonic sphere$P$,
 ARRAY['dark','tense','melancholic','industrial'], NULL, NULL, NULL),

-- ─── CÓDIGOS AURORA ───
('codigos_aurora', 1, 'Aurora',
 $P$Layers of crystalline ambient arpeggios and airy pads float above slow, deep, pulsating synths that grow subtly, mirroring an expanding solar heartbeat. Male and female voices intertwine, intoning radiant phonetic syllables as vocal textures, drifting like seeds in a spacious sonic landscape$P$,
 ARRAY['Rock','Metal','Hip-hop','Punk'], 60, 40,
 $L$Raé – Lumina – Sohar – Etú – Veyah$L$),
('codigos_aurora', 2, 'Genesis',
 $P$Core: Phonetic solar language sung, as if they were vocal seeds sown into space. Intention: Opening of the axis, sensation of an aurora unfolding on the skin → vibration of a "new dawn." Ethereal ambient sounds (crystalline arpeggios, light pads), Interwoven female and male voices singing solar syllables (Raé, Solara, Lumiah, Tehuan, Zorah), Slow deep pulses, like an expanding solar heartbeat$P$,
 ARRAY['Rock','Metal','Hip-hop','Punk'], NULL, NULL, NULL),
('codigos_aurora', 3, 'Mirabilis',
 $P$Ethereal ambient choir with solar phonetics (non-linear phonetic codes, not human language), Fragments like radiant bursts, shimmering, without linear structure, Long sustained vowels "ae", "ii", "oo", Ethereal, luminous choral, with crystalline textures and expansive pulses$P$,
 ARRAY['dark','heavy','minimalist'], 65, 60,
 $L$Lirae sohanae, / Eshira lumi kaii… / Oriah, oriah, solum naa, / Mirraé, shonata, / Kaiirae, luminaa… / Solae… Solae… / Mirabilis aurorae… / Eshaa torae, lumira kai, / Oriah… Oriah… / Mirabilis, luminae…$L$),
('codigos_aurora', 4, 'Seraphis',
 $P$Solar phonetics, radiant choirs, symphonic light orchestra, powerful ascending harmonics, grand luminous percussion$P$,
 ARRAY['dark','heavy','minimalist'], 45, 70,
 $L$Seraphis… LUMAE! / Kaii tora… ESHAA RAE! / Orum, ORUM SOLARAE, / Mirraé… Luminae… / Soharii! Shantaa! / Lirae! Solum Kai! / SERAPHIS AURORAE! / Lumae TORAA! / SOLAE!! SOLAE!!!$L$),
('codigos_aurora', 5, 'Harmonia',
 $P$An ethereal choir floats atop gentle string textures, with subtle crystalline percussion adding delicate sparkle. Layered vocal lines move independently, crossing and diverging before merging into a unison sustained note, each voice orbiting its own pitch axis before intertwining fluidly$P$,
 ARRAY['rock','metal','hip-hop','trap','rap','country','folk','funk','dubstep','edm heavy'], NULL, NULL, NULL),
('codigos_aurora', 6, 'Visiones Auris',
 $P$Ethereal choir + long strings + crystalline harps$P$,
 ARRAY['rock','metal','hip-hop','trap','rap','country','folk','funk','dubstep','edm heavy'], 40, 75,
 $L$Lioraé… luminaa… kaii-esharae… / Solurae… mirai-torah… / Aurorae… visionis… solarae… / Lioraé, lioraé, infinitaa… / Esharae, torah kaii, luminaa… / So-lum, so-lum, eternaa… / Visionis, auris, auris, mirabilis… / Lioraé… luminaa… kaii-esharae… / So-lum, so-lum, eternaa… / Solurae, solurae, solarae… / Aurorae… visionis… infinitaa…$L$),
('codigos_aurora', 7, 'Visionis Infinita',
 $P$Opening with an ethereal choir floating over sustained, lush long strings, the soundscape evolves as crystalline harps cascade arpeggios through the texture. Layers build in gentle waves, intertwining voices and harmonic swells, creating a luminous, celestial atmosphere throughout$P$,
 ARRAY['rock','metal','hip-hop','trap','rap','country','folk','funk','dubstep','edm heavy'], 40, 65,
 $L$Lioraé… luminaa… kaii-esharae… / Solurae… mirai-torah… / Aurorae… visionis… solarae… / Lioraé, lioraé, infinitaa… / Esharae, torah kaii, luminaa… / So-lum, so-lum, eternaa… / Visionis, auris, auris, mirabilis… / Lioraé… luminaa… kaii-esharae… / So-lum, so-lum, eternaa… / Solurae, solurae, solarae… / Aurorae… visionis… infinitaa…$L$),
('codigos_aurora', 8, 'Silentis',
 $P$Ethereal Ambient, Soft choirs (almost whispered), Crystalline pads, Slow spacious pulses, A very light layer of bowls or long harmonics$P$,
 ARRAY['electronic rhythms','orchestral epic','pop'], NULL, NULL, NULL),
('codigos_aurora', 9, 'Spatium',
 $P$This expansive ambient track opens with ethereal choirs drenched in reverb, floating above vast, atmospheric pads that stretch across the soundscape. Cascading crystalline tones glimmer throughout, while subtle harmonics in the background evoke the mystique of cosmic chants$P$,
 ARRAY['percussive','electronic beats','guitars','earthly instruments','pop vocals'], 70, 45,
 $L$Soliiiii… aaahh… / Oriaaa… hum… / Lumi… aaeee… / Shaa… noooh… / Silentiiiis… / Oooohh… (×2)$L$),
('codigos_aurora', 10, 'Sorah',
 $P$Epic choral + crystalline electronic elements, Ascending rhythms (ethereal crystal-like percussion, not earthly drums), Fiery pads with luminous crescendos, Touches of bright strings and brass evoking solar fire$P$,
 ARRAY[]::text[], 60, 75,
 $L$Kaii-rae… / Sol-iss… / Veyaa… toraa… / Ahhh-rai… ohhh-na… / Ignis… ignis… / Soraaah!$L$),
('codigos_aurora', 11, 'Ignis',
 $P$Epic choral + crystalline electronic elements, Ascending rhythms (ethereal crystal-like percussion, not earthly drums), Fiery pads with luminous crescendos, Touches of bright strings and brass evoking solar fire$P$,
 ARRAY['dark','martial','heavy rock-style percussion','overly soft or contemplative moods'], NULL, NULL, NULL),
('codigos_aurora', 12, 'Flamma',
 $P$Epic choral + crystalline electronic elements, Ascending rhythms (ethereal crystal-like percussion, not earthly drums), Fiery pads with luminous crescendos, Touches of bright strings and brass evoking solar fire$P$,
 ARRAY['dark','martial','heavy rock-style percussion','overly soft or contemplative moods'], NULL, NULL, NULL)

ON CONFLICT (album_id, title) DO NOTHING;

-- ============================================================
-- 4. RPCs (SECURITY DEFINER · admin-gated · ruteadas por admin-action)
-- ============================================================

-- 4.a — Catálogo completo (álbumes + tracks anidados) para el selector de Norte.
CREATE OR REPLACE FUNCTION public.get_suno_catalog_admin(
    p_admin_clerk_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_result json;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT json_agg(row_to_json(a) ORDER BY a.orden)
    INTO v_result
    FROM (
        SELECT
            al.id, al.name, al.vibe_tag, al.archetype, al.genre,
            al.orden, al.active,
            COALESCE((
                SELECT json_agg(row_to_json(t) ORDER BY t.orden)
                FROM (
                    SELECT tr.id, tr.title, tr.style_prompt, tr.excludes,
                           tr.weirdness, tr.style_influence, tr.lyrics, tr.orden
                    FROM public.suno_tracks tr
                    WHERE tr.album_id = al.id
                ) t
            ), '[]'::json) AS tracks
        FROM public.suno_albums al
    ) a;

    RETURN json_build_object('albums', COALESCE(v_result, '[]'::json));
END $$;

GRANT EXECUTE ON FUNCTION public.get_suno_catalog_admin(text)
    TO anon, authenticated, service_role;

-- 4.b — Activar/desactivar un álbum del Norte.
CREATE OR REPLACE FUNCTION public.set_suno_album_active_admin(
    p_admin_clerk_id text,
    p_album_id text,
    p_active boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    UPDATE public.suno_albums SET active = COALESCE(p_active, true)
    WHERE id = p_album_id;
    RETURN json_build_object('ok', true);
END $$;

GRANT EXECUTE ON FUNCTION public.set_suno_album_active_admin(text, text, boolean)
    TO anon, authenticated, service_role;

-- 4.c — Galería de creaciones (lo generado por el panel).
CREATE OR REPLACE FUNCTION public.get_suno_creations_admin(
    p_admin_clerk_id text,
    p_limit int DEFAULT 40
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_result json;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    SELECT json_agg(row_to_json(c) ORDER BY c.generated_at DESC)
    INTO v_result
    FROM (
        SELECT
            cr.id, cr.title, cr.direction_name, cr.direction,
            cr.seed_text, cr.reference_text, cr.project, cr.norte_key,
            cr.norte_album_ids, cr.norte_track_ids, cr.norte_creation_ids,
            cr.inspiration, cr.norte_mode, cr.knobs, cr.instrumental,
            cr.lyrics_lang, cr.style_prompt, cr.excludes, cr.weirdness,
            cr.style_influence, cr.lyrics, cr.config_notes, cr.generated_at
        FROM public.suno_creations cr
        WHERE cr.status <> 'deleted'
        ORDER BY cr.generated_at DESC
        LIMIT GREATEST(LEAST(p_limit, 200), 1)
    ) c;

    RETURN json_build_object('creations', COALESCE(v_result, '[]'::json));
END $$;

GRANT EXECUTE ON FUNCTION public.get_suno_creations_admin(text, int)
    TO anon, authenticated, service_role;

-- 4.d — Soft-delete de una creación.
CREATE OR REPLACE FUNCTION public.delete_suno_creation_admin(
    p_admin_clerk_id text,
    p_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
BEGIN
    SELECT bool_or(COALESCE(is_admin, false)) INTO v_is_admin
    FROM public.profiles WHERE clerk_user_id = p_admin_clerk_id;
    IF NOT COALESCE(v_is_admin, false) THEN
        RETURN json_build_object('error', 'unauthorized');
    END IF;

    UPDATE public.suno_creations SET status = 'deleted' WHERE id = p_id;
    RETURN json_build_object('ok', true);
END $$;

GRANT EXECUTE ON FUNCTION public.delete_suno_creation_admin(text, uuid)
    TO anon, authenticated, service_role;

-- ============================================================
-- FIN. Después de correr esto:
--   1. Desplegar el edge:  supabase functions deploy generate-suno-prompt --no-verify-jwt
--   2. El gateway admin-action ya trae las 4 RPCs en su whitelist (v1.31).
-- ============================================================
