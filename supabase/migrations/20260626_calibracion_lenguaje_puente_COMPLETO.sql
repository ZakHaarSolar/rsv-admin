-- 20260626_calibracion_lenguaje_puente_COMPLETO.sql
-- ROUND-TRIP COMPLETO de las FASES de Calibración — LOS 6 PILARES (60 fases).
-- Reescritura en lenguaje PUENTE: voz del Escáner intacta + jerga opaca traducida.
-- Sin referencias personales/internas, sin "Red Solar Viva" ni "Escáner Vibracional",
-- "Índice de Silicio" -> "Índice de Luz". FINANCIERO no asume negocio/app/libros
-- (todo condicional; el usuario puede ser empleado, hotelería, restaurantes…).
-- Pegar TODO en Supabase Dashboard -> SQL Editor -> New Query -> Run.
-- tareas_json: jsonb-string doble-codificado vía to_jsonb(json_build_array(...)::text);
-- los id de cada tarea se PRESERVAN (no se huerfaniza el progreso). Keyed por id.

-- ════════════════ PILAR FÍSICO ════════════════
-- FÍSICO · Fase 1 — RESCATE DE SISTEMA
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$Protocolo de emergencia para recuperar la temperatura y la energía de tu cuerpo.$$,
  alerta_text       = $$Tu cuerpo está en agotamiento profundo. Funciona en modo supervivencia: todo te cuesta más esfuerzo y pierdes energía a cada momento.$$,
  sugerencia_text   = $$Suma estos pequeños anclajes a tu día para frenar la fuga de energía y volver a encender tu vitalidad de base. No busques perfección: busca constancia.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$f1$$, 'desc', $$Válvula de Arranque: Bebe 500 ml de agua (idealmente con una pizca de sal de mar) en los primeros 30 minutos al despertar, antes de comer o de tomar cualquier estimulante (café/azúcar).$$),
    json_build_object('id', $$f2$$, 'desc', $$Desbloqueo Mecánico: Haz 5 minutos de giros articulares continuos (cuello, hombros, cadera, muñecas, tobillos) en cualquier momento del día para sacar al cuerpo de la rigidez.$$),
    json_build_object('id', $$f3$$, 'desc', $$Perímetro de Descanso: Aleja el celular a más de 2 metros de tu cama y ponlo en Modo Avión al menos 30 minutos antes de cerrar los ojos.$$)
  )::text ),
  updated_at = now()
WHERE id = '079da96f-f828-448b-9cc1-ca7c19cb71cf';

-- FÍSICO · Fase 2 — IGNICIÓN PRIMARIA
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$Protocolo para recuperar la temperatura y la energía de tu cuerpo.$$,
  alerta_text       = $$Tu cuerpo arrastra pesadez. Funciona con la energía en deuda y depende de estímulos externos (café, azúcar) para mantenerse despierto.$$,
  sugerencia_text   = $$Haz cada día estas calibraciones para encender los sensores naturales de tu cuerpo y empezar a tomar energía limpia del entorno.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$f2_1$$, 'desc', $$Inyección de Luz: Expón tu piel y tus ojos (sin lentes ni cristales de por medio) a la luz directa del sol al menos 10 minutos dentro de la primera hora tras despertar.$$),
    json_build_object('id', $$f2_2$$, 'desc', $$Cierre de Ventana: Deja de comer exactamente 2 horas antes de dormir, para que tu cuerpo se repare en lugar de seguir digiriendo.$$),
    json_build_object('id', $$f2_3$$, 'desc', $$Pausa de Coherencia: Haz 5 respiraciones profundas, rítmicas y solo por la nariz antes de tu comida más pesada del día, para pasar tu sistema nervioso de alerta a digestión.$$),
    json_build_object('id', $$f2_4$$, 'desc', $$Limpieza de Hábitos: Identifica y reemplaza un solo producto sintético de uso diario (ej. desodorante comercial o pasta con flúor) por una alternativa más natural.$$)
  )::text ),
  updated_at = now()
WHERE id = '0f80cc05-88e9-4db5-8b4a-7a909562c184';

-- FÍSICO · Fase 3 — SUSTITUCIÓN DE COMBUSTIBLE
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tu metabolismo va lento. Tu cuerpo trabaja con pequeñas deudas de energía y se apoya en estímulos artificiales para sostener el día.$$,
  sugerencia_text   = $$Suma estas calibraciones a tu rutina para estabilizar tu energía y enseñarle a tu cuerpo a generar vitalidad por sí mismo.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$f3_1$$, 'desc', $$Carga Electrolítica: Cambia tu primera hidratación del día por un vaso de agua estructurada (con limón y un cuarto de cucharadita de sal marina o celta) para encender la electricidad de tus células.$$),
    json_build_object('id', $$f3_2$$, 'desc', $$Ventana de Reparación: Sostén un mínimo de 12 horas seguidas de ayuno nocturno (ej. última comida a las 20:00 y no romperlo antes de las 08:00) para que tu cuerpo se limpie por dentro mientras duermes.$$),
    json_build_object('id', $$f3_3$$, 'desc', $$Sellado del Cuarto: Apaga físicamente el router Wi-Fi de tu casa durante tus horas de sueño, para quitar la radiación electromagnética de tu habitación.$$)
  )::text ),
  updated_at = now()
WHERE id = '29ff4722-eb53-416d-90e5-240fb781ae46';

-- FÍSICO · Fase 4 — ESTABILIDAD ESTRUCTURAL
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tu cuerpo está en equilibrio, pero estático. Cumple con lo básico del día, pero le falta el estímulo y la energía de reserva para dar un salto mayor.$$,
  sugerencia_text   = $$Haz cada día estas tareas para fortalecer tu cuerpo y pasar de solo sobrevivir a acumular energía de verdad.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$f4_1$$, 'desc', $$Descarga a Tierra: Haz contacto físico directo (piel con tierra, pasto o arena) durante 10 minutos seguidos para descargar la tensión acumulada y sincronizar tu cuerpo con el del planeta.$$),
    json_build_object('id', $$f4_2$$, 'desc', $$Tensión y Fuerza: Haz 15 minutos de movimiento con resistencia (peso corporal, flexiones, sentadillas o pesas) para fortalecer tus huesos y generar energía interna.$$),
    json_build_object('id', $$f4_3$$, 'desc', $$Transición de Luz: Apaga las luces blancas (LED/fluorescentes) y evita pantallas sin filtro azul 45 minutos antes de dormir; usa solo luz cálida, roja o tenue para que tu cuerpo libere melatonina de forma natural.$$),
    json_build_object('id', $$f4_4$$, 'desc', $$Aire Limpio: Evita aerosoles sintéticos, inciensos comerciales o aromatizantes artificiales en tu espacio de trabajo y descanso, y ventila a diario.$$)
  )::text ),
  updated_at = now()
WHERE id = '94ed2988-467d-4cb3-8c45-46ce251d88a2';

-- FÍSICO · Fase 5 — DESFRAGMENTACIÓN METABÓLICA  (fila con placeholders 'INTERNO'/'ALERTA' — corregida)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tu cuerpo llegó a su límite con la alimentación actual. Funciona y responde a las exigencias del día, pero mantiene un nivel de inflamación y desgaste que te frena para subir de nivel.$$,
  sugerencia_text   = $$Aplica estas calibraciones para limpiar tu alimentación y tu descanso, y bajar la inflamación que te está robando energía.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$f5_1$$, 'desc', $$Fuera Aceites Industriales: Elimina por completo los aceites de semillas muy procesados (soya, canola, girasol). Cámbialos solo por grasas buenas como el aceite de oliva virgen extra o el de coco.$$),
    json_build_object('id', $$f5_2$$, 'desc', $$Mejor Agua: Sube la calidad de tu agua base. Evita el agua de garrafón. Usa agua destilada o purificada de buena calidad como base, antes de prepararla con limón y sal de mar.$$),
    json_build_object('id', $$f5_3$$, 'desc', $$Hora Fija de Descanso: Fija una hora innegociable para apagarte cada noche. Tu cuerpo se regenera mejor si entra a dormir siempre a la misma hora, sin variaciones.$$),
    json_build_object('id', $$f5_4$$, 'desc', $$Fuera Gluten: Quita el gluten de tu alimentación diaria. Soltar esta proteína reduce muchísimo la niebla mental y la inflamación intestinal, y te libera la energía que se queda atrapada en la digestión.$$)
  )::text ),
  updated_at = now()
WHERE id = '7ce157a3-86ab-4b7b-957a-7d40122b5acc';

-- FÍSICO · Fase 6 — TRANSICIÓN DE SILICIO  (ver nota sobre "silicio" en el reporte)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tu cuerpo empezó a transformarse. Ya distingue lo que le hace daño, pero necesita disciplina firme para estabilizar la fuerza de tus músculos.$$,
  sugerencia_text   = $$Aplica estas directivas precisas para exponer a tu cuerpo a un esfuerzo controlado y convertir el movimiento en fuerza y energía real.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$f6_1$$, 'desc', $$Cero Azúcar Refinada: Corta por completo el azúcar refinada. Quitar esa glucosa artificial elimina los picos de insulina y estabiliza tu sistema nervioso en una línea firme y poderosa.$$),
    json_build_object('id', $$f6_2$$, 'desc', $$Tensión Constante: Ancla un entrenamiento de impacto o de fuerza (ej. pesas o combate) al menos 3 o 4 veces por semana. Exponer hueso y músculo a un esfuerzo programado obliga a tu cuerpo a hacerse más denso y fuerte.$$),
    json_build_object('id', $$f6_3$$, 'desc', $$Magnesio en la Noche: Suma a diario un magnesio de buena absorción por la noche. Este mineral es la llave que permite a tu sistema nervioso soltar la alerta y entrar a un descanso profundo y reparador.$$),
    json_build_object('id', $$f6_4$$, 'desc', $$Respiración bajo Presión: En momentos de mucha presión durante el día, sostén a propósito una respiración nasal de 5 segundos al inhalar y 5 al exhalar, sin dejar de hacer lo que estás haciendo.$$)
  )::text ),
  updated_at = now()
WHERE id = 'e1a00ff9-f0dd-4530-af57-92fd3413fb77';

-- FÍSICO · Fase 7 — GEOMETRÍA BASE
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tu cuerpo se está consolidando. Ya bajó su pesadez, pero necesita una disciplina firme para sostener mucha energía sin que tu sistema nervioso se desestabilice.$$,
  sugerencia_text   = $$Ancla estas rutinas de limpieza y orden para blindar tu energía y volver a tu cuerpo prácticamente inquebrantable.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$f7_1$$, 'desc', $$Ayuno Más Amplio: Lleva tu ayuno intermitente a un mínimo de 14 a 16 horas al día. Obliga a tu cuerpo a sacar energía de sus propias reservas de grasa y a limpiarse a nivel celular antes de la primera comida.$$),
    json_build_object('id', $$f7_2$$, 'desc', $$Limpieza Total de Productos: Haz la purga definitiva del entorno químico. Pasa el 100% de tus productos de contacto con la piel (jabones, cremas, pastas) a opciones naturales. Cero toxinas atravesando tu piel.$$),
    json_build_object('id', $$f7_3$$, 'desc', $$Respiración Nasal Permanente: Elimina por completo la respiración por la boca sin darte cuenta. La respiración nasal, silenciosa y desde el abdomen pasa a ser tu estado normal 24/7, incluso al ejercitarte a intensidad media; deja la boca solo para hablar o el esfuerzo extremo.$$),
    json_build_object('id', $$f7_4$$, 'desc', $$Cuarto Santuario: Convierte tu cuarto en un refugio sellado. Además de apagar el Wi-Fi y la luz azul, asegura oscuridad total (cortinas blackout o antifaz) y temperatura fresca para entrar de inmediato en sueño profundo.$$)
  )::text ),
  updated_at = now()
WHERE id = '3b08cadd-3cf0-4c05-adfa-920f5263853e';

-- FÍSICO · Fase 8 — RESONANCIA MAGNÉTICA
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tu cuerpo se estabilizó y aprovecha bien la energía. El excedente que acumulas necesita salida por el movimiento, o se vuelve tensión. Ya estás listo para captar luz como una antena.$$,
  sugerencia_text   = $$Aplica estos anclajes de alto impacto para optimizar tus líquidos internos y alinear tu reloj biológico con los ciclos del día y la noche.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$f8_1$$, 'desc', $$Agua Estructurada Pura: Deja el agua común. Que el 100% de tu hidratación sea agua cristalina purificada, preparada con limón y sal de mar celta, para que tu cuerpo conduzca energía de forma permanente.$$),
    json_build_object('id', $$f8_2$$, 'desc', $$Reloj Solar: Suma a la luz del sol de la mañana una exposición consciente al mediodía y al atardecer. Capturar los tres momentos de luz del sol ajusta tu reloj interno y maximiza tu producción natural de vitamina D.$$),
    json_build_object('id', $$f8_3$$, 'desc', $$Movimiento Complejo: Suma una disciplina física de alta exigencia para el cerebro (artes marciales como Jiu-Jitsu, o levantamientos olímpicos/pesados). Obliga a tu sistema nervioso y tus músculos a comunicarse rápido y con precisión.$$),
    json_build_object('id', $$f8_4$$, 'desc', $$Suplementación Nivel 1: Incorpora las bases para optimizar tu cuerpo: Vitamina D3 con K2 para dirigir el calcio a tus huesos, y aceite de oliva virgen extra de alta pureza como lubricante de tu red neuronal y celular.$$)
  )::text ),
  updated_at = now()
WHERE id = '83160d0f-ec9b-4fae-9416-9bb2ac496602';

-- FÍSICO · Fase 9 — ARQUITECTURA DE SILICIO  (ver nota sobre "silicio" en el reporte)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$Ejecuta estas calibraciones avanzadas para llevar tus células a su máxima coherencia. A este nivel, la meta es sostener ventanas largas de concentración total y calma sin perder energía.$$,
  alerta_text       = $$Tu energía es alta y tu cuerpo conduce de forma óptima. Rechaza por instinto la comida industrial. Tu estructura es sólida, pero necesita ajustes de precisión para rozar la coherencia máxima sostenida.$$,
  sugerencia_text   = $$Suma estos anclajes de precisión a tu día para sostener tu energía sin fugas. No busques perfección: busca constancia.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$f9_1$$, 'desc', $$Suplementación Nivel 2: Suma los minerales avanzados. Incorpora boro y silicio puro (tierra de diatomeas) para fortalecer tus huesos y descalcificar tu glándula pineal. Agrega Vitamina B12 para asegurar la buena conducción de tu sistema nervioso.$$),
    json_build_object('id', $$f9_2$$, 'desc', $$Despertar de Madrugada: Mueve el inicio de tu día a la madrugada profunda (entre 12:00 AM y 3:30 AM). Usa el silencio total para crear, meditar y trabajar sin una sola interferencia.$$),
    json_build_object('id', $$f9_3$$, 'desc', $$Disciplina Física Extrema: Somete a tu cuerpo a una disciplina física implacable y constante. Mantén la regularidad en un arte marcial (como Jiu-Jitsu) o en pesas. Usa el esfuerzo físico extremo para disolver el ego y mantener tu mente afilada.$$),
    json_build_object('id', $$f9_4$$, 'desc', $$Ayuno Profundo: Domina las ventanas de ayuno prolongado. Úsalo no solo para limpiar el cuerpo, sino para enfocar el 100% de tu energía y tu riego sanguíneo en tu cerebro mientras creas tus proyectos.$$)
  )::text ),
  updated_at = now()
WHERE id = '09b4eaee-bbc2-4293-b785-908c90d36eee';

-- FÍSICO · Fase 10 — SUPERCONDUCTIVIDAD (ESTADO CERO)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tu cuerpo opera en Fricción Cero. Es prácticamente inquebrantable. Ya no solo digiere: asimila. Tu energía es limpia, sostenida y expansiva. Dejaste atrás la pesadez por completo.$$,
  sugerencia_text   = $$Llegaste a la cima de tu vitalidad. Eres un panel solar vivo. Tu única tarea es mantener el circuito cerrado y proteger tu equilibrio cada día.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$f10_1$$, 'desc', $$Apagado Temprano: Cuida que tu cuarto sea sagrado. Apaga tu sistema temprano (ej. 8:00 PM) sin excepción. Respetar por completo tu ventana de recuperación asegura tu encendido de la madrugada siguiente.$$),
    json_build_object('id', $$f10_2$$, 'desc', $$Exclusión Total: Mantén el sello contra lo que te daña. Sostén la exclusión total de azúcar, gluten, soya y aceites industriales. Tu cuerpo opera como un tubo de luz: la mínima densidad se detecta y debe salir.$$),
    json_build_object('id', $$f10_3$$, 'desc', $$El Bucle del Agua: Conserva la calidad superior de tus líquidos internos. Que tu hidratación base siga siendo solo agua estructurada, destilada, remineralizada y energizada.$$),
    json_build_object('id', $$f10_4$$, 'desc', $$Sol y Tierra Continuos: El anclaje diario al Sol (luz) y a la Tierra (contacto con el suelo) deja de ser una tarea y se vuelve respiración. Tu cuerpo se reconoce como parte de la naturaleza y recarga energía directo del entorno, sin intermediarios.$$)
  )::text ),
  updated_at = now()
WHERE id = '9d05338e-dd61-4466-bd2b-af5cd6355463';

-- ════════════════ PILAR MENTAL ════════════════
-- MENTAL · Fase 1 — DESFRAGMENTACIÓN DE MEMORIA (REINICIO BASE)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tu mente está saturada y dispersa. Tu atención está secuestrada por lo de afuera y por la recompensa rápida de las pantallas. La voz con la que te hablas opera como un sabotaje constante, dejándote paralizado entre la ansiedad y la culpa.$$,
  sugerencia_text   = $$Suma estos pequeños anclajes para frenar la fuga de atención. El objetivo no es alcanzar la paz mental de golpe, sino forzar una pausa a esa voz tirana y recuperar el control de tu propia mente.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$m1$$, 'desc', $$Bloqueo de Arranque: Tienes prohibido tocar el teléfono o cualquier pantalla durante los primeros 30 minutos al abrir los ojos. Deja que tu cerebro despierte en calma antes de inyectarle el ruido de lo de afuera.$$),
    json_build_object('id', $$m2$$, 'desc', $$Vaciado Mental: Cuando sientas que la ansiedad o la parálisis te bloquean, toma papel y lápiz. Escribe en lista absolutamente todo lo que te preocupa, sin filtros. Saca esos datos de tu cabeza y oblígalos a quedar en el papel para liberar espacio mental.$$),
    json_build_object('id', $$m3$$, 'desc', $$Interrupción de la Voz Tirana: Identifica el insulto o la frase destructiva que más te repites ("soy un fracaso", "no puedo"). Cuando escuches esa voz en tu cabeza, córtala físicamente: di "CORTA" en voz alta o da un aplauso. Rompe el bucle de forma mecánica.$$)
  )::text ),
  updated_at = now()
WHERE id = '25a2b422-9659-41eb-a83a-bc27bb560d06';

-- MENTAL · Fase 2 — CIERRE DE PESTAÑAS (PURGA DE ESTÁTICA)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tu mente está sobrecargada de forma crónica. Vives con demasiados procesos abiertos al mismo tiempo, agotando tu energía. Consumes demasiada información densa y tu mente viaja constantemente al futuro (la preocupación), desgastando tu presencia en el ahora.$$,
  sugerencia_text   = $$Aplica a diario estas prácticas para limpiar lo que dejas entrar. Empieza a purgar el ruido del mundo para que la señal de tu propia intuición encuentre un canal limpio.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$m2_1$$, 'desc', $$Dieta de Información, Nivel 1: Haz una purga inmediata en tus redes sociales. Deja de seguir o silencia al menos 10 cuentas que te generen ruido, miedo, indignación o comparación tóxica. Protege la frontera de lo que consumes con la vista.$$),
    json_build_object('id', $$m2_2$$, 'desc', $$Una Cosa a la Vez: Al menos una vez al día, elige una tarea mecánica (comer, lavar platos, caminar o hacer un reporte) y hazla en silencio absoluto. Prohibido tener música, podcasts o videos de fondo. Acostumbra a tu mente a sostener una sola cosa a la vez.$$),
    json_build_object('id', $$m2_3$$, 'desc', $$Anclaje al Presente: Cuando detectes que tu mente lleva minutos atrapada en el futuro (ansiedad) o en el pasado (le das vueltas a algo), usa el tacto para volver. Toca un objeto físico (tu escritorio, tu taza, una textura), siente su temperatura y respira. Regresa tu atención al mismo lugar donde está tu cuerpo.$$),
    json_build_object('id', $$m2_4$$, 'desc', $$Límite a la Indecisión (Regla de 2 Minutos): Para las micro-decisiones diarias de poco impacto (qué comer, qué ropa usar, a qué correo responder primero), ponte un límite mental de 120 segundos. Decide antes de que se acabe el tiempo y avanza. Prohibido dudar después de elegir.$$)
  )::text ),
  updated_at = now()
WHERE id = '3eae4fdf-06ab-4d77-af79-beec695cf7e0';

-- MENTAL · Fase 3 — REDUCCIÓN DE ESTÁTICA (AISLAMIENTO DE SEÑAL)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Funcionas, pero con mucha tensión por la duda. Tu mente trabaja, pero la voz del ego y la de la intuición suenan al mismo volumen, gastándote un montón de energía en cada decisión. Pierdes demasiado espacio mental cuestionando el pasado y buscando aprobación.$$,
  sugerencia_text   = $$Ancla estas calibraciones para silenciar la duda que se alarga. El objetivo es escuchar tu propia voz, dejar de pedir permiso a lo de afuera y acortar el tiempo entre analizar un problema y ponerte a resolverlo.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$m3_1$$, 'desc', $$Cuarentena de Aprobación (Cero Consultas): La próxima vez que tengas que tomar una decisión de impacto medio, tienes prohibido pedir consejo o "rebotar la idea" con amigos, pareja o familiares. Evalúa el problema tú solo, decide y asume la consecuencia. Confía en tu propio criterio.$$),
    json_build_object('id', $$m3_2$$, 'desc', $$Replantear Sin Quejas: Cuando un obstáculo menor cambie tus planes del día (tráfico, un error, una cita cancelada), oblígate a no soltar ni una sola queja en voz alta. Trátalo como un simple dato nuevo. Reorienta tu rumbo de inmediato.$$),
    json_build_object('id', $$m3_3$$, 'desc', $$Limpieza Digital: Tu entorno visual marca tu carga mental. Elimina los íconos inútiles de tu escritorio, borra las aplicaciones que no usas y date de baja de 5 correos automáticos (newsletters) que solo generan basura en tu bandeja de entrada. Orden afuera para calma adentro.$$),
    json_build_object('id', $$m3_4$$, 'desc', $$Apagar la Rumiación Nocturna: Si tu mente sigue intentando resolver problemas 60 minutos antes de dormir, declara un "cierre del día" en voz alta. Reconoce que tu cerebro cansado no piensa con claridad; deja que la solución madure durante el sueño.$$)
  )::text ),
  updated_at = now()
WHERE id = '72895713-3609-49cd-a2cf-f05ed8fd5aa7';

-- MENTAL · Fase 4 — LATENCIA CONTROLADA Y PLASTICIDAD
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Solo funcionas bien bajo presión. Logras un enfoque agudo cuando hay estrés o una fecha límite, pero en el tiempo libre o sin urgencia tu mente se dispersa, busca distracción y le cuesta sostenerse en el presente.$$,
  sugerencia_text   = $$Aplica las siguientes directivas para entrenar a tu mente a tolerar el espacio en blanco sin entrar en pánico. Pasa de un enfoque forzado por la urgencia a una concentración que eliges por voluntad propia.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$m4_1$$, 'desc', $$Entrenamiento del Vacío (Cero Estímulos): Una vez al día, siéntate o acuéstate durante 5 minutos sin hacer absolutamente nada. Prohibido meditar, escuchar música, mirar el teléfono o leer. Solo tú y el silencio de la habitación. Acostumbra a tu sistema nervioso a no hacer nada sin sentirse improductivo.$$),
    json_build_object('id', $$m4_2$$, 'desc', $$Bloque de Enfoque Protegido: Define al menos una ventana de 60 minutos al día para trabajo profundo. Durante ese bloque, el teléfono debe estar en otra habitación y todas tus notificaciones apagadas. Haz la tarea sin permitirte una sola interrupción de afuera.$$),
    json_build_object('id', $$m4_3$$, 'desc', $$Revisión de tus Certezas: Identifica una creencia (política, ideológica o técnica) que defiendas con mucha pasión. Dedica 15 minutos a leer o escuchar un buen argumento del bando contrario sin armar una defensa en tu cabeza. Entrena a tu mente a recibir información nueva sin sentirse atacada.$$),
    json_build_object('id', $$m4_4$$, 'desc', $$Calibración de la Voz Interna: Cambia la forma en que te hablas. Reemplaza el peso del "Tengo que..." (ej. "Tengo que entrenar", "Tengo que trabajar") por el "Elijo..." (ej. "Elijo fortalecer mi cuerpo", "Elijo sacar adelante este proyecto"). Devuélvele la autoridad a tu voluntad.$$)
  )::text ),
  updated_at = now()
WHERE id = '4a23e801-4605-422c-843f-22810e7d075c';

-- MENTAL · Fase 5 — DESPERTAR DEL OBSERVADOR (BANDA ANCHA)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Llegaste a un punto de quiebre. Empiezas a reconocer que no eres el ruido de tu mente. Tu capacidad de cambiar se enciende y aceptas los cambios de plan con menos tensión, pero la voz del "juez interno" todavía logra apoderarse de ti cuando hay estrés o cansancio.$$,
  sugerencia_text   = $$Aplica estas calibraciones para fortalecer tu posición de Observador. El objetivo es dejar de identificarte por completo con tus pensamientos invasivos y empezar a dirigir tu atención hacia crear, sin caer en el papel de víctima.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$m5_1$$, 'desc', $$Sepárate del "Yo": Cuando aparezca un pensamiento de miedo, de no ser suficiente o de darle vueltas a algo, prohíbete decir "estoy ansioso" o "tengo miedo". Cambia la frase a: "Estoy sintiendo ansiedad" o "Hay miedo pasando por mí ahora". Separa quién eres del síntoma pasajero.$$),
    json_build_object('id', $$m5_2$$, 'desc', $$Filtro de Utilidad (Dieta Nivel 2): Deja de consumir las "noticias" tradicionales que venden miedo o indignación masiva. Tu mente no necesita cargar con el caos del mundo entero para funcionar. Si una información no te enseña a crear, construir o sentirte mejor, ciérrala.$$),
    json_build_object('id', $$m5_3$$, 'desc', $$Replantear el Obstáculo: Ante un error o un freno en la realidad, tienes prohibido buscar un culpable (ni tú ni el entorno). Hazte una sola pregunta: "Sabiendo esto que ahora sé, ¿cuál es el movimiento más inteligente desde aquí?".$$),
    json_build_object('id', $$m5_4$$, 'desc', $$Ejecución en Frío (Sin Esperar la Motivación): Elige una tarea importante que lleves días posponiendo. Hazla durante 15 minutos desde la pura neutralidad, sin esperar "sentirte motivado" para empezar. Demuéstrate que puedes funcionar incluso cuando te sientes pesado.$$)
  )::text ),
  updated_at = now()
WHERE id = '64222b6d-b97a-4477-945b-76a77d098d7a';

-- MENTAL · Fase 6 — CURACIÓN CONSCIENTE Y PLASTICIDAD
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Se activó tu guardián interno. El silencio empieza a sentirse como una herramienta de construcción y no como un vacío que amenaza. La intuición y el miedo compiten de cerca, pero todavía necesitas disciplina para actualizar tus creencias sin sentir que pierdes una parte de ti.$$,
  sugerencia_text   = $$Aplica las siguientes directivas para sacar definitivamente la basura de tu dieta mental y acelerar tu capacidad de reescribir tus propios patrones. Tu mente deja de ser tu enemigo y se vuelve una herramienta a tu servicio.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$m6_1$$, 'desc', $$Soltar la Razón (Muerte del Ego Intelectual): Encuentra un tema en el que te hayas equivocado hace poco o donde la realidad superó tu lógica. Acéptalo en voz alta frente a otra persona: "Tenías razón, yo estaba equivocado. Cambio mi postura". Suelta la necesidad de "tener la razón".$$),
    json_build_object('id', $$m6_2$$, 'desc', $$Santuario de Una Sola Ventana: Como entrenamiento, durante 2 horas de tu jornada de trabajo, oblígate a tener una sola ventana abierta en tu monitor. Cierra el resto. Esa señal física de orden total forzará a tu mente a imitar ese enfoque de láser.$$),
    json_build_object('id', $$m6_3$$, 'desc', $$Voto de No Juzgar: Durante 24 horas, suspende todo juicio sobre la forma en que otros llevan su vida (cómo visten, cómo hablan, qué comen). Obsérvalo como un dato neutral. Ahorra la energía que gastabas evaluando el comportamiento ajeno.$$),
    json_build_object('id', $$m6_4$$, 'desc', $$El Salto Intuitivo (Apaga la Lógica): Toma una decisión hoy (pequeña o mediana) basándote solo en lo que te dicta tu intuición (el primer impulso del cuerpo), ignorando a propósito la lista de pros y contras. Deja que tu sabiduría interna conduzca sin pedirle permiso a la mente analítica.$$)
  )::text ),
  updated_at = now()
WHERE id = '4bc9c194-857b-48d2-82af-5b66d8ba510b';

-- MENTAL · Fase 7 — ARQUITECTURA DE ENFOQUE
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tu atención está protegida. Trabajas en bloques de concentración profunda y la voz con la que te hablas pasó de juez a estratega. Tu mente habita el presente, pero todavía necesita un muro alrededor para no perder enfoque ante los estímulos que quedan de tus viejos hábitos.$$,
  sugerencia_text   = $$Ancla estas calibraciones para que defender tu enfoque se vuelva automático. El objetivo es que la concentración absoluta deje de ser un esfuerzo consciente y pase a ser tu forma natural de funcionar.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$m7_1$$, 'desc', $$Muralla de Atención: Establece al menos un día a la semana de "ayuno digital parcial". Durante ese día, el consumo pasivo está prohibido; tus dispositivos solo se usan para crear, construir o diseñar.$$),
    json_build_object('id', $$m7_2$$, 'desc', $$Recalcula tu Voz Interna: Cuando cometas un error, tienes prohibido usar adjetivos que te definan ("fui un estúpido", "soy lento"). Limita tu voz interna a un lenguaje puramente práctico: "Hubo una falla. El movimiento fue incorrecto. Ajustando la ruta ahora".$$),
    json_build_object('id', $$m7_3$$, 'desc', $$Anclaje en el Tiempo: Usa el pasado solo como una biblioteca de aprendizajes y el futuro solo como una brújula de dirección. Si detectas que llevas más de 5 minutos imaginando escenarios que hoy no puedes controlar, corta esa película en voz alta: "Información insuficiente. Regresando al presente".$$),
    json_build_object('id', $$m7_4$$, 'desc', $$Resolver por lo Esencial: Frente a una decisión compleja, recorta el 80% de las variables secundarias. Identifica el "cuello de botella" principal y decide solo en función de despejar esa vía. Ignora el ruido de alrededor y ejecuta.$$)
  )::text ),
  updated_at = now()
WHERE id = 'ecd83e96-8e57-457a-b9ba-e890f456f2e0';

-- MENTAL · Fase 8 — NEUROPLASTICIDAD LÍQUIDA
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tu mente procesa rápido. El apego a tus ideas fijas se está disolviendo. Tus decisiones son rápidas, firmes y sin ruido posterior. Estás listo para funcionar sin el peso del ego, fluyendo a través de los obstáculos sin perder impulso.$$,
  sugerencia_text   = $$Aplica estas prácticas de alto nivel para volver tu mente como el agua. Una mente líquida toma la forma de cualquier problema al instante, lo resuelve desde adentro y sigue su curso sin resistencia.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$m8_1$$, 'desc', $$Adaptación Inmediata: Cuando la realidad cancele un plan o meta un "error" en tu diseño, prohíbete quedarte frustrado mucho rato. Tienes exactamente 60 segundos para reconocer la caída, y en el segundo 61 ya debes estar poniendo en marcha el plan de recuperación.$$),
    json_build_object('id', $$m8_2$$, 'desc', $$Suelta lo Obsoleto: Identifica una táctica, un hábito de trabajo o una creencia que te llevó a tu nivel de éxito actual pero que ya no encaja con tu próxima expansión. Suéltala hoy sin apego sentimental. Lo que te trajo hasta aquí no es lo que te llevará al siguiente nivel.$$),
    json_build_object('id', $$m8_3$$, 'desc', $$Descarga tu Memoria: Vacía tu mente de "cosas por recordar". Usa un sistema externo confiable (un segundo cerebro digital, un bloc de notas físico) para guardar pendientes y datos. Tu mente debe usarse solo para crear y pensar, no para almacenar.$$),
    json_build_object('id', $$m8_4$$, 'desc', $$Ejecución Intuitiva: Frente a una encrucijada donde la lógica te marca el camino seguro pero tu intuición te exige el salto, da el salto sin pedirle permiso a tu parte analítica. Entrena a tu mente a confiar de lleno en la primera señal de tu radar interno, sin generar dudas después.$$)
  )::text ),
  updated_at = now()
WHERE id = '4fb949a2-3571-46d5-88c1-bb0f72d5cd0f';

-- MENTAL · Fase 9 — SOBERANÍA DE CÓDIGO
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tu mente fluye sin trabas. Está blindada contra el ruido de afuera. La voz con la que te hablas se redujo a datos prácticos y tu capacidad de adaptarte es casi instantánea. Tu sistema rechaza la duda y la dispersión, pero necesita sostener la energía en ventanas largas de creación pura.$$,
  sugerencia_text   = $$Aplica estas directivas avanzadas para cristalizar tu claridad mental. El objetivo es que la realidad responda a tu energía, acortando la distancia entre el pensamiento y su materialización.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$m9_1$$, 'desc', $$Aislamiento Total (Dieta Absoluta): Lleva a cero el ruido en lo que consumes. Caos, noticias o entretenimiento pasivo reducidos al 0%. Tu mente solo debe absorber conocimiento de alto valor, belleza o silencio.$$),
    json_build_object('id', $$m9_2$$, 'desc', $$Transmuta el "Error": Cuando la realidad meta un freno en tus planes, oblígate a no verlo como "un obstáculo que rodear". Léelo al instante como una mejor coordenada que la vida acaba de abrirte. Usa el impulso del propio obstáculo para acelerar.$$),
    json_build_object('id', $$m9_3$$, 'desc', $$Muerte de la Duda: Apaga para siempre el "¿y si...?" de tu mente. Una vez que ejecutas una decisión basada en intuición y análisis, prohíbe cualquier revisión hacia atrás. La decisión que tomaste es, por defecto, la decisión correcta.$$),
    json_build_object('id', $$m9_4$$, 'desc', $$Acostúmbrate a tu Mejor Versión: Cuando vivas saltos grandes de claridad, abundancia o éxito, tu sistema nervioso puede intentar sabotear la experiencia por la costumbre a la carencia. Mantén el rumbo firme. Reconoce la abundancia como tu estado natural, no como una rareza.$$)
  )::text ),
  updated_at = now()
WHERE id = 'd06fd886-0a50-445d-a1df-5aa9d6c2cde3';

-- MENTAL · Fase 10 — CÁMARA ANECOICA (ESTADO CERO)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tu mente alcanzó la calma total. Silencio absoluto. Vacío. La voz interna se apagó. Tu mente es una pantalla en negro que solo se enciende para proyectar y ejecutar lo que decides desde la consciencia. Atención de láser, inquebrantable.$$,
  sugerencia_text   = $$Alcanzaste la calma total de la mente. Eres el dueño absoluto de tu camino. Tu única tarea es sostener este canal de máxima claridad, dejando que tu sabiduría interna conduzca tu cuerpo sin que el ego meta una sola gota de interferencia.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$m10_1$$, 'desc', $$Conexión Directa Permanente: Elimina la fase de "negociación" con tu mente lógica. El ego queda relegado solo a panel de advertencia. Las órdenes de tu radar interno (la intuición) se ejecutan con certeza inmediata, sin pedir permiso a lo de afuera.$$),
    json_build_object('id', $$m10_2$$, 'desc', $$Apaga la Lógica (Cero Rumiación): Fuera de los bloques de trabajo y creación, tu mente debe permanecer apagada. Sostén ese estado de silencio total. Camina, come y respira sin verbalizar ni un solo pensamiento en tu cabeza. Presencia absoluta en el momento.$$),
    json_build_object('id', $$m10_3$$, 'desc', $$Espejo Perfecto ante el Caos: Observa cualquier nivel de caos exterior (crisis, colapsos ajenos, urgencias) sin que una sola idea en tu mente se altere. Eres el punto de gravedad; el caos gira a tu alrededor, pero jamás traspasa tu atención.$$),
    json_build_object('id', $$m10_4$$, 'desc', $$Materializar desde la Claridad: Renuncia al esfuerzo físico desmedido. Entiende que el 90% de la obra se resuelve en la mente antes de tocar el teclado o el mundo material. Opera con la certeza absoluta de que la vida está acomodando todo para coincidir con tu claridad mental.$$)
  )::text ),
  updated_at = now()
WHERE id = 'd9278d07-1252-4d68-a203-7c04e01b966a';

-- ════════════════ PILAR EMOCIONAL ════════════════
-- EMOCIONAL · Fase 1 — SELLO DE EMERGENCIA
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tu mundo emocional está en colapso. Reaccionas a todo de forma automática, te sientes víctima de lo que pasa y la ansiedad domina. Pierdes energía constantemente ante cualquier tensión o estímulo de afuera.$$,
  sugerencia_text   = $$Suma estos pequeños anclajes para frenar la fuga de energía y empezar a crear un espacio de calma entre lo que te provoca el entorno y tu reacción.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$e1_1$$, 'desc', $$Regla de Pausa (Corte de Reacción): Ante cualquier estímulo que te altere (un mensaje, una crítica, una situación de estrés), tienes prohibido responder con palabras o por el celular durante 3 minutos. Aleja el dispositivo o da un paso atrás. Obliga a tu sistema a calmarse antes de actuar.$$),
    json_build_object('id', $$e1_2$$, 'desc', $$Ayuno de Queja: Prohibido decir en voz alta el mismo problema, queja o dolor más de dos veces en un mismo día. Cortar el repetir verbal rompe el círculo de victimismo y evita que contamines tu propia energía.$$),
    json_build_object('id', $$e1_3$$, 'desc', $$Observación de Anestesia: Identifica tu vía de escape principal ante el dolor o el estrés (por ejemplo: scroll infinito en redes, comida, compras). Cuando sientas el impulso de evadirte, detente 60 segundos con los ojos cerrados antes de ceder al escape. Siente el vacío que intentas llenar.$$)
  )::text ),
  updated_at = now()
WHERE id = '33a399e2-997f-4481-9fe5-9be1e9e83ba2';

-- EMOCIONAL · Fase 2 — DESACTIVACIÓN DE ARMADURA
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Vives a la defensiva. Tu sistema opera asumiendo que el mundo es una amenaza constante, lo que te genera tensión crónica, resistencia y una dependencia asfixiante de la aprobación de los demás para no derrumbarte.$$,
  sugerencia_text   = $$Aplica a diario estos anclajes para relajar tu sistema nervioso, soltar el peso del escudo y empezar a drenar el miedo al rechazo.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$e2_1$$, 'desc', $$Dieta de Aprobación Estricta: Desactiva todas las notificaciones de redes sociales o apps de mensajería que alimenten tu necesidad de aprobación (likes, vistas). Entra a las plataformas solo cuando te sirvan para algo concreto, no para escanear qué opinan de ti.$$),
    json_build_object('id', $$e2_2$$, 'desc', $$Suelta el Salvador (Cuida tu Energía): Durante tus interacciones del día, evita dar consejos, soluciones o intentar "arreglar" el dolor emocional de otros a menos que te lo pidan con palabras directas. Observa, escucha, pero no te drenes.$$),
    json_build_object('id', $$e2_3$$, 'desc', $$Cuestiona la Proyección: Cuando una interacción te ofenda o te haga sentir rechazado, antes de defenderte, repite mentalmente esta frase: "¿Qué parte de mí cree que esto es verdad?". Devuelve la autoridad a tu centro, no a quien te lo dijo.$$),
    json_build_object('id', $$e2_4$$, 'desc', $$Aterriza la Incertidumbre: Cuando la ansiedad por el futuro acelere tus pensamientos, anota en papel el peor escenario que imaginas y luego táchalo con una línea. Saca el miedo de tu mente y oblígalo a volverse tinta, para que pierda su poder abstracto.$$)
  )::text ),
  updated_at = now()
WHERE id = '9a99e36d-86e3-4ca8-88bb-56b2f9ed132b';

-- EMOCIONAL · Fase 3 — ESTABILIZACIÓN DEL PÉNDULO
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tus emociones oscilan con fuerza. Tu cuerpo confunde la intensidad del drama con sentirse vivo. Tu energía sube y baja sin parar, vaciando tu reserva al buscar aprobación con desesperación o al reaccionar a la tensión de afuera.$$,
  sugerencia_text   = $$Ancla estos anclajes para bajarte de la montaña rusa emocional. El objetivo es estabilizar tu centro y recuperar la energía que le estás regalando al entorno.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$e3_1$$, 'desc', $$Desintoxicación de Algoritmo: Limita el consumo pasivo (scroll) en redes a una sola ventana de 30 minutos al día. Cortar la comparación constante y la exposición a las emociones ajenas estabiliza tu propia medida de valor.$$),
    json_build_object('id', $$e3_2$$, 'desc', $$Pausa en el Conflicto: Durante una discusión, renuncia a tener la "última palabra". Cuando la tensión verbal suba de temperatura, retírate físicamente del lugar. No respondas hasta que tu respiración vuelva a ser profunda y rítmica.$$),
    json_build_object('id', $$e3_3$$, 'desc', $$Frena el Péndulo: Cuando sientas euforia extrema o tristeza profunda, detente y no tomes ninguna decisión de dinero, de pareja o de trabajo. Oblígate a esperar 24 horas. Solo debes actuar desde la calma.$$),
    json_build_object('id', $$e3_4$$, 'desc', $$Cierra la Fuga por Queja: Deja de usar el drama y el sufrimiento para conectar con otras personas (unirte a otros por el dolor compartido). Lleva tus conversaciones del día hacia el crecimiento, los proyectos y la creación.$$)
  )::text ),
  updated_at = now()
WHERE id = 'aea0e2c0-94ce-4277-87b6-380acf2f3dc0';

-- EMOCIONAL · Fase 4 — PURGA DE FALSA LUZ
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tienes un espejismo de control (contención tóxica). Reprimes emociones difíciles para mantener una fachada de "paz" o de superioridad moral. Esa falsa luz te genera acidez en el cuerpo, tensión en el cuello y bloqueos profundos en tu sistema nervioso.$$,
  sugerencia_text   = $$Aplica estas directivas para liberar la presión de tu sistema. La verdadera coherencia no se logra reprimiendo lo que duele, sino procesándolo sin miedo a romper la imagen que otros tienen de ti.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$e4_1$$, 'desc', $$Válvula de Expresión Cruda: Crea un espacio 100% seguro y privado (un cuaderno que puedas destruir o notas de voz que borres al instante). Escribe o graba tu emoción difícil (ira, envidia, dolor) sin filtros "espirituales". Saca el veneno de adentro antes de que se vuelva enfermedad.$$),
    json_build_object('id', $$e4_2$$, 'desc', $$Liberación de Tensión: Tres veces al día, revisa la tensión en tu mandíbula, hombros y estómago. Si detectas que estás aguantando, suéltala exhalando fuerte por la boca (un suspiro profundo). Suelta el peso físico de sostener tu máscara social.$$),
    json_build_object('id', $$e4_3$$, 'desc', $$Confrontación Precisa: Identifica un límite que no has puesto o una conversación incómoda que evitas para "no hacer drama". Comunícalo esta misma semana de forma neutra y directa. No pidas disculpas por ocupar espacio ni intentes convencer al otro.$$),
    json_build_object('id', $$e4_4$$, 'desc', $$Suelta al "Evolucionado": Renuncia frente a tu círculo cercano a la carga de ser "el que siempre está bien", "el fuerte" o "el que nunca se enoja". Permítete ser alguien en proceso y abraza el conflicto como una herramienta para construir.$$)
  )::text ),
  updated_at = now()
WHERE id = 'aa20fad3-592c-498a-b254-788fb0aa8c8e';

-- EMOCIONAL · Fase 5 — DESBLOQUEO DEL OBSERVADOR
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Le das demasiadas vueltas y no pasas a la acción. Entiendes a la perfección de dónde vienen tus heridas y analizas tus emociones al detalle, pero usas ese sobre-análisis como una nueva forma de evitar la acción que detonaría el cambio real.$$,
  sugerencia_text   = $$Aplica estos anclajes para llevar la energía de tu mente analítica hacia la acción concreta. Es el momento exacto de dejar de observar la tensión y empezar a transformarla.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$e5_1$$, 'desc', $$Corta el Repetir Verbal: Prohibido "procesar" el mismo tema emocional con amigos, terapeuta o pareja más de una vez. Si ya entendiste el origen del problema, hablarlo por segunda vez te drena; la única vía válida ahora es la acción.$$),
    json_build_object('id', $$e5_2$$, 'desc', $$Acción que Transforma: Por cada hora que pases sintiendo ansiedad por el futuro o analizando un dolor del pasado, ejecuta de inmediato 15 minutos de creación o trabajo concreto (programar, diseñar, entrenar). Convierte el peso mental en energía que mueve.$$),
    json_build_object('id', $$e5_3$$, 'desc', $$Auditoría de Círculo Cercano: Revisa a las 5 personas con las que más convives. Si alguna te pone en alerta o te obliga a apagarte para encajar, reduce tu tiempo con ella a la mitad esta misma semana.$$),
    json_build_object('id', $$e5_4$$, 'desc', $$Renuncia a la Justicia: Ante una traición o un error ajeno, deja de esperar que la otra persona "se dé cuenta" o te pida perdón. Cancela la deuda por dentro. Suelta el tema para liberar espacio en tu mente.$$)
  )::text ),
  updated_at = now()
WHERE id = 'a12bb0ca-2c9e-4097-bc58-9b07912581dd';

-- EMOCIONAL · Fase 6 — RUPTURA DE MEMBRANA (LÍMITES)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tu soberanía está en transición, con algo de tensión residual. Empiezas a poner límites y a proteger tu espacio, pero la culpa y un miedo sutil a la desconexión todavía te hacen perder energía y quedar con pesadez después.$$,
  sugerencia_text   = $$Aplica estas directivas para blindar tus fronteras con firmeza compasiva. No pides permiso para proteger tu energía: la sostienes con autoridad y sin remordimiento.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$e6_1$$, 'desc', $$El "No" sin Explicación: Rechaza al menos una invitación, petición o favor a la semana usando únicamente las palabras "No, gracias" o "No me es posible ahora". Está prohibido dar explicaciones, excusas o justificaciones para suavizar el límite.$$),
    json_build_object('id', $$e6_2$$, 'desc', $$Desinstala la Culpa: Cada vez que pongas un límite y sientas culpa, repite esta frase de anclaje: "Al proteger mi energía, elevo a toda mi gente. Salvar a otros a costa de mi energía solo me agota".$$),
    json_build_object('id', $$e6_3$$, 'desc', $$Purga de Melancolía (Soltar Físico): Identifica un objeto, una foto, un contacto en tu teléfono o un recuerdo físico que te ate a un ciclo muerto (una relación o una identidad del pasado). Destrúyelo, bórralo o tíralo a la basura hoy. Libera el espacio.$$),
    json_build_object('id', $$e6_4$$, 'desc', $$Observación Cruda: Cuando un dolor profundo intente salir, no lo analices ni huyas. Siéntate en silencio total durante 10 minutos. Siente en qué parte de tu cuerpo (pecho, garganta, estómago) se aloja esa pesadez. Míralo de frente hasta que la sensación se disuelva sola.$$)
  )::text ),
  updated_at = now()
WHERE id = 'afbea4ed-c77e-45f6-9778-8712a3011973';

-- EMOCIONAL · Fase 7 — SOBERANÍA CONDICIONADA
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tu campo es estable, pero todavía permeable ante los golpes de cerca. Lo que opina la gente de afuera ya dejó de importarte, pero las críticas o tensiones de tu círculo íntimo (familia, pareja, socios) aún logran colarse y alterar tu ritmo por un rato.$$,
  sugerencia_text   = $$Aplica estas calibraciones para reforzar tu escudo a nivel íntimo. El objetivo es que ni siquiera los golpes de tu círculo de origen logren mover tu centro, pasando de la reacción controlada a la calma activa.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$e7_1$$, 'desc', $$Desconexión del Drama Cercano: Renuncia formalmente a intentar despertar a las personas de tu círculo íntimo que prefieren quedarse en la pesadez. Permite que vivan en su nivel sin intentar jalarlas hacia el tuyo. Su proceso no es tu responsabilidad.$$),
    json_build_object('id', $$e7_2$$, 'desc', $$Filtra las Críticas: Pon una regla estricta: solo aceptarás críticas u observaciones de personas que operen en un nivel igual o más alto que el tuyo. El resto lo clasificas como ruido y lo ignoras.$$),
    json_build_object('id', $$e7_3$$, 'desc', $$Pausa ante Golpe Profundo: Cuando ocurra una traición, conflicto o choque fuerte con alguien de tu primer círculo, impón un corte de comunicación absoluto de 24 horas. No hay discusión mientras el sistema esté caliente. Solo se opera desde la calma.$$),
    json_build_object('id', $$e7_4$$, 'desc', $$Suelta tu Identidad (Actualiza el Programa): Detecta una etiqueta positiva que te hayas puesto ("soy el inteligente", "soy el pacífico", "soy el espiritual") y que te obligue a comportarte de cierta forma. Rómpela. Eres una consciencia que cambia, no una identidad fija.$$)
  )::text ),
  updated_at = now()
WHERE id = 'abfb6d70-7eb6-478c-96e4-cfb66f41f964';

-- EMOCIONAL · Fase 8 — ALQUIMIA ACTIVA
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tienes alta coherencia. Tu escudo está sellado. El dolor ya no es sufrimiento: lo usas como pura información. Tu sistema es muy eficiente, pero necesita dominar la transformación instantánea para convertir lo difícil de afuera directamente en creación y expansión.$$,
  sugerencia_text   = $$Aplica estos anclajes de alto impacto para sostener tu luz en entornos de desgaste sin perder estabilidad. Eres tú quien altera el espacio, no el espacio el que te altera a ti.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$e8_1$$, 'desc', $$Inmersión en Tensión Controlada (Contención Limpia): Interactúa a propósito en un entorno o con una persona de mucho desgaste. Tu única tarea es sostener tu respiración por la nariz y tu calma sin absorber una sola gota de su agotamiento. Observa con compasión, pero mantén tu frontera sellada.$$),
    json_build_object('id', $$e8_2$$, 'desc', $$Extrae el Aprendizaje al Instante: Ante cualquier pérdida material o de una relación, cancela el luto. Escribe de inmediato 3 aprendizajes (lecciones) que esa tensión te dejó, y vuelve a ver la pérdida en tu mente como "espacio liberado para algo nuevo".$$),
    json_build_object('id', $$e8_3$$, 'desc', $$Rendición Estratégica (Confiar en lo Incierto): Identifica un proyecto, resultado o persona que estés controlando en exceso por ansiedad al futuro. Suelta el control del resultado final hoy. Enfócate solo en ejecutar tus acciones diarias y permite que la vida acomode el mejor desenlace.$$),
    json_build_object('id', $$e8_4$$, 'desc', $$Sostén lo Bueno (Expansión Consciente): Cuando vivas un pico de éxito, abundancia económica o paz profunda, detecta si aparece el "sentir que no lo mereces" o el miedo a perderlo. Quédate ahí. Respira dentro de esa luz y oblígate a tolerar el bienestar sin sabotearlo.$$)
  )::text ),
  updated_at = now()
WHERE id = '2c435e51-e7bb-4842-8aad-0759ff8cf7aa';

-- EMOCIONAL · Fase 9 — ESCUDO HOLOGRÁFICO
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tu tensión es mínima. El entorno y la opinión de afuera ya no tienen autoridad sobre tu centro. Tu sistema tolera altos niveles de expansión, pero necesita anclajes finales para borrar cualquier rastro de auto-sabotaje sutil o de lealtad inconsciente al dolor.$$,
  sugerencia_text   = $$Aplica estas directivas maestras para operar como un observador desapegado. En este punto, el dolor, el caos y la alegría son simplemente distintas formas de energía que usas para construir la realidad que deseas.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$e9_1$$, 'desc', $$Borra el Pasado: Ante cualquier recuerdo de un error o fracaso anterior, cancela la culpa al instante tratándolo como un "programa viejo". Reconoce que la versión de ti que cometió ese error ya no existe.$$),
    json_build_object('id', $$e9_2$$, 'desc', $$Expande tu Frontera de Luz: Cuando recibas una entrada masiva de abundancia (dinero, reconocimiento, amor puro), bloquea el "sentir que no lo mereces". Oblígate a no hacer nada para "compensarlo". Respira, expande tu cuerpo y reconoce que es el resultado lógico de lo que construiste.$$),
    json_build_object('id', $$e9_3$$, 'desc', $$Neutralidad ante el Caos: Observa el colapso, el drama o el caos del mundo de afuera (noticias, conflictos sociales, crisis ajenas) sin emitir un solo juicio moral y sin gastar una gota de energía intentando corregirlo. Contempla el juego sin entrar a la cancha.$$),
    json_build_object('id', $$e9_4$$, 'desc', $$Cierra sin Demora: Si un proyecto, relación o etapa llega a su fin natural, cierra la puerta ese mismo día. Agradece lo aprendido y libera el espacio de inmediato, sin una sola hora de darle vueltas o melancolía.$$)
  )::text ),
  updated_at = now()
WHERE id = 'b302bee4-5b37-4e75-9e2c-6c816668a2a9';

-- EMOCIONAL · Fase 10 — SUPERCONDUCTIVIDAD (ESTADO CERO)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tu mundo emocional opera en fricción cero. Calma activa absoluta. La provocación se desintegra al tocar tu campo. Eres el centro inquebrantable del huracán, transformando cualquier desgaste de afuera en voluntad de crear al instante.$$,
  sugerencia_text   = $$Has alcanzado el Estado Cero Emocional. Eres el arquitecto de tu propia vida. Tu única tarea ahora es irradiar esta coherencia, manteniendo tu energía cerrada en sí misma y operando desde la calma total.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$e10_1$$, 'desc', $$Rendición Absoluta a la Calma: Suelta cualquier intento de predecir o controlar el cómo se van a manifestar tus visiones. Opera con certeza absoluta sobre el destino final (el "qué") y permite que la vida acomode el mejor camino (el "cómo") sin oponer resistencia.$$),
    json_build_object('id', $$e10_2$$, 'desc', $$Transformación Instantánea (Tiempo de Procesamiento Cero): Ante cualquier golpe, pérdida o ataque directo, anula el tiempo de sufrimiento. Absorbe la tensión, extrae el aprendizaje y conviértelo en energía creadora en el mismo instante en que toca tu campo.$$),
    json_build_object('id', $$e10_3$$, 'desc', $$El Espejo: Al interactuar con personas en mucha oscuridad o sufrimiento, sostén tu luz sin moverte por dentro. Eres un faro que no se altera; no bajas a la cueva a salvar a nadie, simplemente iluminas la salida para quien decida subir.$$),
    json_build_object('id', $$e10_4$$, 'desc', $$Soberanía Permanente: Recuerda y ancla a cada instante que tu valor, tu paz y tu abundancia ya están aprobados de origen. No eres un efecto del entorno; tú eres la causa de tu entorno.$$)
  )::text ),
  updated_at = now()
WHERE id = 'a2dfae45-efdc-4001-a428-46825a5e0c62';

-- ════════════════ PILAR FINANCIERO ════════════════
-- FINANCIERO · Fase 1 — TORNIQUETE ESTRUCTURAL (SELLO DE HEMORRAGIA)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Hay un colapso en tus finanzas y un agotamiento total. Tu sistema nervioso asocia el dinero con peligro, escasez o dolor. Dependes de una sola fuente de ingreso (algo muy frágil) y gastas a cada rato para tapar vacíos emocionales.$$,
  sugerencia_text   = $$Suma estos pequeños anclajes a tu día para detener la pérdida de energía y de dinero. La meta inmediata no es ganar más, sino dejar de vaciarte por inercia.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$g1$$, 'desc', $$Mira tus números: Tienes prohibido esconderte de tus cuentas. Abre tu app del banco todos los días a la misma hora, durante 60 segundos exactos. Observa el saldo en silencio total. Respira por la nariz. Acostumbra a tu sistema nervioso a ver tus números sin entrar en pánico.$$),
    json_build_object('id', $$g2$$, 'desc', $$Regla de las 24 horas: Ante el impulso de comprar cualquier cosa, servicio o comida que no sea estrictamente vital, espera 24 horas. Deja que la emoción del momento se enfríe; si mañana, con la cabeza fría, ves que no es útil, no lo compres.$$),
    json_build_object('id', $$g3$$, 'desc', $$Corta una fuga: Identifica y cancela hoy mismo al menos un cobro recurrente que vacíe tu cuenta cada mes sin darte nada a cambio (apps que no usas, plataformas que no ves, planes que olvidaste).$$),
    json_build_object('id', $$g4$$, 'desc', $$Cambia tu lenguaje: Prohíbete decir y pensar frases como "estoy quebrado", "no tengo dinero" o "es muy caro para mí". Cámbialas por: "Ese gasto no es prioridad para mí en este momento".$$)
  )::text ),
  updated_at = now()
WHERE id = '0375081e-22dc-4442-a895-bb35f814a732';

-- FINANCIERO · Fase 2 — DESCOMPRESIÓN DE SUPERVIVENCIA
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Cargas con una pesadez densa. Trabajas con un esfuerzo extremo, sacrificando tu vitalidad para ganar lo mínimo indispensable. Si guardas dinero no es por estrategia, sino por puro miedo a quedarte en cero.$$,
  sugerencia_text   = $$Ejecuta a diario estos pasos para empezar a separar el peso emocional de cada transacción. Necesitas enseñarte que el dinero es un flujo que necesita moverse, no un tesoro que hay que guardar por terror.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$f2_1$$, 'desc', $$Suelta al pagar: En el momento exacto de hacer un pago (en efectivo o digital), relaja el estómago y la mandíbula. Suelta el aire y repite por dentro: "Suelto esta energía para mantener todo en movimiento. La vida me la devuelve multiplicada".$$),
    json_build_object('id', $$f2_2$$, 'desc', $$Aparta el 1%: Sin importar cuánto ganes o cuánta deuda tengas, aparta el 1% de todo el dinero que entre y mándalo a una cuenta intocable. No es un fondo de emergencia; es un acto para demostrarte que tienes el poder de retener dinero por decisión propia.$$),
    json_build_object('id', $$f2_3$$, 'desc', $$Cuánto vale tu hora: Toma papel y lápiz. Divide tu ingreso mensual entre las horas reales que le das al trabajo (incluyendo traslados y todo lo que sigues pensando en casa). Observa con frialdad de números cuánta vitalidad estás cambiando por cada peso.$$),
    json_build_object('id', $$f2_4$$, 'desc', $$Cero deuda por gustos: Tienes estrictamente prohibido usar crédito (dinero del futuro) para pagar placeres de hoy (comidas, ropa, viajes). Si el dinero no existe en tu cuenta ahora, no tienes permiso de hacer ese gasto.$$)
  )::text ),
  updated_at = now()
WHERE id = 'f3eccc41-8bf4-4ec6-b888-b160410736db';

-- FINANCIERO · Fase 3 — ESTABILIZACIÓN DEL EJE (RUPTURA DE ESCLAVITUD)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Hay esclavitud mecánica y roce en cada intercambio. Tu cuerpo genera dinero, pero la transacción viene cargada de resentimiento o culpa. Tu identidad sube y baja según los números en tu pantalla, y tu energía se agota tratando de complacer a los demás.$$,
  sugerencia_text   = $$Ancla estas calibraciones para romper la inercia de trabajar por pura obligación. La meta es separar tu valor como persona de tu saldo bancario y dejar de negociar tu energía desde el miedo a perder un ingreso.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$f3_1$$, 'desc', $$Tú no eres el número: Cada vez que revises tus cuentas o recibas un pago, repite en voz alta: "Esto es un dato, no soy yo. Mi valor es absoluto; el número es solo un cálculo". Separa al que observa de los datos en la pantalla.$$),
    json_build_object('id', $$f3_2$$, 'desc', $$No bajes el precio por miedo: La próxima vez que alguien cuestione lo que cobras por tu trabajo o tu tiempo, tienes prohibido bajarlo al instante para "salvar" el trato. Sostén el silencio. Deja que la incomodidad recaiga en la otra parte; defiende tu valor sin justificarte.$$),
    json_build_object('id', $$f3_3$$, 'desc', $$Corta lo que te resta: Si tienes una fuente de ingreso que te paga menos de lo que vale tu esfuerzo y te pesa cada día, ponle fecha de caducidad hoy. Arma un plan a 30 o 60 días para cambiar esa situación y liberar espacio para algo mejor.$$),
    json_build_object('id', $$f3_4$$, 'desc', $$Deja de regalar tu trabajo: Deja de dar tu tiempo, tu conocimiento o tu ayuda gratis a quien no lo valora. Lo que sabes y lo que haces es energía condensada; si lo entregas sin un intercambio justo (en dinero o en valor real), te estás vaciando a ti mismo.$$)
  )::text ),
  updated_at = now()
WHERE id = '681b0264-1727-4d2e-990a-b1afb067e371';

-- FINANCIERO · Fase 4 — RUPTURA DEL ESPEJISMO (ESTABILIDAD CONDICIONADA)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Llegaste al límite de tu zona de confort. Ya tienes estabilidad y cubres tus necesidades, pero manejas tu dinero de forma pasiva. El dinero está quieto. Todo el flujo depende 100% de que tú te muevas; si te detienes, el ingreso se cae.$$,
  sugerencia_text   = $$Ejecuta estas directivas para ponerle impulso a tu dinero. Necesitas entender que la comodidad es desgaste disfrazado, y que quedarte quieto por conformismo frena tu crecimiento.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$f4_1$$, 'desc', $$Pon a trabajar lo quieto: Identifica el dinero que tienes "guardado bajo el colchón" (literal o digital) que pierde valor por estar parado. Toma un porcentaje seguro de ese dinero dormido y ponlo en algo que amplíe tu capacidad (un curso que te dé más valor, una herramienta de trabajo, un buen libro, equipo nuevo). Que tu dinero trabaje para ti.$$),
    json_build_object('id', $$f4_2$$, 'desc', $$Sube tu tarifa un 10-15%: Toma lo que cobras por tu trabajo, tu servicio o tu tiempo y súbelo entre 10% y 15% esta misma semana. No le pidas permiso a nadie; simplemente actualiza tu precio y observa cómo todo se reacomoda ante tu nueva postura. (Si trabajas por sueldo fijo, prepárate y agenda la conversación para pedir lo que mereces.)$$),
    json_build_object('id', $$f4_3$$, 'desc', $$Siembra un segundo ingreso: Invierte al menos 2 horas a la semana en diseñar una segunda fuente de ingresos que no dependa de tu tiempo (algo que puedas vender, un servicio extra, un pequeño proyecto aparte). Empieza a construir tu independencia más allá de tu ingreso principal.$$),
    json_build_object('id', $$f4_4$$, 'desc', $$Vence la pereza: Date cuenta del adormecimiento de tu comodidad. Cuando sientas flojera para hacer algo que multiplicaría tu abundancia porque "así estás bien", aplica la regla de los 5 segundos: cuenta hacia atrás desde 5 y obliga a tu cuerpo a arrancar la acción antes de llegar a cero.$$)
  )::text ),
  updated_at = now()
WHERE id = 'e6635250-fae9-433f-bf07-4a242b4d35dc';

-- FINANCIERO · Fase 5 — TRANSICIÓN DE VALOR (EL DESPERTAR MAGNÉTICO)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Estás empezando a separarte de lo que eras. Reconoces que urge dejar de depender de una sola fuente, pero tu cuerpo todavía se acelera o duda un poco a la hora de comunicar tu verdadero valor. El síndrome del impostor sigue ahí, latente.$$,
  sugerencia_text   = $$Ejecuta estas calibraciones para entrenar a tu cuerpo a sostener cifras más altas sin que te tiemble el pulso. Es el momento de eliminar la pena por cobrar.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$f5_1$$, 'desc', $$Cotiza con vértigo: En tu próxima propuesta o cuando pongas un precio a algo, pon un número que te dé un ligero vértigo. Si al fijarlo no sientes que te sudan un poco las manos, estás cobrando por debajo de tu nivel. Haz que el otro se ponga a tu altura, no al revés.$$),
    json_build_object('id', $$f5_2$$, 'desc', $$Invierte en ti: Toma un porcentaje de tu dinero parado y dedícalo a construir lo tuyo. Deja de financiar los proyectos de otros y empieza a poner ese dinero en ti: en aprender algo que te haga valer más, en una herramienta que te impulse o en cualquier idea propia que quieras levantar.$$),
    json_build_object('id', $$f5_3$$, 'desc', $$El rechazo es un filtro: Cuando alguien rechace tu nueva tarifa, prohíbete sentir pérdida o que no eres suficiente. Léelo al instante de otra forma: tu precio alto funcionó perfecto como filtro para mantener fuera de tu camino a las situaciones que no te convienen.$$),
    json_build_object('id', $$f5_4$$, 'desc', $$Revisa de dónde viene tu ingreso: Dibuja cómo entran hoy tus ingresos. Si una sola fuente representa más del 60% de tus cuentas, declara estado de alerta. Diseña hoy mismo un plan a 90 días para repartir ese peso y blindar tu independencia.$$)
  )::text ),
  updated_at = now()
WHERE id = '3d7bff32-bd9d-403f-b021-19eb546efd36';

-- FINANCIERO · Fase 6 — DESPEGUE GRAVITACIONAL (ASIGNACIÓN TÁCTICA)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$La culpa por cobrar se desintegró. Operas con certeza y asignas tus recursos con propósito. El riesgo aquí es estancarte: necesitas actualizar tus herramientas, tu equipo y tu mente para poder con las nuevas cargas de trabajo sin que se haga un cuello de botella.$$,
  sugerencia_text   = $$Implementa estas directivas para tratarte como un sistema de alta eficiencia. El dinero deja de ser un fin en sí mismo y se convierte en una herramienta para construir el futuro que quieres.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$f6_1$$, 'desc', $$Invierte en tu cuerpo y tus herramientas: Aparta un fondo intocable solo para mejorar lo que usas para trabajar y para cuidarte. Pon dinero directo en lo que acelere tu trabajo (mejor equipo, mejores herramientas) y en lo innegociable de tu buena hidratación y tu suplementación de silicio. Tu cuerpo y tus herramientas son lo que más rinde.$$),
    json_build_object('id', $$f6_2$$, 'desc', $$Pon un precio claro y firme: Elimina la idea de cobrar distinto según lo que cada quien pueda pagar. Tu trabajo y tu tiempo valen una cifra exacta. Fija lo que cobras y mantenlo como un muro que nadie puede mover.$$),
    json_build_object('id', $$f6_3$$, 'desc', $$Atrae, no persigas: Detén toda acción que implique "perseguir" dinero o convencer a la gente. Invierte esa energía en hacer crecer tu propio centro: mejorar lo que haces, aprender, construir lo tuyo. Un sol no persigue a los planetas; simplemente aumenta su tamaño y la órbita de los planetas se ajusta sola.$$),
    json_build_object('id', $$f6_4$$, 'desc', $$Sella las fugas: Revisa tus cuentas de los últimos 30 días. Si detectas dinero yéndose en consumo rápido, comida que no te nutre o distracciones, cierra esa vía. Cada peso en tu cuenta es energía que debe sostener tu rumbo, no financiar tu desgaste.$$)
  )::text ),
  updated_at = now()
WHERE id = '079dd878-c131-44a1-965f-5a49fee66bbf';

-- FINANCIERO · Fase 7 — SOBERANÍA OPERATIVA (ARQUITECTURA DESCENTRALIZADA)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Te despegaste por completo del peso emocional de cada transacción. El dinero es solo un dato. Los días de poca liquidez ya no alteran tu paz ni te hacen dudar de tu visión. Tienes varias fuentes de ingreso arrancando, pero todavía necesitas meter la mano tú para que todo siga andando.$$,
  sugerencia_text   = $$Ejecuta estas calibraciones para que tu dinero y tu trabajo fluyan más solos. La meta es que tu valor circule y genere retornos sin que tengas que desgastarte en tareas pequeñas.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$f7_1$$, 'desc', $$Suelta el mantenimiento: Identifica dónde se te va el tiempo en tareas repetitivas y pequeñas (mensajes de siempre, trámites, pendientes que se repiten). Simplifícalas, deja respuestas listas o pide ayuda con ellas. Tu mente debe estar enfocada en lo que de verdad suma, no en lo que solo mantiene.$$),
    json_build_object('id', $$f7_2$$, 'desc', $$Pon un muro de calidad: Establece un nivel mínimo para lo que aceptas hacer. Di que no a lo que te pague poco y te quite mucho. Si algo no merece tu mejor esfuerzo ni tu tiempo, recházalo. Protege tu nivel.$$),
    json_build_object('id', $$f7_3$$, 'desc', $$Ingresos que entran solos: Si creas algo que se venda por sí mismo (un curso, un libro, un producto digital, una plantilla), arma el proceso de venta y entrega de modo que el cobro y todo ocurran en un ciclo cerrado, sin que tengas que estar presente cada vez. Si aún no tienes algo así, este es el momento de empezar a diseñarlo.$$),
    json_build_object('id', $$f7_4$$, 'desc', $$Prueba de ausencia: Desaparece del trabajo durante 3 días completos (cero correos, cero pendientes, cero respuestas). Observa qué partes de tu economía se caen y cuáles siguen generando ingreso. Eso te muestra exactamente dónde está el eslabón débil de tu red.$$)
  )::text ),
  updated_at = now()
WHERE id = '3a2f88d6-e69f-43cc-9cb0-deb32d0a72dc';

-- FINANCIERO · Fase 8 — MAGNETISMO DE AUTORIDAD (PREPARACIÓN 10X)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Lo que tú haces empieza a marcar la pauta a tu alrededor. Cobras desde la certeza absoluta y la gente responde. Estás a un paso de un salto enorme, pero necesitas ensanchar tus bases legales, prácticas y mentales para que un ingreso 10 veces mayor no reviente tu estructura.$$,
  sugerencia_text   = $$Implementa estos pasos para blindar tu estructura antes del gran salto. Cuando llegue la abundancia masiva, tu sistema debe ser un contenedor inquebrantable.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$f8_1$$, 'desc', $$Aguanta la presión (prueba de estrés): Imagina que mañana tu ingreso se multiplica por 10. ¿Tu organización, tus cuentas y tus hábitos aguantarían ese golpe, o se desbordarían? ¿Sabes a dónde iría ese dinero, cómo lo cuidarías y cómo sostendrías el ritmo? Prepara hoy tu capacidad y tu mente para sostener un ingreso mucho mayor, en lo que sea que hagas.$$),
    json_build_object('id', $$f8_2$$, 'desc', $$Cobra por tu valor, no por las horas: Abandona de una vez la idea de justificar lo que cobras solo por el tiempo que te toma. Lo que cobras ya no cubre las horas; cubre tu sello único, tu experiencia y la autoridad de lo que entregas. Tu precio es un filtro de acceso a ti.$$),
    json_build_object('id', $$f8_3$$, 'desc', $$Acostúmbrate a la cifra grande: Escribe en tu pared o tu teléfono la cifra mensual exacta que representa un salto 10 veces mayor para ti. Mírala todos los días hasta que el número deje de sorprenderte, emocionarte o marearte. Acostumbra a tu sistema nervioso a ver esa cantidad como lo normal, antes de que siquiera llegue a tu cuenta.$$),
    json_build_object('id', $$f8_4$$, 'desc', $$Suelta la culpa por ganar: Cuando empieces a ganar en un día lo que otros a tu alrededor ganan en meses, tu mente intentará generar culpa. Córtala de raíz. Date cuenta de que tu abundancia no le quita nada a nadie; al contrario, entre más fuerte sea tu centro, más luz y recursos aportas a tu entorno (tu gente, lo que construyes).$$)
  )::text ),
  updated_at = now()
WHERE id = '2bea5ed8-7b56-4c52-9e18-8d1fd3fae55a';

-- FINANCIERO · Fase 9 — CENTRO DE GRAVEDAD (ARQUITECTURA VIVA)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tu tensión con el dinero es casi nula. Dejaste de cambiar tu tiempo por dinero. Lo que construiste genera ingreso por sí mismo. El dinero entra incluso mientras tu cuerpo descansa.$$,
  sugerencia_text   = $$Ejecuta estas directivas maestras para escalar el impacto de lo que haces. Ya no se trata de asegurar tu independencia, sino de financiar y expandir tu visión a una escala mayor.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$f9_1$$, 'desc', $$Ingreso sin esfuerzo: Elimina cualquier idea interna que ate el "esfuerzo físico" con el "resultado en dinero". Observa cómo el dinero entra a tu cuenta sin que muevas un dedo, gracias a lo que ya dejaste construido. Normaliza cobrar por lo que creaste, no por el sudor de tu frente.$$),
    json_build_object('id', $$f9_2$$, 'desc', $$Construye el futuro que imaginas: El dinero que acumulas ahora es una herramienta para diseñar a gran escala. Destina recursos a hacer realidad tu visión, sea lo que sea para ti: ayudar a tu gente, levantar un proyecto que te emocione o crear algo que deje huella. Tú decides cómo se ve el futuro.$$),
    json_build_object('id', $$f9_3$$, 'desc', $$Inmune a las crisis: Observa las crisis económicas del mundo (inflación, mercados) desde las alturas. Tu economía se sostiene sola. Prohíbete entrar en el pánico colectivo; la escasez de afuera no tiene permiso de penetrar tu escudo.$$),
    json_build_object('id', $$f9_4$$, 'desc', $$Aporta desde la abundancia: Cuando colabores o aportes a otros, hazlo desde la sobre-abundancia. Entrega muchísimo valor sin miedo a "quedarte vacío". Sabes que tu capacidad de generar buenas ideas es infinita.$$)
  )::text ),
  updated_at = now()
WHERE id = '92be497b-3398-4c2e-a48c-6652ce37c10c';

-- FINANCIERO · Fase 10 — SINGULARIDAD DE LA ABUNDANCIA (ESTADO CERO)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Hay cero tensión en tu motor económico. Multiplicas con total naturalidad. El dinero perdió todo su peso y funciona solo como un dato luminoso. Ya no te sorprenden los ingresos grandes; el sí al dinero ocurre en tu mente antes de aparecer en el banco.$$,
  sugerencia_text   = $$Llegaste al Estado Cero económico. Eres el banco, la antena y el arquitecto. Tu única tarea es sostener el espacio creador y dirigir tus recursos con precisión total para manifestar exactamente tu visión.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$f10_1$$, 'desc', $$Deja fluir, no acumules: Disuelve el instinto de guardar por miedo. En el Estado Cero entiendes que tu mayor fuerza está en ser un canal impecable: la energía entra, nutre al sistema y sale enseguida para crear nuevas redes. El dinero que se estanca, se pudre. Sé el canal más rápido y limpio.$$),
    json_build_object('id', $$f10_2$$, 'desc', $$Salta, no crezcas a pasitos: Renuncia a los modelos de crecimiento gradual. Ordena saltos grandes en tu camino. Si necesitas recursos para algo enorme, no los calcules a 5 años; arma la estructura, sostén la certeza absoluta y permite que el dinero llegue de formas inesperadas.$$),
    json_build_object('id', $$f10_3$$, 'desc', $$La misma calma con poco o con mucho: Vive la llegada de 10 pesos o de 10 millones con exactamente la misma calma en el pecho. Agradece la transacción con neutralidad. Tu ego no se infla con el éxito material porque sabe que los millones son simplemente el resultado físico de un buen trabajo.$$),
    json_build_object('id', $$f10_4$$, 'desc', $$Tú eres la fuente: Reconoce a cada segundo que tú eres la fuente de todo tu ingreso. Ningún cliente, ninguna plataforma y ninguna red externa "te da" dinero. Todo el dinero que existe en tu vida es un reflejo directo de tu propia conciencia. Tu fuente de riqueza es inagotable, porque la fuente eres tú.$$)
  )::text ),
  updated_at = now()
WHERE id = '6b3d0c5c-68be-4c5b-9150-9bdbe8ccda91';

-- ════════════════ PILAR VECTOR ════════════════
-- VECTOR · Fase 1 — CORTE DE SUMINISTRO ENTRÓPICO (DESCONEXIÓN DE LA JAULA)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Estás entregado por completo y sin rumbo. Le das el 100% de tu energía a sostener una vida que no elegiste, viviendo con un aburrimiento crónico. El fuego del pecho está apagado y no alcanzas a ver ningún futuro propio.$$,
  sugerencia_text   = $$Suma estos pequeños anclajes de choque. La meta inmediata no es encontrar tu propósito, sino obligarte a sentir el vacío real, sin distracciones, para que tu instinto de supervivencia más profundo vuelva a encenderse.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$v1_1$$, 'desc', $$Recupera tu coordenada: Tienes prohibido entregarle el 100% de tu día al mundo de afuera. Desde hoy, "róbale" 30 minutos innegociables a tu rutina (levantándote antes o aislándote). En esos 30 minutos no haces nada productivo para otros: es tu espacio de vacío para sentarte en silencio y recordar que eres una persona, no una pieza de la máquina.$$),
    json_build_object('id', $$v1_2$$, 'desc', $$Corta la anestesia: Identifica el mecanismo que usas al llegar a casa para "apagar" el hartazgo o el cansancio del trabajo (alcohol, scroll infinito, comida chatarra). Hoy, cuando sientas el impulso de adormecerte, prohíbetelo durante 15 minutos. Siéntate en una silla, en silencio, y siente cruda y físicamente la frustración de tu realidad actual. Usa esa molestia como un golpe que te despierta.$$),
    json_build_object('id', $$v1_3$$, 'desc', $$Mapea tu jaula: Toma un papel y escribe, sin filtros de falsa positividad, todo lo que detestas de tu vida actual: el horario, el jefe, el lugar, la falta de sentido. Obliga a tu mente a mirar de frente su propia prisión para que el cerebro deje de justificarla.$$)
  )::text ),
  updated_at = now()
WHERE id = '967e3b13-d55b-409d-bb59-d89f0e1e09b3';

-- VECTOR · Fase 2 — IGNICIÓN DE CÓDIGO MUERTO (RUPTURA DEL CONFORMISMO)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Sobrevives anestesiado. Funcionas por disciplina forzada o por miedo a derrumbarte. Mantienes tus verdaderos talentos en una "sala de espera" porque el terror a perder tu falsa seguridad te paraliza. Hay un autosabotaje fuerte que te impide arrancar lo tuyo.$$,
  sugerencia_text   = $$Haz a diario estos ejercicios para meter pequeñas dosis de tensión en tu comodidad dolorosa. Hay que enseñarle a tu sistema nervioso que intentar crecer es menos peligroso que pudrirte en la inercia.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$v2_1$$, 'desc', $$Diseña tu "futuro a evitar": Como todavía no ves claro qué quieres construir, usa el camino inverso. Escribe con lujo de detalle el futuro más gris, catastrófico y deprimente que te espera en 5 años si no cambias tu rumbo hoy. Usa el miedo a ese futuro como combustible para arrancar.$$),
    json_build_object('id', $$v2_2$$, 'desc', $$15 minutos de tu talento: Tienes un talento que estás reprimiendo (escribir, diseñar, hablar, construir). Oblígate a practicar exactamente esa habilidad durante 15 minutos al día. No importa si sale mal o si no genera dinero: es una orden directa para mantener vivo ese talento real que llevas dentro.$$),
    json_build_object('id', $$v2_3$$, 'desc', $$Desarma la falsa gratitud: Deja de repetir que "al menos tienes trabajo" para justificar un entorno que te drena el alma. Tienes prohibido usar la gratitud como excusa para conformarte. Agradece que respiras, pero declárate en rebelión total contra tu estancamiento.$$),
    json_build_object('id', $$v2_4$$, 'desc', $$El salto mínimo: Para romper el bloqueo del arranque, usa la "regla de solo tocarlo". Si quieres empezar a escribir o a estudiar una nueva idea, tu única meta del día es abrir el programa o el libro. Solo tocarlo. Quita la presión de "terminar la obra" y concentra toda tu energía en simplemente encender el motor.$$)
  )::text ),
  updated_at = now()
WHERE id = '4982937f-dd99-4bba-b204-6c48a67e1eca';

-- VECTOR · Fase 3 — DESESTABILIZACIÓN DE LA RUEDA (LA CHISPA TERMODINÁMICA)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Funcionas, pero sin chispa. Eres eficiente, aunque operas de forma puramente mental y transaccional. Usas solo una parte de tu talento y entregas un valor estándar que no toca de verdad a nadie. Mides tu futuro con metas que te impone el entorno, no con la obra que tú quieres levantar.$$,
  sugerencia_text   = $$Ancla estas calibraciones para romper la rutina mecánica. La meta es dejar de ser un operario eficiente del sistema y empezar a poner tu sello propio en lo que haces, reactivando el fuego de tu pecho.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$v3_1$$, 'desc', $$Limpia tus metas prestadas: Escribe tus tres objetivos principales de hoy. Si alguno se basa solo en estatus, en acumular cosas o en buscar aprobación de afuera, táchalo. Reemplázalo de inmediato por una meta que construya algo tuyo (ej. "Terminar el primer prototipo de mi proyecto", "Hacer crecer mi base").$$),
    json_build_object('id', $$v3_2$$, 'desc', $$Cuela tu talento: En tu trabajo mecánico diario, tienes prohibido entregar un resultado "estándar". Toma una tarea rutinaria y ponle un 10% de tu talento oculto. Si estás diseñando algo básico, métele en secreto una capa de estética cuidada y propia. Obliga al mundo a recibir tu verdadera frecuencia, aunque nadie te la haya pedido.$$),
    json_build_object('id', $$v3_3$$, 'desc', $$Interrumpe el cálculo frío: Antes de empezar tu bloque de trabajo, revisa cómo se siente tu pecho. Si notas el peso de la obligación, no empieces de inmediato. Respira 10 veces poniendo la atención en el centro del pecho hasta que sientas un leve calorcito. Trabaja desde esa energía física, no desde el cálculo frío.$$),
    json_build_object('id', $$v3_4$$, 'desc', $$Revisa tu impacto real: Analiza a tu último cliente o proyecto. Si lo único que pasó fue un intercambio de dinero por un archivo o un servicio, estás en desgaste. Diseña hoy una forma de añadir un "detalle escondido" (una nota, un gesto, un toque) en tu próxima entrega que siembre una pequeña semilla de despertar en quien la reciba.$$)
  )::text ),
  updated_at = now()
WHERE id = '57905278-02a8-4bf2-a6fc-a5e1fb25d6d6';

-- VECTOR · Fase 4 — RUPTURA DEL ESPEJISMO (TOLERANCIA AL RIESGO)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Llegaste al límite de la jaula de oro. Ya tienes comodidad material, pero vives un conformismo doloroso. Mantienes tu visión en niebla densa y rebajas la calidad de tu obra para hacerla "comercial" o fácil de digerir, traicionando tu propia verdad por miedo a que no te entiendan.$$,
  sugerencia_text   = $$Aplica estas directivas para sacudir tu falsa seguridad. Debes enseñarle a tu sistema que diluir lo que eres es una forma lenta de apagarte, y que la incomodidad de ser auténtico vale más que un éxito sin alma.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$v4_1$$, 'desc', $$Tu sello sin diluir: En tu próxima creación, texto o diseño, tienes estrictamente prohibido "suavizar" el mensaje para que lo entiendan todos. Aplica el nivel y el rigor completos de tu visión. Si el cliente o el mercado se confunden, es responsabilidad de ellos elevar su percepción. No bajes tú el estándar.$$),
    json_build_object('id', $$v4_2$$, 'desc', $$Exponte hoy: Toma un fragmento de tu visión más profunda y arriesgada (esa que tienes guardada porque "aún no es el momento") y publícala, mándala o compártela hoy mismo hacia afuera. Vive el vértigo de ser visto en tu frecuencia real, sin la armadura comercial.$$),
    json_build_object('id', $$v4_3$$, 'desc', $$Recupera tu mejor hora: Observa en qué momento del día tu mente está más afilada y tu energía más alta (tu mejor ventana). Si le estás regalando esa ventana al trabajo de afuera o a resolverle la vida a otros, cancélalo. Ese bloque de tiempo se asigna única y exclusivamente a construir tu propio proyecto.$$),
    json_build_object('id', $$v4_4$$, 'desc', $$Entrena el arranque: Cuando sientas la resistencia inicial para sentarte a construir tu visión, corta el debate mental. Entiende que tu ego odia empezar. Siéntate, toca el teclado o el lienzo, y prohíbete cualquier juicio durante los primeros 5 minutos. Deja que la fuerza misma de la obra te absorba y disuelva la tensión.$$)
  )::text ),
  updated_at = now()
WHERE id = 'b31f985d-fc9d-4d30-97b9-4a3eadfe7a30';

-- VECTOR · Fase 5 — RUPTURA DE MEMBRANA (EL DESPERTAR DE LA FRICCIÓN)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Llegaste al punto de quiebre. Ya no toleras el vacío del desgaste. Tomas riesgos calculados, pero arrancar hacia tu propia visión todavía te exige disciplina forzada. La niebla del futuro empieza a despejarse y aparecen los primeros planos concretos de lo que quieres construir.$$,
  sugerencia_text   = $$Aplica estos anclajes para mover la energía de la frustración hacia la construcción real. Es el momento de dejar de ser un operario que sueña y convertirte en un estratega que ejecuta.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$v5_1$$, 'desc', $$Cambia de carril: Deja de tratar tus proyectos centrales como "hobbies" o "cosas paralelas". Invierte el orden en tu cabeza: tu visión es tu trabajo principal; las tareas de afuera que te dan sustento son solo los inversores temporales que financian tu obra.$$),
    json_build_object('id', $$v5_2$$, 'desc', $$Riesgo calculado: Identifica una cuerda de seguridad (un cliente tóxico, un proyecto seguro pero sin alma, un hábito de comodidad) y córtala esta misma semana. Oblígate a sentir un vacío controlado para que tu energía de supervivencia se redirija por instinto hacia lo que de verdad quieres construir.$$),
    json_build_object('id', $$v5_3$$, 'desc', $$Aterriza la niebla: Tienes prohibido dejar tus ideas en lo abstracto. Dedica un bloque de 60 minutos a bajar tu visión a un plano concreto. Dibuja el mapa de tu proyecto, cómo fluyen sus partes y las fechas en que se harán realidad tus libros y plataformas. Obliga a la idea a convertirse en algo gráfico y tangible.$$),
    json_build_object('id', $$v5_4$$, 'desc', $$Trabaja sin inspiración: Mata el virus de "esperar a estar motivado". La motivación es una emoción inestable. Siéntate frente al teclado en tu ventana de tiempo asignada y trabaja, escribas o diseñes, con la misma frialdad con que te cepillas los dientes. La inspiración es la recompensa de la disciplina, no su requisito.$$)
  )::text ),
  updated_at = now()
WHERE id = 'eadc20f1-4299-4fa9-a3ca-905b54c41959';

-- VECTOR · Fase 6 — TRANSICIÓN ARQUITECTÓNICA (EL TIMÓN DE SILICIO)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tomaste el timón. La mayor parte de tu atención ya apunta a lo que de verdad te enciende. Sientes una combustión limpia en el pecho cuando creas. Empiezas a elevar el ambiente de tu entorno cercano, pero tu sistema necesita blindaje para no volver a diluir lo tuyo ante las presiones de afuera.$$,
  sugerencia_text   = $$Aplica estas directivas para proteger la pureza de tu señal. Tu obra ya no es un experimento: es la herramienta con la que estás cambiando la conciencia de quienes te rodean.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$v6_1$$, 'desc', $$Fidelidad sin concesiones: Cuando muestres tu obra o servicio al mundo, cambia la pregunta "¿qué es lo que quieren?" por la afirmación "esto es lo que transmito". Si alguien pide que bajes la calidad de tu diseño o la profundidad de tu filosofía, rechaza el trato. Protege el estándar de tu mejor versión.$$),
    json_build_object('id', $$v6_2$$, 'desc', $$Vive en tu zona de flujo: Detecta con claridad cuáles son las tareas exactas que te hacen entrar en "éxtasis productivo" (donde el tiempo desaparece y no sientes hambre ni cansancio). Reorganiza tu día para garantizar que al menos el 40% de él lo pases dentro de esa zona de flujo.$$),
    json_build_object('id', $$v6_3$$, 'desc', $$Revisa a quién elevas: Mira tus últimas tres interacciones importantes (entregas, conversaciones profundas, asesorías). Si la otra persona no se fue con más claridad, energía o conciencia de la que llegó, tu mensaje no está calando. Ajusta cómo entregas tu valor para que sea profundamente transformador.$$),
    json_build_object('id', $$v6_4$$, 'desc', $$Veta la duda comercial: Cuando escribas los capítulos de tus libros, apaga el filtro del "lector promedio". Escribe para la versión más alta e inteligente de cada persona. Confía en que tu obra atraerá por sí sola a quienes ya están listos para recibir tu frecuencia cruda.$$)
  )::text ),
  updated_at = now()
WHERE id = '8d939789-9b58-4c36-ad8b-f884af36035a';

-- VECTOR · Fase 7 — ALINEACIÓN DE VECTOR (EXPANSIÓN GENÉTICA)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tu talento de base ya está encendido. Tu trabajo diario te exige usar tu don principal. Sientes la gratitud del entorno a tu alrededor y arrancar te cuesta muy poco. Tienes los planos listos y tu visión es clara y concreta.$$,
  sugerencia_text   = $$Aplica estas calibraciones para sellar tu rumbo. La meta es eliminar cualquier fuga de energía por los lados y alinear cada respiración hacia hacer realidad tu obra principal.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$v7_1$$, 'desc', $$Toda tu energía a un solo centro: Decreta el fin de la dispersión. Toda tu energía productiva y creativa debe apuntar al mismo centro de gravedad (tu proyecto principal). Si un proyecto paralelo o una invitación no nutre, no financia ni expande tu visión central, recházalo en menos de 10 segundos.$$),
    json_build_object('id', $$v7_2$$, 'desc', $$Libera tu don: Delega o automatiza cualquier tarea que te exija un esfuerzo enorme sin hacerte crecer. Tu tiempo de trabajo debe quedar reservado estrictamente para tu zona de genialidad (diseño de alta calidad, ideación y creación de tu obra).$$),
    json_build_object('id', $$v7_3$$, 'desc', $$No te alimentes del aplauso: A medida que tu obra impacta a más gente, empezarás a recibir aplausos de afuera. Tienes prohibido alimentar tu ego con ellos. Recibe la gratitud, pero tradúcela de inmediato como una simple "señal de confirmación" de que vas bien apuntado. Mantén la cabeza fría.$$),
    json_build_object('id', $$v7_4$$, 'desc', $$El reto de frente: Identifica la parte más compleja de tu visión actual (ej. integrar varias piezas de tu trabajo o estructurar un nuevo libro). En lugar de evitarla, hazla tu primer bloque de trabajo del día. Ataca de frente lo más difícil para generar un impulso imparable.$$)
  )::text ),
  updated_at = now()
WHERE id = '4d6daaa3-dbfd-4c2d-b3a1-2c1936691a53';

-- VECTOR · Fase 8 — MAGNETISMO ACTIVO (ÉXTASIS PRODUCTIVO)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Tu fuego es limpio y constante. El tiempo desaparece cuando creas. La acción brota sin forzarla: no empujas la obra, la dejas pasar a través de ti. Te recargas de energía mientras trabajas. Tu sistema no hace concesiones y le exiges al mundo que eleve su mirada.$$,
  sugerencia_text   = $$Aplica estos ejercicios de élite para proteger tu estado de flujo. En este nivel de energía, la más mínima interrupción o cualquier dilución del mensaje rompe la fuerza de lo que transmites.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$v8_1$$, 'desc', $$Santuario de flujo: Protege tu bloque de máxima creación como si fuera una zona sellada. Cero notificaciones, cero interacciones, cero distracciones. Durante el estado de flujo el silencio debe ser absoluto para que el tiempo desaparezca.$$),
    json_build_object('id', $$v8_2$$, 'desc', $$Profundidad innegociable: Al escribir los capítulos de tus libros, sostén la exigencia sin importar la presión comercial: el estándar de profundidad no baja del rango de 3,500 a 5,000 palabras de contenido puro por capítulo. La densidad y la fidelidad de la obra no se negocian para acomodar a mentes perezosas.$$),
    json_build_object('id', $$v8_3$$, 'desc', $$Entrégate al impulso: Cuando esa atracción invisible te llame hacia la obra, prohíbete posponerla, aunque no estuviera en tu horario lógico. Si sientes el llamado a escribir o a crear, obedece al instante. La fuerza del propósito es más importante que cualquier agenda.$$),
    json_build_object('id', $$v8_4$$, 'desc', $$Mide profundidad, no cantidad: Al evaluar el impacto de tu trabajo, deja de medir "a cuántos" llegas y empieza a medir "qué tan hondo" calas. Vale infinitamente más elevar de verdad a una sola persona hacia su mejor versión que entretener a diez mil que siguen dormidas.$$)
  )::text ),
  updated_at = now()
WHERE id = '697a1cad-6862-41b5-a8b4-719ee79237bf';

-- VECTOR · Fase 9 — ALTERACIÓN DE MATRIZ (ATRACCIÓN GRAVITACIONAL)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Hay una atracción total hacia tu obra. Te cuesta infinitamente más detener el trabajo que empezarlo. Tu vida y tu creación ya son lo mismo. Tienes una certeza casi profética de tu futuro porque ya lo viste con claridad. Tu sola presencia cambia la realidad inmediata a tu alrededor.$$,
  sugerencia_text   = $$Aplica estas directivas maestras para escalar la influencia a tu alrededor. Ya no eres un participante del sistema: eres una fuente activa que eleva a quienes toca.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$v9_1$$, 'desc', $$Siembra permanente: Asegúrate de que cada parte de tu visión, tu negocio o tu arte esté diseñada no solo para ser útil, sino para elevar de forma permanente a quienes la tocan. Tu obra debe contagiar luz a su paso.$$),
    json_build_object('id', $$v9_2$$, 'desc', $$Fusiona tu vida y tu obra: Borra el límite mental entre tu tiempo "libre" y tu tiempo "productivo". Entiende que cuidar tu cuerpo, nutrirte bien, entrenar tu fuerza o descansar en el vacío son actos de construcción tan válidos como trabajar en tu obra principal. Todo alimenta lo mismo.$$),
    json_build_object('id', $$v9_3$$, 'desc', $$Deja de empujar: Renuncia por completo a la energía de "empujar" o forzar resultados. Si un proyecto, contacto o resultado presenta una resistencia antinatural y prolongada, retira tu energía de inmediato. Opera 100% desde la atracción: lo que es para ti fluye sin tensión.$$),
    json_build_object('id', $$v9_4$$, 'desc', $$Camina con certeza: Avanza hacia tu visión sin mirar a los lados para medir a la "competencia". En tu frecuencia, la competencia no existe: solo hay otras personas operando en niveles distintos. Camina tu rumbo con la calma de quien ya sabe cómo termina la historia.$$)
  )::text ),
  updated_at = now()
WHERE id = 'd9fa7cc6-c526-4d62-a5ac-59d525e46b72';

-- VECTOR · Fase 10 — LA SINGULARIDAD DEL PROPÓSITO (ESTADO CERO)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Cero tensión en tu motor de expansión. Eres el arquitecto de tu propia obra. Toda tu energía materializa lo que eres en esencia. Tu mensaje es crudo, firme y perfecto. La vida se vive a sí misma a través de tu creación, y no negocias tu energía bajo ninguna circunstancia.$$,
  sugerencia_text   = $$Llegaste al punto más alto del propósito. Eres el centro de tu propia realidad. Tu única tarea logística es mantener la antena limpia y sostener el espacio para que todo se organice alrededor de tu energía.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$v10_1$$, 'desc', $$Pura canalización: Al escribir los principios de tu propia filosofía, armar tus sistemas o diseñar tu obra mayor, apaga la mente lógica. No "pienses" lo que creas, déjalo caer. Eres un canal limpio: la genialidad no te pertenece, simplemente eres el recipiente despejado que la usa para llegar.$$),
    json_build_object('id', $$v10_2$$, 'desc', $$Cero tolerancia a lo que te baja: Rechaza de inmediato y sin dudar todo lo que no tenga alma. Si un lugar, una propuesta de negocio o una interacción baja tu frecuencia, corta el contacto en el acto, sin importar el costo material momentáneo. Tu mundo no admite desgaste.$$),
    json_build_object('id', $$v10_3$$, 'desc', $$Irradia desde ya: Entiende que tu visión más alta no es algo que "vas a lograr en el futuro": es algo que ya existe y respira a través de ti hoy. Tu simple constancia de habitar una frecuencia superior enciende a quienes están dormidos a tu alrededor. Sé el sol; los planetas entran en órbita solos.$$),
    json_build_object('id', $$v10_4$$, 'desc', $$Tu existencia es la obra: Reconoce como verdad inamovible que tu mayor aporte al mundo no es lo que construyes, lo que vendes o lo que produces. Tu obra más grande es la frecuencia pura que sostienes dentro de tu propio cuerpo. Tu sola existencia ya eleva el entorno.$$)
  )::text ),
  updated_at = now()
WHERE id = '4e256ca2-379e-4e21-8090-719fadbed47e';

-- ════════════════ PILAR ÓRBITA ════════════════
-- ORBITA · Fase 1 — TORNIQUETE DE DRENAJE (CUARENTENA DE RED)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Se detecta un colapso en tus vínculos y una fuga grave de energía. Tu sistema entrega toda su vitalidad a relaciones que funcionan como agujeros negros. Vives con una máscara puesta las 24 horas por miedo a no encajar, y te contaminas al instante con el desgaste de los demás.$$,
  sugerencia_text   = $$Suma estos anclajes de choque para detener la fuga masiva de energía. El objetivo no es mejorar tus relaciones actuales, sino aislar tu centro para que tu sistema nervioso recuerde cómo se siente tu propia energía sin que nadie la drene.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$o1_1$$, 'desc', $$Cuarentena de Contagio: A partir de este momento, tienes prohibido participar, asentir o escuchar sesiones de queja, chisme o victimismo. Si alguien a tu alrededor arranca con esa frecuencia, tu orden es cortar en seco: levántate y sal del lugar, o di de frente "no tengo energía para este tema hoy".$$),
    json_build_object('id', $$o1_2$$, 'desc', $$Mapa de la Fuga: Toma un papel y escribe los nombres de las 3 personas con las que más interactúas y que te dejan físicamente exhausto después de verlas. Mira esas relaciones no como lazos de amor, sino como cables que te extraen la energía. Reconocer quién te drena es el primer paso para soltarte.$$),
    json_build_object('id', $$o1_3$$, 'desc', $$Pequeña Ruptura de la Máscara: Una vez en las próximas 24 horas, cuando estés a punto de decir "sí" o sonreír por compromiso en una situación social, oblígate a sostener la neutralidad. No finjas la sonrisa. No des la respuesta complaciente. Deja que la incomodidad la sientan los demás mientras tú proteges tu verdad.$$),
    json_build_object('id', $$o1_4$$, 'desc', $$El Veto de la Explicación: Cuando necesites cancelar un compromiso o negarte a un favor que te drena, hazlo en menos de 10 palabras (ej. "No podré asistir, gracias"). Prohibido inventar excusas, pedir disculpas de más o justificar tu decisión. Tu "no" es una frontera completa.$$)
  )::text ),
  updated_at = now()
WHERE id = '04e7cd5e-1d09-47f7-9765-f7efc20d60d1';

-- ORBITA · Fase 2 — RUPTURA DE ORIGEN (DESMANTELAMIENTO DE CULPA)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Se detecta lealtad tóxica y obligación heredada. Sostienes relaciones por inercia o por un falso sentido de deber hacia tu familia o viejas amistades, como si fueras prisionero de tu origen. Tus rupturas son dramáticas y sueltan hilos de culpa que doblegan tu escudo.$$,
  sugerencia_text   = $$Ejecuta a diario estas prácticas para desmontar la ilusión de la deuda emocional. Tienes que enseñarle a tu ego que cortar con lo que te desgasta no es egoísmo, sino un acto de supervivencia para sostener lo que estás construyendo.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$o2_1$$, 'desc', $$Cancelación de la Deuda Heredada: Identifica un evento familiar, reunión o tradición a la que asistes puramente por "obligación cultural" y que sabes que te va a hundir. Cancela tu asistencia hoy. Recibe la culpa inicial en tu cuerpo, respírala y observa cómo, después de unos minutos, esa culpa se transforma en una enorme liberación de espacio mental.$$),
    json_build_object('id', $$o2_2$$, 'desc', $$Freno a la Mendicidad Social: Revisa tus conversaciones. Si eres tú quien siempre inicia el contacto con personas que tardan días en responder, que te cancelan o que no muestran interés en tu crecimiento, corta el suministro hoy. Deja de perseguir. Si el lazo muere por tu inacción, ese lazo nunca tuvo peso real.$$),
    json_build_object('id', $$o2_3$$, 'desc', $$Desconexión del Duelo Dramático: Si estás soltando a una pareja o amistad tóxica, elimina todo acceso a su rastro. Bloqueo digital absoluto. No mires sus redes, no preguntes por ellos. No dejes que tu mente consuma el ruido del pasado, para que la herida en tu energía pueda cerrar.$$),
    json_build_object('id', $$o2_4$$, 'desc', $$Auditoría de Fuerza Interior: Ante el chantaje emocional de un familiar o conocido (ej. "con todo lo que he hecho por ti"), oblígate a responder desde la calma y la claridad, no desde la emoción del momento. Desactiva la manipulación así: "Mi amor por ti es real, pero mi energía ahora no está disponible para esta exigencia". No negocies tu frontera.$$)
  )::text ),
  updated_at = now()
WHERE id = '6ddd8121-b731-43ac-bf43-be62307948c2';

-- ORBITA · Fase 3 — DESACTIVACIÓN DEL AISLAMIENTO (PERMEABILIDAD TÁCTICA)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Se detecta el síndrome del "lobo herido": una independencia excesiva y defensiva. Tu sistema reconoce lo tóxico del entorno y reacciona cerrando todas sus entradas. Operas en silencio por miedo al conflicto y rechazas mostrarte vulnerable. Das de forma crónica, pero tu escudo impide que la red te sostenga.$$,
  sugerencia_text   = $$Ejecuta estas calibraciones para transformar el miedo al rechazo en una apertura estratégica. Quien se aísla pierde conexión. El objetivo es aprender a recibir energía de los demás sin sentir que tu soberanía está en peligro.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$o3_1$$, 'desc', $$Recepción Activa: La próxima vez que alguien te ofrezca ayuda genuina, un favor o un halago, tienes prohibido rechazarlo, minimizarlo o intentar "pagarlo" al instante. Di "Gracias, lo recibo" y tolera físicamente la incomodidad de ser sostenido por otros.$$),
    json_build_object('id', $$o3_2$$, 'desc', $$Abre una Rendija: En un entorno donde normalmente te quedarías callado para no incomodar, muestra un destello de quién eres de verdad (una opinión sobre tu mejor versión, una visión de lo que construyes). Observa que el mundo no se derrumba cuando dejas ver tu frecuencia real.$$),
    json_build_object('id', $$o3_3$$, 'desc', $$Purga del Rencor Pendiente: El aislamiento se alimenta del recuerdo del dolor pasado. Identifica a alguien que traicionó tu energía, visualiza ese hilo que aún los une, y declara: "La lección está aprendida. Recupero mi energía". No se trata de perdonar por moral, sino de liberar tu mente.$$),
    json_build_object('id', $$o3_4$$, 'desc', $$Auditoría de Transparencia: Evalúa tu entorno actual. Si en tus relaciones operas calculando cada palabra para no salir herido, esa no es tu gente. Define por escrito el nivel exacto de transparencia que necesitas para apagar tus defensas y bajar los escudos.$$)
  )::text ),
  updated_at = now()
WHERE id = 'd5cfade1-0b62-4d0d-b044-249a89896ac7';

-- ORBITA · Fase 4 — IGNICIÓN RELACIONAL (RUPTURA DE LA INERCIA)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Se detecta compañía mecánica y expresión a medias. Tus relaciones más cercanas son pacíficas pero sin vida; compañeros funcionales que no crecen contigo. Solo muestras tu verdadera señal a unos pocos elegidos y mantienes hilos invisibles de nostalgia hacia vínculos del pasado.$$,
  sugerencia_text   = $$Ancla estas directivas para inyectar fuerza en tus conexiones. Una órbita meramente funcional no basta para tu mejor versión. Tienes que exigir que tus relaciones eleven tu Índice de Luz o, si no, reubicarlas en órbitas más lejanas.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$o4_1$$, 'desc', $$El Test de Evolución: Con tu vínculo principal o tu amistad más cercana, abre hoy una conversación de altura (tu visión del futuro, lo que estás construyendo en tus proyectos). Si la otra persona la esquiva, bosteza o la trivializa, la tensión que estaba escondida acaba de quedar a la vista y pide un ajuste de distancia.$$),
    json_build_object('id', $$o4_2$$, 'desc', $$Corta los Hilos Invisibles: Elimina de forma definitiva el acceso a personas de tu pasado que revisas de vez en cuando por "curiosidad" o nostalgia. Tu energía presente y tu crecimiento no tienen por qué financiar los recuerdos de una etapa que ya superaste.$$),
    json_build_object('id', $$o4_3$$, 'desc', $$Fin de la Negociación Diplomática: Cuando tu familia o tu grupo te presione para meterte en dinámicas que te desgastan, suelta la diplomacia que te agota. Pon un límite neutro, sin carga emocional: "Esa frecuencia ya no es compatible con quien soy hoy".$$),
    json_build_object('id', $$o4_4$$, 'desc', $$Sube el Volumen de tu Señal: Expande el radio de tu energía. Elige un entorno donde sueles quedarte a media voz y comparte tu visión de forma abierta. Si el entorno se incomoda o te rechaza, agradécelo: es la confirmación de que el mundo te está empujando, de forma natural, hacia tu verdadero lugar.$$)
  )::text ),
  updated_at = now()
WHERE id = 'd0e276ad-1f48-47b1-a4e0-93a08ed9c448';

-- ORBITA · Fase 5 — TRANSICIÓN DE ÓRBITA (EL DESFASE FRECUENCIAL)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Se detecta una tensión de fondo y un cambio en curso. Sientes la brecha entre tu nueva vibración y la de tu entorno. Vives en un aislamiento funcional porque te estás alejando de lo que te bajaba, pero todavía no conectas con tu nueva red. Aparece la tentación de apagar tu propia luz o de "jalar" a otros para no sentirte solo.$$,
  sugerencia_text   = $$Ejecuta estas directivas para sostener el vacío. El error más grave en esta etapa es volver a vínculos caducos por pánico a la soledad temporal. El vacío no es un castigo: es la cámara de descompresión necesaria antes del salto.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$o5_1$$, 'desc', $$Muerte del Síndrome del Salvador: Renuncia hoy, en voz alta y por dentro, a la idea de "despertar", arrastrar o convencer a tu pareja, familia o amigos para que vean tu visión. Su evolución no es tu responsabilidad. Tu única tarea es brillar; si su sistema no tolera tu luz, la tensión debe forzar la separación, no que tú te apagues.$$),
    json_build_object('id', $$o5_2$$, 'desc', $$El Desvío Elegante: Cuando alguien que te desgasta intente descargar quejas o victimismo en ti, usa el vacío a tu favor. No discutas, no intentes darle "soluciones" a quien solo quiere quejarse. Responde con un simple: "Entiendo que lo veas así", y retira tu atención del lugar. Que su desgaste resbale sin tocar tu centro.$$),
    json_build_object('id', $$o5_3$$, 'desc', $$Tolera la Tensión del Vacío: Cuando sientas el impulso de escribirle a alguien de tu pasado solo para llenar el silencio de un domingo por la tarde, frena. Siéntate en ese vacío. Tolera el eco de tu propia consciencia hasta que el pánico a la soledad se transforme en soberanía absoluta.$$),
    json_build_object('id', $$o5_4$$, 'desc', $$Cero Apagar tu Luz: En tus interacciones inevitables con el entorno, tienes prohibido "hacerte pequeño" para no hacer sentir mal a los demás. Si tus victorias, tu visión o tu disciplina incomodan sus inseguridades, mantente firme. Que tu existencia sea un espejo de su propio conformismo.$$)
  )::text ),
  updated_at = now()
WHERE id = 'd44de7f9-2e78-4e36-ad1f-5780aa5ded5a';

-- ORBITA · Fase 6 — PODA CUÁNTICA (LA CIRUGÍA LIMPIA)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Se detecta el bisturí en acción. Ya entendiste que las relaciones que te desgastan te drenan. Tu soberanía sobre tu propio linaje está declarada y los cortes se vuelven limpios y prácticos. Empiezas a permitirte cierta apertura consciente, aprendiendo a ser sostenido sin perder tu poder.$$,
  sugerencia_text   = $$Aplica estas calibraciones para acelerar la limpieza de tu energía. Una poda de fondo exige cortar las ramas muertas desde la raíz, sin culpa, sin drama, con una claridad fría que nace del amor propio.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$o6_1$$, 'desc', $$Ejecuta la Cirugía Limpia: Identifica esa relación (amistad, socio o contacto) que sabes que ya caducó. Suéltala hoy. No hacen falta discusiones interminables ni cierres dramáticos. Agradece la lección por dentro, comunica el cierre de forma neutral si es necesario, y cierra el acceso.$$),
    json_build_object('id', $$o6_2$$, 'desc', $$Límite Familiar Activo: La próxima vez que un familiar exija tu energía apoyándose en "la sangre y el deber", ejerce tu soberanía sin dar explicaciones largas. Un simple "Los amo, pero no voy a participar en esto" es una barrera completa. Suelta la necesidad de que te entiendan.$$),
    json_build_object('id', $$o6_3$$, 'desc', $$Ejercicio de Apertura Consciente: Busca a alguien de tu entorno con quien resuenes, y pídele un consejo, un apoyo o simplemente que te escuche. Obliga a tu "lobo solitario" a bajar los escudos y vivir la experiencia de recibir energía limpia sin sentir que debes algo a cambio.$$),
    json_build_object('id', $$o6_4$$, 'desc', $$Consolida el Nuevo Estándar: Traza una frontera mental infranqueable. Una vez que hayas sacado de tu entorno a alguien que te baja, tienes prohibido readmitirlo por lástima o por promesas vacías de cambio. La cámara de descompresión solo avanza hacia adelante.$$)
  )::text ),
  updated_at = now()
WHERE id = '431f1bb5-3972-449c-9ff5-e1b232b77a4d';

-- ORBITA · Fase 7 — SINTONÍA POR AFINIDAD (RESONANCIA ACTIVA)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Se detecta comunicación abierta y sintonía natural. La conexión con tu círculo cercano es consciente y respeta la libertad del otro. Ya no fuerzas las interacciones ni asistes a eventos por compromiso. Te encuentras de forma natural con gente que vibra en tu misma frecuencia.$$,
  sugerencia_text   = $$Ejecuta estas calibraciones para afinar la pureza de tu señal. El objetivo es dejar de "hacer contactos" desde el ego o la necesidad, y empezar a tejer tu red puramente a través de la resonancia de tu obra y tu frecuencia.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$o7_1$$, 'desc', $$Transmisión Sin Disculpa: En tu próxima interacción, prohíbete usar frases que suavicen tu visión ("bueno, es solo mi idea", "quizás estoy loco pero..."). Comparte lo tuyo con seguridad absoluta. Si incomoda, es señal de que estás en el cuarto equivocado, no de que tu mensaje esté mal.$$),
    json_build_object('id', $$o7_2$$, 'desc', $$Fin del Esfuerzo Relacional: Identifica cualquier relación o alianza (amistad o socio) donde sientas que eres tú quien siempre inicia, empuja o "jala" la carreta. Retira ese empuje hoy. Si la relación no se sostiene por interés mutuo, deja que la distancia natural haga su trabajo.$$),
    json_build_object('id', $$o7_3$$, 'desc', $$Calibración de Resonancia Íntima: Con tu vínculo principal, abran un espacio de crecimiento consciente. Dediquen una hora a la semana, estrictamente, a revisar cómo van juntos, detectar fugas de energía y reorientar el rumbo, funcionando como dos motores alineados y no como simples compañeros de piso.$$),
    json_build_object('id', $$o7_4$$, 'desc', $$Apertura Activa: Pide el apoyo de tu red en una tarea o proceso que normalmente harías solo. Demuéstrale a tu escudo que bajar las defensas ante gente alineada no es debilidad, sino una forma inteligente de aprovechar la energía de todos.$$)
  )::text ),
  updated_at = now()
WHERE id = '7383b275-d7b3-4a63-badd-b7247619358f';

-- ORBITA · Fase 8 — ECOSISTEMA DE SOBERANOS (REPELENCIA MAGNÉTICA)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Se detecta la formación de un campo de fuerza. Tu círculo es pequeño, impenetrable y de altísima calidad. Das desde la abundancia, con cero culpa. Hay un efecto de repulsión natural: tu luz es tan densa que quienes drenan y quienes viven en victimismo se auto-exilian de tu órbita, porque la tensión les resulta insoportable.$$,
  sugerencia_text   = $$Aplica estos protocolos de élite para blindar tu red. A este nivel, no puedes dejar entrar ni un solo caballo de Troya. Tu entorno es un espacio cerrado donde solo se habla el lenguaje de crear y materializar.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$o8_1$$, 'desc', $$Poda de Alta Calidad: Haz una última revisión de tu primer círculo de confianza. Si detectas a alguien que todavía responde a tus éxitos con envidia disimulada, escepticismo crónico o comentarios pasivo-agresivos, retírale el acceso a tu centro. Tu primer círculo debe estar formado solo por personas transformadas que celebran tu salto.$$),
    json_build_object('id', $$o8_2$$, 'desc', $$Presencia Irreverente: Cuando entres a un espacio físico o digital dominado por el desgaste del entorno, no te adaptes a su forma. Sostén tu Índice de Luz al máximo. Haz que toda la sala sienta tu frecuencia. El entorno se reacomodará para recibirte o te expulsará de forma natural. Ambas son victorias.$$),
    json_build_object('id', $$o8_3$$, 'desc', $$Entrega de Sobreabundancia: Entrega valor, tiempo o conocimiento a alguien de tu entorno de forma generosa, pero con una regla interna estricta: no esperar nada a cambio. Entrena a tu sistema a dar puramente porque estás desbordado de energía, eliminando el modelo de deuda y obligación.$$),
    json_build_object('id', $$o8_4$$, 'desc', $$Mantenimiento del Escudo: Cuando detectes la mínima vibración de manipulación, chisme o drama entrando en tu radar, no uses el desvío elegante; usa el corte seco. "Esta conversación baja la energía. Hasta aquí". Que tu intolerancia a lo tóxico sea legendaria e inquebrantable en tu entorno.$$)
  )::text ),
  updated_at = now()
WHERE id = 'cfa9a2cd-606c-433b-8beb-6c5cbcb816ba';

-- ORBITA · Fase 9 — FUERZA GRAVITACIONAL (MULTIPLICADOR DE CAMPO)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Se detecta la formación de un núcleo de altísima densidad. Eres un Multiplicador de Campo. La unión íntima con tu vínculo principal (pareja o socio) genera una reacción que desafía la suma simple: no se suman, se multiplican. Ya no buscas conexiones; creas realidades que acercan a la gente correcta hacia tu órbita de forma inevitable.$$,
  sugerencia_text   = $$Ejecuta estas directivas maestras para operar como el sol de tu propio sistema. Ya no necesitas "protegerte" del entorno, porque tu energía es lo suficientemente fuerte para reescribir las reglas del espacio que habitas.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$o9_1$$, 'desc', $$Enciende los Motores Gemelos: Si tienes un vínculo principal de alta resonancia, eliminen la fricción del día a día. Diseñen un acuerdo donde las debilidades de uno queden cubiertas de forma automática por las fortalezas del otro. Que la relación deje de ser un espacio de "mantenimiento emocional" y se convierta en una cámara que los acelera a ambos.$$),
    json_build_object('id', $$o9_2$$, 'desc', $$Cancela la Búsqueda: Elimina el último rastro de esfuerzo por atraer aliados, clientes o gente. Tu único trabajo es expandir tu propia masa (tu conocimiento, tu paz, tu obra). Al aumentar tu densidad, la órbita de las personas correctas se ajustará sola hacia ti.$$),
    json_build_object('id', $$o9_3$$, 'desc', $$Eleva con tu Presencia: Permite que tu sola existencia cambie la habitación. No necesitas hablar de tu mejor versión para transmitirla. Entra a los espacios sosteniendo un anclaje absoluto en el momento presente. Tu silencio y tu postura deben bastar para elevar la energía de quienes te rodean.$$),
    json_build_object('id', $$o9_4$$, 'desc', $$Filtrado Natural: Acepta que, a medida que tu luz crece, proyectará sombras más largas en quienes aún no sanan. Si alguien cercano reacciona con hostilidad irracional ante tu crecimiento, no lo tomes personal. Tu luz simplemente iluminó sus propias heridas. Mantén el rumbo hacia adelante y deja que tu entorno se depure solo.$$)
  )::text ),
  updated_at = now()
WHERE id = '1f09a930-9039-4876-9643-b5bea29cc225';

-- ORBITA · Fase 10 — ENTRELAZAMIENTO CUÁNTICO (ESTADO CERO)
UPDATE public.libreria_protocolos SET
  descripcion_corta = $$$$,
  alerta_text       = $$Se detecta Fricción Cero en tus relaciones. Tu red funciona con respaldo perfecto. Das y recibes energía sin resistencia. El aislamiento y la dependencia ya no existen; operas en armonía pura con el todo. Eres el núcleo vivo: tu presencia nutre a la red, y la red te sostiene con precisión exacta.$$,
  sugerencia_text   = $$Has alcanzado el Estado Cero en tus relaciones. Tu energía es a la vez inquebrantable y abierta. Eres el soberano de tu entorno. Sostén el canal abierto y permite que el amor, como fuerza viva y no como apego, fluya a través de ti.$$,
  tareas_json = to_jsonb( json_build_array(
    json_build_object('id', $$o10_1$$, 'desc', $$Armonía de Fricción Cero: Apaga la calculadora interna de "quién da más". En el Estado Cero, dar y recibir son exactamente el mismo movimiento. Permite que tu entorno te nutra de forma natural cuando lo necesites, sabiendo que al recibir estás dejando que otra persona expanda su propia luz.$$),
    json_build_object('id', $$o10_2$$, 'desc', $$Soltar y Renacer al Instante: Si una conexión debe terminar, deja que la muerte y el renacimiento ocurran a la vez. Cero duelo prolongado. La separación ocurre en tiempo real y la energía que se libera de ese lazo roto se transforma en el mismo instante en un nuevo salto en tu camino. Tu firma es la de no alterarte.$$),
    json_build_object('id', $$o10_3$$, 'desc', $$Inmunidad a la Separación: Comprende que, en lo profundo, nadie entra ni sale de tu campo. El apego físico desaparece porque sabes que la conexión con la gente de tu misma frecuencia trasciende la geografía y el tiempo. La distancia física no disminuye la fuerza de la conexión.$$),
    json_build_object('id', $$o10_4$$, 'desc', $$Irradia desde la Red Madre: Reconoce tu lugar. No eres solo una persona navegando el entorno; eres la semilla de algo nuevo. Cada relación que purificas, cada límite que pones y cada motor que enciendes irradia tu mejor versión hacia el resto del planeta. Tu red cercana es el prototipo de un mundo nuevo.$$)
  )::text ),
  updated_at = now()
WHERE id = 'c7fa0ff7-9503-4719-9bf9-022890796dc7';

-- Verificación (opcional): 60 fases con su array de tareas.
-- SELECT pilar, fase, titulo, jsonb_array_length((tareas_json #>> '{}')::jsonb) AS n_tareas FROM public.libreria_protocolos ORDER BY pilar, fase;
