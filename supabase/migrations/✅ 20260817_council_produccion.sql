-- 🜂 COUNCIL · LA PRODUCCIÓN DE FOTÓN CERO (2026-08-17 · II)
-- Zak: "pon esas relaciones en la base de datos".
--
-- La producción de la casa (el sello, las series con su biblia, los
-- personajes, los episodios, los álbumes y las canciones) viaja al servidor
-- por el MISMO camino que los demás registros del Arquitecto: cada cosa es
-- un DOCUMENTO de council_registros con su tipo y su clave (el id de la
-- cosa), el cuerpo entero como JSON en `contenido`, y borrarla es guardar el
-- documento vacío. Así hereda la escritura condicional por fecha, la fusión
-- entrada por entrada y las lápidas, sin una tabla nueva ni una RPC nueva.
--
-- Lo único que hace falta en la base es que la restricción de tipos acepte
-- los seis tipos nuevos. Pegar en Supabase → SQL Editor → New Query → Run.

ALTER TABLE public.council_registros DROP CONSTRAINT IF EXISTS council_registros_tipo_chk;
ALTER TABLE public.council_registros
    ADD CONSTRAINT council_registros_tipo_chk
    CHECK (tipo IN ('cofre', 'ley', 'bitacora', 'posicion', 'sello', 'serie', 'personaje', 'episodio', 'album', 'cancion'));

-- Índice por tipo, para leer el catálogo de una casa sin recorrer los cofres
CREATE INDEX IF NOT EXISTS council_registros_tipo_idx
    ON public.council_registros (clerk_user_id, tipo);

COMMENT ON CONSTRAINT council_registros_tipo_chk ON public.council_registros IS
    'cofre/ley/bitacora/posicion: registros de Zak Cero · sello/serie/personaje/episodio/album/cancion: la producción de Fotón Cero (JSON en contenido; vacío = borrado)';
