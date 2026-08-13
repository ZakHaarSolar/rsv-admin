# PROMPT · MOTOR DE INTERVENCIÓN — MEMORIA EN TODAS LAS PESTAÑAS + REFRESCO POR TARJETA

*(Copiar y pegar tal cual en una Sala de Comando nueva. Todo es del Motor, así
que conviene hacerlo dedicado.)*

---

**MENOS LLAMADAS A LA BASE, MÁS CONTROL FINO.** Dos trabajos hermanos: que
cada pestaña se cargue una sola vez por visita, y que dentro de la ficha de un
nodo cada tarjeta se pueda refrescar sola.

## Contexto: lo que ya existe

`MI_Shared.tsx` v1.9 trae la máquina:

- `adminActionCached(url, key, action, params, { force })` — guarda el
  resultado mientras la página esté abierta; con `force: true` va al servidor.
  Los fallos NO se guardan (un tropiezo de red no puede quedarse pegado como
  estado real).
- `motorCacheClear(prefix?)` — olvida una familia tras escribir.

Ya usan la memoria: Navegación, Onboarding, Correos, Rachas, Espejo, Buzón y
Soporte. Nodos Activos y Sondas/Calibraciones ya cargaban una vez por su
cuenta.

## Trabajo 1 · Terminar la memoria en las pestañas que faltan

Faltan los **editores**: Rituales, Wallpapers, Avatares, Cristalización,
Comunidad, Mensajes, Medallas, Moderación, Stickers, Crop Circles y App.

🜂 **No se hacen en bloque a propósito.** Todos ESCRIBEN, y una memoria mal
puesta significa que Zak guarda algo y no lo ve reflejado, que es peor que una
consulta de más. Por cada editor, uno por uno:

1. Cambiar su lectura a `adminActionCached(..., { force })`.
2. Que su función `load` acepte `force = false` y que el botón "Recargar"
   llame `load(true)`.
3. **Buscar TODOS sus puntos de guardado/borrado** y, después de cada uno,
   llamar `motorCacheClear("<nombre_de_la_rpc_de_lectura>")` antes de recargar
   con `force`.
4. Verificar el ciclo completo: entrar, editar, guardar, ver el cambio; salir a
   otra pestaña, volver, y que siga viéndose el cambio sin recargar.

Si algún editor no tiene botón "Recargar", agregárselo: la regla que pidió Zak
es que TODA pestaña tenga su refresco, y que recargar la página entera limpie
todo.

⚠️ `MI_Editores.tsx` pesa más de 300 KB → **no lo sube el watcher, se pega a
mano en Framer**. Conviene agrupar todos sus cambios y pegarlo una sola vez.

## Trabajo 2 · Refrescar tarjeta por tarjeta en la ficha del nodo

En **Nodos Activos**, al abrir un nodo se pinta su ficha (`MI_Detail.tsx`) y
hoy solo hay un botón que refresca TODO. Zak quiere que **cada tarjeta se
actualice sola al tocarla**: si solo le interesa saber si el regalo ya se
aceptó, que pida ese dato y nada más.

**Condición que Zak puso, y hay que verificarla antes de construir:** hacerlo
solo si de verdad son MENOS llamadas que el refresco completo. Es decir, cada
tarjeta debe colgar de UNA consulta propia. Si alguna tarjeta se alimenta de
la misma consulta que otras tres, refrescarla individualmente no ahorra nada y
esa tarjeta se deja como está (y se dice en el reporte).

Tarjetas a cubrir (verificar de cuál RPC vive cada una):
Acción admin / estado del regalo (`admin_get_gift_status`) · Decodificador de
Materia · Sondas (`admin_get_user_sonda_progress`) · pilares · Rachas
(`admin_get_user_rachas`) · Cristales (`admin_get_user_cristales`) · Códices
(`admin_get_user_codices_full`) · Ritual (`admin_get_user_ritual_data`) ·
Navegante · plataformas (`get_tripulante_platforms`) · Espejo/onboarding
(`get_tripulante_espejo_onb`) · foto (`get_tripulante_foto`).

**Cómo debe sentirse:** un gesto discreto en la tarjeta (un ícono de refresco
que aparece al pasar el cursor, o la tarjeta entera clickeable), con su propio
estado de "cargando" LOCAL — el resto de la ficha no se mueve ni parpadea. Al
terminar, la tarjeta se actualiza sola.

**Precedente ya sentado (2026-08-07):** regalar, cancelar o revocar Sintonía
ya NO recargan el Padrón entero; `refreshGiftStatus()` actualiza solo lo suyo.
La regla es esa: **una escritura refresca lo que TOCÓ, no todo lo que hay en
pantalla.** Este trabajo la extiende a las lecturas.

## Reglas de la casa que aplican

- Version bump en el header de cada `.tsx` tocado.
- `MI_Editores.tsx` y cualquier archivo >300 KB se pegan a mano; el resto lo
  sube el watcher solo. Leer `admin/.last-sync-status.json` antes de reportar.
- Property controls solo en `Domo.tsx`.
- El chequeo de tipos del Motor: no hay tsconfig local en `Code/`; se puede
  usar uno temporal apuntando a `escaner-app/node_modules` para react y
  framer-motion. Los únicos errores preexistentes esperables son
  `BadgeBoundary` y el módulo `framer` de `NavegadorEstacion`.
