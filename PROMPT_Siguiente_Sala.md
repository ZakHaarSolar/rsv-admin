# PROMPT · Sala siguiente (copiar y pegar tal cual)

---

Antes de nada: pesá el archivo maestro (`wc -c CLAUDE.md`) y, si pasa de
150.000, presentame la lista NUMERADA de `## Pendientes vivos` en lenguaje
humano para que yo conteste con números qué ya está hecho. Barremos primero.

Después seguimos con esto:

## 1. Terminar el corte de dominio a Vercel

`redsolarviva.com` está a mitad de camino. Lo que ya está hecho: el sitio nuevo
vive en `rsv-web` (Vite, compila `../Code` directo), su PRODUCCIÓN está
verificada, y el dominio ya está atado al proyecto. Lo que falta es DNS, en
GoDaddy:

- **Raíz (`@`, tipo A):** tiene que quedar **UNA sola** con `76.76.21.21`.
  Si quedan también las de Framer (`31.43.160.6` / `31.43.161.6`), el tráfico se
  reparte entre los dos sitios y Vercel NO emite el certificado: la mitad de las
  visitas reciben conexión fallida.
- **`www`:** un CNAME no puede apuntar a una IP. Editar el CNAME existente
  (hoy `sites.framer.app`) y ponerle **`cname.vercel-dns.com`**. La otra opción
  es borrarlo y crear un registro A `www → 76.76.21.21`.
- **NO tocar** `clerk.`, `escaner.`, `app.` ni `domo.`: son subdominios aparte.

Cuando propague, verificá EN VIVO (renderizando, no leyendo el HTML: Domo pinta
del lado del cliente):
- La portada muestra "TEMPLO SOLAR 5D", Zak'Haar y Aqua'Riia.
- `/motor-intervencion` deja entrar con la cuenta (en el dominio de prueba de
  Vercel NO puede: Clerk solo autoriza `redsolarviva.com`).
- `/membrana`, `/upgrades` y `/lenguajedegaia` abren.

Con eso adentro, Framer se cancela (dejarlo pagado un mes como red).

## 2. Compilar iOS y Android con la mudanza del ingreso

El código YA está cambiado (2026-08-11 · II): el ida y vuelta de Apple/Google
pasa de `escaner.redsolarviva.com` a `app.escanervibracional.com`. Tocó
`src/lib/oauthNative.ts`, `api/_lib/env.ts`, el entitlement de iOS y el
intent-filter de Android; en los dos últimos el dominio viejo quedó conservado
al lado para que las builds anteriores sigan funcionando.

Falta: compilar, subir a las dos tiendas, y **cuando todos hayan actualizado**,
recién ahí quitar `escaner.redsolarviva.com` de los satélites de Clerk.
Comprobar en device que el ingreso con Apple y con Google funciona ANTES de
tocar Clerk.

## 3. Los otros dos satélites de Clerk (investigación, con cuidado)

`app.redsolarviva.com` y `app.escanervibracional.com` corren en MODO NATIVO
(`standardBrowser: false`) hablándole directo a la FAPI primaria por
`allowed_origins`, no por el mecanismo de satélite. La hipótesis es que podrían
NO necesitar estar registrados como satélite, y ahí hay ahorro real.

⚠️ Riesgo: re-agregar un satélite exige verificación de DNS otra vez, así que un
experimento fallido no se deshace en un clic. Probar de a uno, con la app
abierta al lado para confirmar el ingreso en el acto.

## 4. Fleco

Quedó sin subir a Framer `MotorDeIntervencion.tsx` (>300 KB, pide copy/paste
manual). Si el dominio ya se movió a Vercel, ese archivo deja de necesitar
Framer y el fleco muere solo.
