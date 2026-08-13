# PROMPT · PANEL DE IAs — CRITERIO DE ELECCIÓN + LAS DOS QUE FALTAN

*(Copiar y pegar tal cual en una Sala de Comando nueva.)*

---

**COMPLETAR EL PANEL DE IAs DEL MOTOR** (`MotorDeIntervencion.tsx`, pestaña
"IAs", componente `IaGroup` / `IaCard` / los arreglos `IA_APP`, `IA_SESIONES`,
`IA_FREQ`, `IA_ATELIER`).

## Lo que hoy SÍ tiene el panel

Cada tarjeta (`IaCard`) ya muestra: qué función es, dónde vive (`where`),
proveedor, modelo exacto, un `cascade` opcional (la cadena de respaldo si el
primero falla) y el costo. Eso está bien y no se toca.

## Lo que falta (verificado, NO implementado)

**1. El CRITERIO de elección no existe como campo.** El tipo `IaUse` no tiene
ningún campo para "por qué este modelo y no otro" — ni velocidad, ni precio,
ni calidad. Hoy esa razón vive dispersa en comentarios de código y en la
memoria de sesiones pasadas, pero el Tripulante-Arquitecto que abre el panel
no la ve. Agregar un campo `criterio?: string` a `IaUse` y pintarlo en
`IaCard` (una línea chica, sutil, bajo el costo) con el motivo real de cada
elección — no inventar uno genérico por fila; usar el que de verdad aplicó.

   Ejemplos de criterios REALES ya tomados, para no adivinar:
   - **Espejo Vibracional (texto):** `provider: { sort: "throughput" }` en
     OpenRouter — se pide el proveedor MÁS RÁPIDO que sirva ese modelo, no el
     más barato. Razonamiento (`reasoning`) APAGADO a propósito: V4 es
     híbrido y pensar de más costaría segundos y movería la voz del Espejo.
   - **Navegación por voz:** Groq primero si hay `GROQ_API_KEY` ("lo más
     rápido que hay para un modelo así"); si no, OpenRouter con el mismo
     `sort: throughput`. Elegido 100% por velocidad — una frase de 6 palabras
     no necesita un modelo grande.
   - **Decodificador de Alimentos / Sueños:** Gemini Flash por costo (barato
     y rápido a la vez), con cascada de respaldo si el primero cae.
   - **Imágenes del Espejo (Reflejo ilustrado):** FLUX.2 Pro pese a costar
     10× más que Schnell — decisión de CALIDAD (Zak lo probó y Schnell se
     veía "caricatura wannabe realista"); el Modo Ráfaga sí usa Schnell
     porque ahí se piden 2-3 imágenes por envío y la calidad importa menos
     que el volumen.

**2. Dos inteligencias completas no están en el panel.** Confirmado por
grep, cero apariciones:

   - **El Espejo genera imágenes** (Reflejo ilustrado). Vive en la edge
     `espejo-imagen`. Modelo `fal-ai/flux-2-pro` ($0.03/imagen), tope
     comercial 2/día + el Pase del Arquitecto que ya tiene su propia tarjeta
     en el panel (`PaseImagenPanel`) sin que la IA madre esté listada arriba.
     El Modo Ráfaga usa un modelo distinto, `fal-ai/flux/schnell` (~$0.003),
     con su propio cupo de 30/día — son DOS filas, no una.
   - **Navegación por voz.** Vive en la edge `voz-intent`. Groq
     `llama-3.1-8b-instant` para navegar / `llama-3.3-70b-versatile` para
     acciones, con OpenRouter (`meta-llama/llama-3.1-8b-instruct` /
     `meta-llama/llama-3.3-70b-instruct`) como respaldo si no hay
     `GROQ_API_KEY`. Ninguna fila existe hoy para esto.

   Agregar ambas a `IA_APP` (son cosas que el Tripulante toca), con su
   `criterio` de arriba y su `cascade` real.

## Reglas de la casa que aplican

- Es un panel de **solo lectura** (datos hardcoded, tabla de referencia, no
  configuración) — no hay RPC que tocar, es puro cambio de `Code/MotorDeIntervencion.tsx`.
- Version bump en el header del archivo.
- `MotorDeIntervencion.tsx` ronda el umbral de 300KB: verificar tamaño antes
  de terminar; si pasa, avisar con el emoji 🔄 para copy/paste manual.
- Antes de escribir cada `criterio`, verificar el valor real en el código del
  edge correspondiente (`grep` el `provider`, `sort`, `reasoning`, variables
  `MODELO_*`) — no reescribir de memoria lo que dice este prompt sin
  confirmarlo, por si algo cambió entre esta sala y la que ejecute.
