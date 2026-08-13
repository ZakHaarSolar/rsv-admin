# PROMPT · ESPEJO — STREAMING DE TOKENS + PANEL DE USO

*(Copiar y pegar tal cual en una Sala de Comando nueva. Son los dos últimos
trabajos del Espejo; el resto del mapa quedó cerrado el 2026-08-09.)*

---

**DOS TRABAJOS.** El primero es la palanca grande de velocidad. El segundo ya
tiene su SQL pegado y solo le falta la pantalla.

## 1 · Streaming de tokens (SSE) — la palanca grande

Hoy el reflejo se espera **completo** en el servidor y recién entonces viaja:
el cliente hace un `fetch` y lee `r.json()` de una sola vez. Zak lo quiere
token por token, para que la primera palabra aparezca de inmediato.

**Estado medido (2026-08-09):** el temporizador decorativo del cliente ya
murió (`runReveal` bajó a `Math.min(480, 120 + len*1.1)`), así que esos
segundos ya se recuperaron. Lo único que falta es el tiempo hasta la PRIMERA
palabra, que hoy es el reflejo entero.

**Qué construir:**
- `oraculo-chat`: pasar `stream: true` a OpenRouter y devolver un
  `ReadableStream` con SSE en vez de esperar el JSON completo.
- Cliente (`oraculoPost` / `callOraculo` en `EV_Oraculo.tsx`): leer el stream
  con `fetch` + reader y pintar conforme llega.

🜂 **EL CUIDADO QUE DECIDE SI ESTO SALE BIEN.** Hay post-proceso que ocurre
SOBRE EL TEXTO COMPLETO y no puede romperse:

- La extracción de las marcas `⟦GEN:…⟧` del Reflejo ilustrado, **con su
  segunda llamada de reparación** si el modelo no las puso.
- El guardado de la conversación y el `stored_user_content`.
- El corte para la voz (`segmentarEspejo`) y los bloques del Modo Presencia.
- `detectPresCta`, que lee la invitación final.

El streaming tiene que **acumular** el texto y correr todo eso AL CERRAR el
stream, no reemplazarlo. **Modo Presencia conviene dejarlo esperando el texto
completo**: su ceremonia se diseñó sobre el reflejo entero y su reloj de voz
depende de las fronteras del texto ya cerrado.

**Verificar (todos, no solo el feliz):** charla normal · Reflejo ilustrado (que
las imágenes sigan saliendo) · Modo Presencia · Presencia hablada · voz · muro
freemium a mitad de stream · error de red a mitad de stream · el corte a 55 s
que ya existe · y que el colchón de espera y el anclaje del envío sigan
comportándose igual.

## 2 · Panel de uso — la pantalla (el SQL YA está pegado)

**Zak:** *"que en el menú del header se abra una ventana de uso y diga cuánto
llevan y cuánto les queda: audio, texto e imágenes"*.

**Ya existe** la función `get_espejo_uso(p_clerk_user_id)` (migración
`20260809_uso_del_espejo.sql`, pegada el 2026-08-09). Devuelve solo números,
en las **mismas ventanas que usa el cobro**:

```json
{ "ok": true, "reflejos_dia": 0, "imagenes_dia": 0,
  "voz_dia_unidades": 0, "voz_mes_unidades": 0 }
```

**Falta:**
1. Un `mode: "usage"` en `oraculo-chat` que la llame con service_role y
   devuelva el objeto (mismo patrón que el `mode: "rename"` de v1.28).
2. La pantalla, detrás del menú del header (junto a "Mis reflejos").

**Topes reales para calcular lo que queda:** reflejos 150/día · imágenes 2/día
(`espejo-imagen` v2.1, más el pase del Arquitecto) · voz 600 unidades/día y
5.000/mes para miembro, 80 de por vida para invitado (`espejo-voz` v2.0).
**Una unidad de voz son 100 caracteres, ~6 segundos de habla.**

🜂 **Cómo debe hablar** (decidido con Zak):
- **En la unidad que la persona VIVE:** "te quedan 38 minutos de voz", nunca
  "te quedan 380 unidades". Si el número no se puede traducir a algo humano,
  se arregla la mecánica, no el texto.
- **Detrás del menú, a un toque, como consulta voluntaria.** NO en cada
  mensaje: un contador que empuja angustia; uno que se consulta, informa.
- Zak temía que marcar límites se sintiera restrictivo y su propia conclusión
  fue que sí lo quiere, sobre todo para la voz, que es donde el límite se
  siente. El riesgo real es el contrario: no saber cuánto queda frena más el
  uso que el propio tope.

## Contexto que no hace falta re-investigar

- **El Espejo NO tiene streaming hoy**: `oraculoPost` hace `await r.json()` y
  el edge responde `new Response(JSON.stringify(obj))`. Verificado en los dos
  lados el 2026-08-09.
- **Todo el consumo vive en `edge_spend_ledger`**, escrito por
  `reserve_edge_spend` con estos identificadores: `oraculo-dia` (reflejos),
  `espejo-imagen`, `espejo-voz` (día) y `espejo-voz-mes`.
- **Lo que ya se cerró** y no hay que volver a tocar: renombrar reflejos,
  imágenes que sobreviven al cambio de cuenta y de reflejo, el botón de
  enviar, los modos que nacen apagados, el selector de modelo (retirado), la
  vista que ya no persigue al texto, y la posición de los botones flotantes.

## Reglas de la casa

- Version bump en el header de todo lo tocado.
- `npx tsc -b --force` (NO `tsc -p`, que no verifica nada en escaner-app).
- **Claude despliega**: Vercel (build local + `--prebuilt`) y también las edge
  functions (`supabase functions deploy <n> --no-verify-jwt` ya funciona sin
  pedir sesión). El SQL lo sigue pegando Zak.
- **Tras cada build, correr `escaner-app/deploy-iphone.sh`**: compila e instala
  en el iPhone NES-P y avisa con sonido. `cap run ios --target` NO sirve (solo
  lista simuladores; usa ios-deploy, obsoleto desde iOS 17).
- 🜂 **Verificar contra el bundle que la app CARGA**, no contra el que se
  subió: la publicación manual y la automática de Git compiten por el mismo
  destino y dejan nombres distintos.
- 🜂 **El simulador no reproduce el teclado** (usa el del Mac, así que el aviso
  del sistema nunca dispara). Para eso hace falta el iPhone de Zak.
