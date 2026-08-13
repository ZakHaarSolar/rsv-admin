# PROMPT · DEFENSA DE REGISTROS AUTOMÁTICOS EN LA WEB

*(Copiar y pegar tal cual en una Sala de Comando nueva.)*

---

**DEFENSA DE REGISTROS AUTOMÁTICOS EN LA WEB DEL ESCÁNER.** Dedicá la sala
completa a esto.

**El agujero, ya diagnosticado (2026-08-06, no hace falta re-investigarlo).**
En `app.escanervibracional.com` clerk-js corre en modo nativo y todo su tráfico
de identificación pasa por nuestro proxy same-origin `api/fapi.ts` en Vercel
(existe por una razón real: sin él la sesión muere en segundos, ver el
comentario largo de ese archivo). Consecuencia medida en vivo: la función corre
en la región `iad1` (verificado con `x-vercel-id: sfo1::iad1::…`), así que
**Clerk ve la IP de nuestro servidor en Ashburn, Virginia, y no la de la
persona**. El proxy reenvía `x-forwarded-for`, pero un servicio no puede
confiar en ese header viniendo de un llamador cualquiera —sería un hueco de
suplantación de IP— así que Clerk usa la IP de la conexión.

**Qué se rompe con eso.** Las heurísticas de Clerk contra registros
automáticos quedan ciegas para toda la web: no puede distinguir mil intentos
de una persona de mil personas distintas, porque todos llegan de la misma
dirección. La app nativa NO tiene este problema (va directo a la FAPI). Hoy no
duele porque casi no hay tráfico; en cuanto se abra la difusión, sí.

**Lo que hay que resolver, en orden de valor:**

1. **Recuperar la señal de origen.** Investigar si Clerk permite declarar un
   proxy de confianza (buscar en su documentación "trusted proxy",
   "X-Forwarded-For", "proxy configuration", y si su FAPI acepta un
   `Clerk-Proxy-Url` / secreto de proxy que le permita creer el XFF). Si
   existe, cablearlo: es la cura de raíz y devuelve las defensas propias de
   Clerk.
2. **Si no existe**, defender del lado nuestro. El proxy es el punto de
   estrangulamiento perfecto porque TODO pasa por ahí y sí ve la IP real en
   `x-forwarded-for`:
   - límite por IP real sobre las rutas de creación de cuenta
     (`v1/client/sign_ups`, `v1/client/sign_ins`), con ventana corta y una
     ventana larga;
   - registro de intentos por IP para poder ver un patrón después;
   - respuesta honesta al cliente cuando se frena (nunca un error mudo — regla
     Paso 0-quater del CLAUDE.md).
   Ojo con el estado: las funciones de Vercel son sin memoria entre
   invocaciones. Evaluar Vercel Edge Config, Upstash Redis, o una tabla en
   Supabase con una RPC `SECURITY DEFINER` (la más barata de montar con lo que
   ya existe).
3. **Encender lo que Clerk ya trae**, si aplica: verificación de correo
   obligatoria antes de dar acceso, protección de bots / attack mode en su
   panel, y revisar si conviene bloquear dominios de correo desechables.
4. **Considerar el Firewall de Vercel** (`vercel firewall`): reglas de
   limitación de tasa sobre `/api/fapi/*` a nivel plataforma, que corren antes
   de que la función se ejecute y por lo tanto son más baratas.

**Reglas de la casa que aplican con fuerza acá:**

- **NO romper el login.** El proxy existe por una razón medida; cualquier
  cambio se verifica en vivo en los DOS dominios antes de darlo por bueno
  (`app.escanervibracional.com` y `escaner.redsolarviva.com`, este último es
  el backend de identificación de las apps PUBLICADAS — ver
  `escaner-app/NOTAS_vercel.md`).
- Un freno que se dispara con una persona real y no le dice por qué es peor
  que no tener freno.
- El despliegue a Vercel lo corre Claude, no Zak
  (`vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`),
  y cierra verificando que la página renderiza y la consola está limpia.

**Contexto de los tres registros que dispararon esto:** `geshuankhatron@gmail.com`,
`calmecacyaollopa@gmail.com`, `ggaribay2008@gmail.com`, creados el 5 y 6 de
agosto de 2026, los tres desde Windows/Chrome, los tres "Navegador". Sus IPs de
Ashburn son NUESTRAS, no de ellos; ese ya no es un indicio. La cuenta
`ggaribay2008` además tiene una sesión desde Tlalnepantla, México, que sí es
real. Con la ficha del nodo nueva (Motor → Nodos Activos) se puede ver por qué
puerta entró cada uno y qué contestó en el onboarding: eso sí es señal.
