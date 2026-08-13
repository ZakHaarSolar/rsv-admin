-- Red Solar Viva · AUDITORÍA 2026-06-20 · CANDADO de Calibraciones (POST-BUILD)
-- =====================================================================
-- ⚠️ NO aplicar hasta que el build iOS gateway-only esté VIVO en la App Store
-- (EscanerVibracional v13.61: se quitaron los fallbacks REST directos a estas
-- tablas → el cliente ya lee TODO por el gateway member-gated). Aplicar antes
-- dejaría sin red de seguridad a la build 10 que aún está publicada.
--
-- Aplicar entonces: Supabase Dashboard → SQL Editor → New Query → Run.
--
-- PROBLEMA (auditoría): aunque las RPC member-gated existen y están cerradas,
-- las TABLAS seguían siendo anon-SELECT directo:
--   · libreria_protocolos → los 60 protocolos de Calibración se bajaban con la
--     llave pública = bypass total del paywall de Sintonía 599.
--   · estado_tripulante_protocolos → IDOR + enumeración de clerk_user_ids
--     reales (lista de la base de usuarios) + progreso de cada quien.
--
-- FIX: candar ambas tablas. Todo el acceso legítimo ya pasa por las RPC
-- SECURITY DEFINER (corren como el dueño → BYPASSRLS + usan los grants del
-- dueño) vía el gateway user-action, y service_role (BYPASSRLS). REVOKE de los
-- grants de anon/authenticated = PostgREST deja de servir la tabla directo.

ALTER TABLE public.libreria_protocolos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estado_tripulante_protocolos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.libreria_protocolos          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.estado_tripulante_protocolos FROM PUBLIC, anon, authenticated;

-- (Las RPC DEFINER + service_role siguen accediendo. Verificar con
--  python3 admin/audit_verify.py → ambas deben dar 401/permission denied.)
NOTIFY pgrst, 'reload schema';
