# Google for Startups Cloud Program · solicitud de Red Solar Viva (2026-10-07)

- Solicitud: https://cloud.google.com/startup/apply (pide sesión de Google).
- Nivel al que aplicamos: **Start**, hasta 2,000 USD en créditos de Google Cloud, Firebase y Gemini. Es el nivel para
  startups sin inversión institucional (fundadas hace menos de 5 años, sin créditos previos de Google Cloud más allá de
  la prueba gratis). Scale (hasta 200,000 o 350,000 USD para IA) exige capital de riesgo: no aplica hoy.
- Correo de negocio: zakhaar@redsolarviva.com, con una cuenta de Google creada sobre ese correo (no Gmail).
- Nano Banana se consume por **Vertex AI**, no por AI Studio: los créditos de Cloud pagan Vertex; las llaves de AI Studio
  pueden cobrar a la tarjeta.
- Probablemente pida el ID de la cuenta de facturación de Cloud (formato XXXXXX-XXXXXX-XXXXXX): crearla antes desde la
  cuenta de negocio en console.cloud.google.com/billing.
- Datos medidos el 2026-10-07 (los mismos de Claude for Startups): ~58 cuentas, ~1,000 mensajes del Espejo, ~250 escaneos
  del Decodificador, ~1,100 registros diarios, en tiendas desde junio de 2026.

## Paso 1 · contacto

| Campo | Valor |
|---|---|
| First name | Diego |
| Last name | Soto |
| Business email | zakhaar@redsolarviva.com |
| Business phone | el celular de Zak con +52 |
| Company name | Red Solar Viva |
| Industry | Technology (o Software & Internet). Nunca Healthcare. |
| Job role | Founder / Executive (C-level) |
| Job title | Founder & CEO |
| Country | Mexico |
| AI or Web3 | **AI startups** |

## Paso 2 · facturación, inversión y sede (llenado el 2026-10-07)

| Campo | Valor |
|---|---|
| Startup legal name | Red Solar Viva (o la razón social exacta si hay sociedad constituida) |
| Startup website domain | redsolarviva.com |
| Google Cloud Billing Account ID | 01A6FF-E87869-821613 («My Billing Account») |
| Investment level | Bootstrapped or supported by grants, crowdfunding, friends & family, or business angels |
| Founded | 1-2 years (junio de 2025) |
| HQ | Cancún, Quintana Roo, México (calle y código postal de Zak) |

El administrador de esa cuenta de facturación tiene que ser zakhaar@redsolarviva.com. Si se creó con Gmail, se agrega
en Facturación → Administración de cuentas → Agregar principal → Administrador de la cuenta de facturación.

## Pasos siguientes (si los pide)

| Campo | Valor |
|---|---|
| Website | https://redsolarviva.com (mismo dominio que el correo) |
| Product link | https://escanervibracional.com |
| Year founded | 2025 (junio) |
| Employees | 2 (1-10) |
| Funding | Bootstrapped / Not funded / Pre-seed. US$0 raised, no institutional investors |
| Accelerator | None |
| Previous Google Cloud credits | No (salvo que Zak recuerde una prueba de 300 USD: esa sí se permite) |
| Google Cloud products of interest | Vertex AI (Gemini, Gemini image models), Cloud Vision, Cloud Run, Cloud Storage |

## Textos en inglés

**One-liner**
Red Solar Viva is a bootstrapped AI startup from Cancún, Mexico, building Escáner Vibracional, a bilingual Spanish and English wellbeing app live on iOS, Android, macOS and web, plus a studio of AI-assisted games and short films.

**Company description**
Red Solar Viva builds Escáner Vibracional (escanervibracional.com), a mobile-first self-tracking app for Spanish speakers with a bilingual interface. Users check in across six life domains; the app turns them into a 0-100 Light Index and routes every weak domain to a concrete daily protocol. AI is the core of the product: a Food Decoder that reads a photographed nutrition label and explains its ingredients and additives, a Dream Decoder, and Espejo, a voice companion with long-term memory. Live on the App Store, Google Play, macOS and web since June 2026, with a paid subscription. The same small team runs Ludus Cero (browser games) and Fotón Cero (music films), all built in-house.

**How do you use / plan to use Google Cloud**
We already run Google in production: our Food Decoder uses Gemini Flash with Cloud Vision OCR to read nutrition labels. The credits would let us bring Google's image models (Nano Banana) into the product and the studio through Vertex AI: (1) personalized visuals generated from each user's scan result, in Spanish and English; (2) localized App Store and Google Play screenshots and ad creatives, editing one master image per language; (3) concept art, key art and store capsules for our games; (4) covers for our ebook and audiobook catalog. Every generation runs behind our existing per-user and global spend caps.

**How will you use the credits**
Months 1 and 2: an evaluation set comparing Gemini image models on our real prompts (brand style, text rendering in Spanish, consistency of characters across images), and moving our current Gemini and Vision calls from API keys to Vertex AI under one billing account. Months 3 to 12: production image generation in the app, store and ad localization for our English launch, and game art. At roughly 4 to 24 US cents per image depending on model and resolution, the credits cover the evaluation plus months of real usage at our current scale while we grow toward paid traction.

**Anything else**
Founder-engineer team of two in Cancún, Mexico, bootstrapped, building for Spanish speakers first. The whole stack (React and TypeScript, Capacitor, Tauri, Supabase with 59 serverless functions) shipped in-house, and the app went from first line of code to the App Store in about two months.

## Estado

- **Enviada el 2026-10-08** desde zakhaar@redsolarviva.com (nivel Start, AI startup, bootstrapped). Google responde en 3 a
  5 días hábiles por correo a esa dirección (Proton). Si se aprueba, los créditos caen directo en la cuenta de facturación
  01A6FF-E87869-821613 y desde ese día corre su vigencia.
- Al aprobarse: usar Nano Banana por Vertex AI (no por llaves de AI Studio) desde el proyecto vinculado a esa cuenta.
- **Rechazada el 2026-10-09 por «sitio inaccesible o inactivo».** Causa medida: redsolarviva.com entregaba un HTML vacío
  (solo el título «Red Solar Viva»; todo lo pinta el paquete de 3 MB) y en un navegador la portada pasaba 3 a 5 s en
  negro, o para siempre si la pestaña está oculta (el héroe espera cuadros de animación). Un lector sin código la
  describía como «página cascarón». **Arreglo publicado el mismo día** (rsv-web c9ab219, `index.html` v1.1): fachada
  visible desde el primer byte con quiénes somos y los productos (con enlaces a App Store, Google Play, Ludus Cero y Fotón
  Cero), descripción, datos de la organización, `robots.txt` y `sitemap.xml`; se funde en el sistema solar cuando el
  título ya se ve. El mismo lector ahora la describe como «sitio activo con información de productos».
- **Siguiente paso de Zak:** volver a aplicar con el enlace especial del correo de rechazo, desde zakhaar@redsolarviva.com,
  con los mismos datos (dominio redsolarviva.com, facturación 01A6FF-E87869-821613).
