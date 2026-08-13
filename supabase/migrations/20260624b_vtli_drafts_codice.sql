-- 20260624b_vtli_drafts_codice.sql
-- Atelier · Estudio Manual (Zak'Haar Video) — fuente CÓDICE DE LUZ.
-- Permite que un storyboard de video se genere desde un Códice de Luz (libro
-- destilado): la NARRACIÓN (voz en off) del Reel desarrolla UNA enseñanza del
-- libro, fiel a su voz, adaptada al tiempo del Reel y a los keyframes. Guardamos
-- codice_id para la anti-repetición POR LIBRO (no repetir la misma enseñanza
-- entre Reels del mismo códice) y para etiquetar el borrador.
-- Requiere que 20260624_codices_luz.sql ya esté aplicada (tabla codices_luz).
-- Pegar en Supabase Dashboard → SQL Editor → New Query → Run.

ALTER TABLE public.vtli_drafts
    ADD COLUMN IF NOT EXISTS codice_id uuid REFERENCES public.codices_luz(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.vtli_drafts.codice_id IS
    'Si el storyboard nació de un Códice de Luz, su id. null = fuente genérica (semillas de Sexta Densidad). La narración desarrolla una enseñanza del libro; pulso_nucleo = título de la enseñanza (anti-repetición por libro).';

CREATE INDEX IF NOT EXISTS idx_vtli_drafts_codice
    ON public.vtli_drafts(codice_id, generated_at DESC)
    WHERE codice_id IS NOT NULL;
