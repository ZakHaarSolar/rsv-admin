# Prueba de la lista de Luzy (holaluzy.com, sin tocar producción)

Dos pruebas, las dos en un Postgres real (PGlite 0.2.17, sin Docker):

- `prueba.mjs` corre `20261020_luzy_lista.sql` dos veces y revisa la función `luzy_apuntar`: el correo mal escrito y la
  lista que no existe (no escriben nada), el boletín y el libro con el mismo correo (un solo renglón, en minúsculas, con
  las dos listas), el idioma, el dominio de prueba `@prueba.holaluzy.com` (pasa y no se guarda), el freno por hora, por
  día y el general, la limpieza de lo de hace más de dos días y los permisos (solo `service_role` apunta; la llave
  pública y las sesiones no ven las tablas).
- `prueba-funcion.mjs` corre la función `luzy-lista` de verdad (su `index.ts` en Deno) contra un PostgREST de mentira que
  ejecuta la misma migración en PGlite: CORS (holaluzy.com sí, otra página no), la trampa, la casilla de mayor de edad,
  el cuerpo roto o grande, que la base guarde una huella y no la IP, el freno de 20 por hora por conexión, el inglés, el
  503 sin migración y que los registros de la función no traigan ningún correo. Usa el puerto 8000 (el de Deno.serve).

    mkdir -p /tmp/pg && cd /tmp/pg && npm init -y && npm install @electric-sql/pglite@0.2.17
    cp "<esta carpeta>"/*.mjs /tmp/pg/
    node prueba.mjs "<ruta a migrations>/20261020_luzy_lista.sql"
    node prueba-funcion.mjs "<ruta a migrations>/20261020_luzy_lista.sql" "<ruta a functions>/luzy-lista/index.ts"

Terminan en «TODO BIEN» o en «FALLAS: n». La 0.3 de PGlite se cae con RAISE dentro de plpgsql: usar la 0.2.17.
PGlite tiene una sola conexión: dos envíos «juntos» van en fila; en producción los forma en fila `pg_advisory_xact_lock`.
