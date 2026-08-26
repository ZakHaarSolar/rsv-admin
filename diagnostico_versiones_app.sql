-- ¿Es solo este nodo, o nadie reporta versión? (Zak 2026-08-25)
SELECT COALESCE(app_version, '(sin reportar)') AS version,
       COUNT(*) AS cuantos
FROM profiles
GROUP BY 1
ORDER BY cuantos DESC;
