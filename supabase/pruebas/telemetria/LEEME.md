# Prueba de la migración de telemetría (sin tocar producción)

Corre la migración `20261018d_telemetria.sql` en un Postgres real (PGlite 0.2.17, sin Docker) con 12 cuentas
sintéticas y revisa: la reconstrucción de la historia, el primer valor, un lote sin cuenta que se une a la cuenta, los
duplicados, la basura (fechas, claves y números fuera de rango), el mantenimiento, la retención, la lectura del Motor y
que correrla dos veces no duplique nada. Escribe también los JSON de ejemplo para el panel.

    mkdir -p /tmp/pg && cd /tmp/pg && npm init -y && npm install @electric-sql/pglite@0.2.17
    cp "<esta carpeta>"/*.mjs "<esta carpeta>"/*.sql /tmp/pg/
    node prueba.mjs "<ruta a migrations>/20261018d_telemetria.sql" /tmp/pg

`tablas-de-prueba.sql` son solo las columnas de las tablas que lee la migración (sin datos). La 0.3 de PGlite se cae con
RAISE dentro de plpgsql: usar la 0.2.17.
