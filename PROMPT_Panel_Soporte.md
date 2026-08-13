# PROMPT · PANEL DE SOPORTE + TRANSFERIR SUSCRIPCIÓN

*(Copiar y pegar tal cual en una Sala de Comando nueva.)*

---

**PANEL DE SOPORTE DEL MOTOR + PUERTA DE CONTACTO.** Todo está decidido; falta
construirlo.

## El problema

El acceso comprado en la **web** se ata al **correo con el que se paga**. Si
alguien paga con un correo distinto al de su cuenta, queda cobrado y sin
acceso. El enlace de Stripe ya va con su correo pre-llenado
(`withCheckoutIdentity`), pero no lo impide. Hoy no hay herramienta para
arreglarlo ni puerta clara para que la persona nos avise.

## Lo que hay que construir

### 1) Puerta de contacto (decidido: dentro de la app, en Ajustes)

Zak confirmó que va **dentro de la aplicación, en Ajustes**. Requisitos:

- **UNA sola puerta**, idéntica en app y en web.
- **Separada visualmente** de "Tu voz construye el Escáner", que es buzón de
  IDEAS: mezclar un problema urgente con una sugerencia hace que el reporte se
  pierda en la pila equivocada.
- Ya existe `escaner.redsolarviva.com/soporte` (está en el pie de la landing)
  pero no se ofrece desde Ajustes. Decidir si esa página se reusa o si el
  contacto vive dentro de la app con su propio formulario.
- Al reportar, que la app mande sola lo que ya sabe (cuenta, plataforma,
  versión) para no hacérselo escribir.

⚠️ **Orden de Ajustes recién cambiado (MN_Firma v2.49)**: Apariencia ·
Nocturno · Idioma · Sonido · Voz · Notificaciones · Ícono · **Membresía** ·
**Tu voz** · Registro · Aviso médico · Espejo · IA · **Claves y Seguridad
(clave + eliminar cuenta, hasta el fondo)**. La puerta de soporte tiene que
encontrar su lugar en ESE orden, no en el viejo.

### 2) Transferir suscripción (panel del Motor)

**Los filtros suficientes — no pedir más.** Cada dato de más es un peaje para
alguien que ya está molesto, y el comprobante en imagen además es PII que
habría que guardar:

1. **Los últimos 4 dígitos de la tarjeta**, o el **ID del recibo** de Stripe.
   Este es el filtro FUERTE: se cruza contra el pago real y nadie de fuera lo
   conoce. Los otros dos solo dicen a dónde mover.
2. **El correo con el que pagó.**
3. **El correo destino**, que ya debe tener cuenta creada.

**La herramienta:** en el Motor, "Transferir suscripción · de X a Y" en un
clic (mover `subscriptions.email`), con registro de quién lo hizo y cuándo, y
aviso al Tripulante de que ya quedó.

🜂 **Diseñarlo GENÉRICO desde el principio.** Este es el primer caso de una
familia: van a venir reembolsos, cuentas duplicadas y cambios de correo. El
panel debe poder crecer con casos nuevos sin rehacerse, y cada caso debe traer
escrita **qué información pedirle a la persona** — así, al abrirlo, se sabe
qué pedir sin pensarlo.

## Reglas de la casa que aplican

- El SQL lo pega Zak en el SQL Editor; las edges las despliega él. El deploy a
  Vercel lo corre Claude.
- Toda acción destructiva o que mueva dinero deja registro de quién y cuándo.
- Un fallo que la persona no puede leer es un viaje perdido (Paso 0-quater).

## Contexto que no hace falta re-investigar

- `subscriptions` se llavea por **email**, no por `clerk_user_id`
  (memoria `feedback_purchases_no_clerk_user_id`).
- El webhook mapea por **producto**, no por precio: `prod_UOf1RrEypuWFTg`
  → `sintonia`, y las dos duraciones (499/mes y 149/semana) son precios de ese
  mismo producto, así que ambas quedan bien clasificadas.
- `get_my_membership` da acceso con cualquier suscripción `active`; el gate de
  acceso pleno solo excluye los grupos `decoder` y `dream`.
