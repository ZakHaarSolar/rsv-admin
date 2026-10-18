# Prueba de la migración de candados y limpieza (sin tocar producción)

Corre `20261018e_candados_y_limpieza.sql` en un Postgres real (PGlite 0.2.17, sin Docker) sobre las funciones de
producción tal como estaban el 2026-10-18 (`produccion-antes.sql`, sacadas con `pg_get_functiondef` por la API de
gestión, solo lectura). Primero mide lo que hacía producción (lo que quedaba al borrar una cuenta, 100 instalaciones
inventadas, 200 eventos del muro sin sesión, la llave pública leyendo el gasto por persona); luego pega la migración
dos veces y revisa cada candado, cada freno, la limpieza diaria (y que correrla otra vez no mueva nada), el borrado de
cuenta contra una persona vecina que no se toca, y la fila única por factura (también el caso de facturas ya
repetidas: avisa y no crea el índice).

    mkdir -p /tmp/pg && cd /tmp/pg && npm init -y && npm install @electric-sql/pglite@0.2.17
    cp "<esta carpeta>"/*.mjs "<esta carpeta>"/*.sql /tmp/pg/
    node prueba.mjs "<ruta a migrations>/20261018e_candados_y_limpieza.sql"

`prueba-freno.mjs` hace lo mismo con `20261018f_freno_web_huella.sql` (la bóveda guarda la huella sha256 del secreto del
freno web): `node prueba-freno.mjs "<ruta a migrations>/20261018f_freno_web_huella.sql"`, con `registrar_intento_web-antes.sql`
al lado.

Termina en «TODO BIEN» o en «FALLAS: n». La 0.3 de PGlite se cae con RAISE dentro de plpgsql: usar la 0.2.17.
