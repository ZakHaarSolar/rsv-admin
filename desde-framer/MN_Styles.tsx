// Red Solar Viva — MN_Styles.tsx v1.3.2
// v1.3.2 — Re-trigger del watcher (2do intento) tras
// waitForComponentLoader timeout. Sin cambios funcionales.
// v1.3 — Sidebar items pasan de gris (rgba 55%) a blanco casi puro
// (rgba 92%) para mejorar contraste con el fondo oscuro del Mi
// Núcleo desktop. Hover llega a #FFF puro. Active conserva el cyan
// como indicador del item seleccionado. Pedido directo de Zak —
// los textos antes se leían apagados sobre el gradient de fondo.
// La regla atenuada del foco de teclado (`[data-focused="false"]`)
// también sube su color base para mantener legibilidad cuando el
// sidebar pierde el foco.
// v1.2 — Nuevas reglas para indicar visualmente la columna del Mi
// Núcleo desktop con foco de teclado. Los wrappers de columna llevan
// `data-focused="true|false"`; cuando es "false" atenuamos el item
// activo del sidebar (background tenue, color blanco apagado, sin
// glow ni text-shadow) — Zak ve claramente cuál columna controla con
// las flechas. La regla simétrica para sub-items se aplica por
// styles inline en el componente (renderSubItem recibe `isFocused`).
// v1.1 — `.nuc-sidebar-item` centrado horizontalmente (justify-content
// center + text-align center). Pedido de Zak para que los textos del
// menú izquierdo de Mi Núcleo desktop queden alineados con el botón
// Desanclar (que pasa a centrarse en el wrap del aside). El layout
// pasa de "icono pegado a la izquierda + texto al lado" a "icono y
// texto agrupados al centro de la pill". También quitamos la
// scrollbar visible del wrapper de la columna principal del cascada
// (clase utilitaria `.nuc-no-scrollbar`) — la sección Cámara Solar la
// usa para esconder el thumb sin perder scrolleo natural.
// CSS string + hook useInjectCss del Mi Núcleo. Parte del split de
// MiNucleo.tsx — agrupa todo el bloque CSS para que el shell quede limpio.
//
// Cumple regla 🜂: default export es Object.assign sobre componente
// fantasma + propiedades { CSS, useInjectCss }. Las utilities se consumen
// vía destructuring:
//   import MNStyles from "./MN_Styles.tsx"
//   const { useInjectCss } = MNStyles
import * as React from "react"
import { useLayoutEffect } from "react"

const CSS = String.raw`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap');

.nuc-root { scrollbar-width: none; -ms-overflow-style: none; overflow-y: auto; }
.nuc-root::-webkit-scrollbar { display: none; }
/* v2.1 — Limitar el scroll del Lente cuando el contenido cabe en
   el viewport. Sin esto, el browser permite "rebote" elástico hacia
   abajo en iOS aunque no haya contenido — el tripulante percibe
   espacio vacío scrolleable. overscroll-behavior: contain detiene
   el rebote y mantiene el scroll natural cuando sí hay contenido. */
.nuc-root { overscroll-behavior-y: contain; }
html:has(.nuc-root), html:has(.nuc-root) body { scrollbar-width: none; -ms-overflow-style: none; }
html:has(.nuc-root)::-webkit-scrollbar, html:has(.nuc-root) body::-webkit-scrollbar { display: none; }

.nucleo-stars-container {
    position: absolute; inset: 0; width: 100%; height: 100%;
    z-index: 0; pointer-events: none; overflow: hidden; perspective: 400px;
    background: radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%);
    transform: translateZ(0); contain: layout style paint;
}
.nucleo-star {
    position: absolute; left: 50%; top: 50%; width: var(--sz); height: var(--sz);
    border-radius: 50%; background: #FFF; box-shadow: 0 0 4px 1px rgba(255,255,255,0.6);
    animation: nuc-fly var(--du) linear infinite; animation-delay: var(--dl); opacity: 0;
    will-change: transform, opacity; transform: translateZ(0); backface-visibility: hidden;
}
@keyframes nuc-fly { 0% { transform: translate3d(var(--tx), var(--ty), -1000px); opacity: 0; } 10% { opacity: 1; } 100% { transform: translate3d(var(--tx), var(--ty), 200px); opacity: 0; } }

.nuc-glass {
    background: linear-gradient(165deg, rgba(5,15,30,0.65) 0%, rgba(2,8,20,0.80) 100%);
    backdrop-filter: blur(20px) saturate(1.4); -webkit-backdrop-filter: blur(20px) saturate(1.4);
    border: 1px solid rgba(0,194,255,0.15); border-radius: 20px;
    transition: border-color 0.4s ease, box-shadow 0.4s ease;
}
.nuc-glass:hover { border-color: rgba(0,194,255,0.35); box-shadow: 0 0 30px rgba(0,194,255,0.08), inset 0 0 30px rgba(0,194,255,0.03); }

.nuc-pill { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; background: rgba(0,194,255,0.06); border: 1px solid rgba(0,194,255,0.2); color: #00C2FF; font-size: 12px; font-weight: 500; letter-spacing: 0.04em; cursor: pointer; transition: all 0.25s ease; text-decoration: none; font-family: 'Inter', sans-serif; }
.nuc-pill:hover { background: rgba(0,194,255,0.14); border-color: rgba(0,194,255,0.5); box-shadow: 0 0 12px rgba(0,194,255,0.12); }

.nuc-badge-on { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 20px; background: rgba(0,194,255,0.1); border: 1px solid rgba(0,194,255,0.3); color: #00C2FF; font-size: 11px; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase; }
.nuc-badge-on::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #00C2FF; box-shadow: 0 0 8px #00C2FF; animation: nuc-pulse 2s ease-in-out infinite; }
@keyframes nuc-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
.nuc-badge-off { display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 20px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.28); color: #FFFFFF; font-size: 11px; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase; }

.nuc-tabs { display: flex; gap: 6px; padding: 6px; background: linear-gradient(180deg, rgba(0,20,40,0.4) 0%, rgba(0,10,25,0.6) 100%); border: 1px solid rgba(0,194,255,0.12); border-radius: 18px; width: fit-content; box-shadow: 0 0 20px rgba(0,194,255,0.04), inset 0 1px 0 rgba(255,255,255,0.03); }
.nuc-tab { padding: 12px 28px; border-radius: 12px; border: 1px solid transparent; background: transparent; color: rgba(255,255,255,0.4); font-family: 'Inter', sans-serif; font-weight: 500; font-size: 14px; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; transition: color 0.35s ease, background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease, text-shadow 0.35s ease; white-space: nowrap; position: relative; outline: none; -webkit-tap-highlight-color: transparent; }
@media (hover: hover) and (pointer: fine) { .nuc-tab:hover { color: rgba(255,255,255,0.65); background: rgba(0,194,255,0.04); border-color: rgba(0,194,255,0.08); } }
.nuc-tab-on { background: linear-gradient(165deg, rgba(0,194,255,0.08) 0%, rgba(0,100,180,0.12) 100%); color: #00C2FF; border-color: rgba(0,194,255,0.3); box-shadow: 0 0 20px rgba(0,194,255,0.1), 0 0 40px rgba(0,194,255,0.04), inset 0 0 12px rgba(0,194,255,0.06); text-shadow: 0 0 8px rgba(0,194,255,0.4); }

.nuc-play { width: 56px; height: 56px; border-radius: 50%; background: rgba(0,194,255,0.2); border: 2px solid rgba(0,194,255,0.6); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); transition: all 0.3s ease; position: relative; z-index: 2; }
.nuc-thumb:hover .nuc-play { background: rgba(0,194,255,0.35); box-shadow: 0 0 30px rgba(0,194,255,0.3); transform: scale(1.08); }

.nuc-avatar-ring { position: relative; width: 140px; height: 140px; border-radius: 50%; padding: 3px; cursor: pointer; transition: box-shadow 0.4s ease; background: conic-gradient(from 0deg, rgba(0,194,255,0.6), rgba(0,194,255,0.1), rgba(200,164,78,0.6), rgba(0,194,255,0.1), rgba(0,194,255,0.6)); animation: nuc-spin 8s linear infinite; }
.nuc-avatar-ring:hover { box-shadow: 0 0 40px rgba(0,194,255,0.2), 0 0 80px rgba(0,194,255,0.08); }
@keyframes nuc-spin { to { transform: rotate(360deg); } }
.nuc-avatar-inner { width: 100%; height: 100%; border-radius: 50%; background: #0B0C13; overflow: hidden; display: flex; align-items: center; justify-content: center; animation: nuc-spin 8s linear infinite reverse; }
.nuc-avatar-inner img { width: 100%; height: 100%; object-fit: cover; }
.nuc-cam-btn { position: absolute; bottom: 4px; right: 4px; width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,0.7); border: 1px solid rgba(0,194,255,0.3); display: flex; align-items: center; justify-content: center; color: #00C2FF; animation: nuc-spin 8s linear infinite reverse; }

.nuc-gold { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 28px; border-radius: 10px; border: none; background: linear-gradient(135deg, #C8A44E 0%, #E8C65A 50%, #C8A44E 100%); color: #0B0C13; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 20px rgba(200,164,78,0.25); }
.nuc-gold:hover { box-shadow: 0 6px 30px rgba(200,164,78,0.4); transform: translateY(-1px); }
.nuc-gold:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

.nuc-pay-row { display: grid; grid-template-columns: 1fr 120px 100px 100px 90px; align-items: center; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.2s ease; }
.nuc-pay-row:last-child { border-bottom: none; }
.nuc-pay-row:hover { background: rgba(0,194,255,0.02); }

.nuc-name-input { background: transparent; border: none; border-bottom: 1px solid rgba(0,194,255,0.4); color: #fff; font-size: 18px; font-weight: 500; line-height: 1.4; font-family: 'Inter', sans-serif; padding: 2px 0 4px; outline: none; width: auto; min-width: 140px; max-width: 240px; flex: 0 1 auto; box-sizing: content-box; vertical-align: baseline; }
.nuc-name-input:focus { border-bottom-color: #00C2FF; }

.nuc-pencil { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; background: transparent; border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.3); cursor: pointer; transition: all 0.2s ease; margin-left: 8px; }
.nuc-pencil:hover { color: #00C2FF; border-color: rgba(0,194,255,0.3); background: rgba(0,194,255,0.06); }

.nuc-signout { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(255,100,100,0.2); background: rgba(255,100,100,0.04); color: rgba(255,100,100,0.6); font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s ease; font-family: 'Inter', sans-serif; letter-spacing: 0.05em; text-transform: uppercase; }
.nuc-signout:hover { background: rgba(255,100,100,0.1); border-color: rgba(255,100,100,0.4); color: rgba(255,100,100,0.8); }

/* v4.0 — Dashboard vertical (móvil) + Split-View (desktop). */
.nuc-id-block { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 4px 0 0; }
.nuc-id-name { font-family: 'Inter', sans-serif; font-size: 20px; font-weight: 500; letter-spacing: 0.06em; color: #fff; text-align: center; line-height: 1.2; margin: 0; }
.nuc-id-tag { display: inline-flex; align-items: center; gap: 7px; padding: 5px 14px; border-radius: 999px; font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; background: rgba(0,194,255,0.06); border: 1px solid rgba(0,194,255,0.2); color: rgba(0,194,255,0.85); }
.nuc-id-tag.is-gold { background: rgba(212,168,67,0.06); border-color: rgba(212,168,67,0.3); color: #D4A843; }
.nuc-id-tag.is-explorer { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.14); color: rgba(255,255,255,0.55); }
.nuc-id-tag-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; box-shadow: 0 0 6px currentColor; }
.nuc-dashboard-stack { display: flex; flex-direction: column; gap: 12px; width: 100%; max-width: 520px; margin: 0 auto; }
.nuc-card-btn { position: relative; display: flex; align-items: center; gap: 16px; width: 100%; padding: 18px 18px 18px 20px; border-radius: 16px; background: linear-gradient(160deg, rgba(8,24,48,0.55) 0%, rgba(5,16,34,0.65) 100%); border: 1px solid rgba(0,194,255,0.16); backdrop-filter: blur(16px) saturate(140%); -webkit-backdrop-filter: blur(16px) saturate(140%); cursor: pointer; transition: all 0.32s cubic-bezier(0.22,1,0.36,1); text-align: left; outline: none; font-family: 'Inter', sans-serif; color: #fff; box-shadow: 0 4px 18px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05); -webkit-tap-highlight-color: transparent; }
.nuc-card-btn:hover { border-color: rgba(0,194,255,0.4); background: linear-gradient(160deg, rgba(10,30,56,0.65) 0%, rgba(6,20,40,0.75) 100%); box-shadow: 0 6px 26px rgba(0,194,255,0.14), inset 0 1px 0 rgba(255,255,255,0.08); transform: translateY(-1px); }
.nuc-card-btn:active { transform: translateY(0); }
.nuc-card-icon { flex: 0 0 auto; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: rgba(0,194,255,0.06); border: 1px solid rgba(0,194,255,0.2); color: #00C2FF; transition: all 0.32s ease; }
.nuc-card-btn:hover .nuc-card-icon { background: rgba(0,194,255,0.12); border-color: rgba(0,194,255,0.4); box-shadow: 0 0 14px rgba(0,194,255,0.18); }
.nuc-card-text { flex: 1 1 auto; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.nuc-card-title { font-size: 14px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #fff; line-height: 1.2; }
.nuc-card-sub { font-size: 12px; font-weight: 300; letter-spacing: 0.02em; color: rgba(255,255,255,0.45); line-height: 1.35; }
.nuc-card-arrow { flex: 0 0 auto; color: rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; transition: all 0.32s ease; }
.nuc-card-btn:hover .nuc-card-arrow { color: #00C2FF; transform: translateX(3px); }
.nuc-back-btn { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px 8px 10px; margin-bottom: 18px; border-radius: 999px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.10); color: rgba(255,255,255,0.65); font-family: 'Inter', sans-serif; font-size: 11.5px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; transition: all 0.25s ease; outline: none; -webkit-tap-highlight-color: transparent; }
.nuc-back-btn:hover { background: rgba(0,194,255,0.06); border-color: rgba(0,194,255,0.3); color: #00C2FF; }

.nuc-desanclar { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; margin: 0; background: transparent; border: 1px solid rgba(120,150,180,0.15); border-radius: 999px; color: rgba(140,180,210,0.55); font-family: 'Inter', sans-serif; font-size: 10.5px; font-weight: 400; letter-spacing: 0.28em; text-transform: uppercase; cursor: pointer; transition: all 0.32s ease; outline: none; -webkit-tap-highlight-color: transparent; }
.nuc-desanclar:hover { color: rgba(160,200,220,0.85); border-color: rgba(140,180,210,0.35); background: rgba(140,180,210,0.04); }

/* Split-View desktop */
.nuc-sidebar { position: sticky; top: 0; align-self: flex-start; display: flex; flex-direction: column; gap: 28px; padding: 12px 24px 32px; min-height: 100%; }
.nuc-sidebar-menu { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
.nuc-sidebar-item { display: flex; align-items: center; justify-content: center; gap: 14px; width: 100%; padding: 12px 14px; border-radius: 12px; background: transparent; border: 1px solid transparent; color: rgba(255,255,255,0.92); font-family: 'Inter', sans-serif; font-size: 12.5px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; transition: all 0.28s ease; text-align: center; outline: none; -webkit-tap-highlight-color: transparent; }
.nuc-no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
.nuc-no-scrollbar::-webkit-scrollbar { display: none; }
.nuc-sidebar-item:hover { background: rgba(0,194,255,0.04); color: #FFFFFF; border-color: rgba(0,194,255,0.10); }
.nuc-sidebar-item.is-active { background: linear-gradient(165deg, rgba(0,194,255,0.10) 0%, rgba(0,100,180,0.14) 100%); color: #00C2FF; border-color: rgba(0,194,255,0.32); box-shadow: 0 0 18px rgba(0,194,255,0.10), inset 0 0 12px rgba(0,194,255,0.06); text-shadow: 0 0 8px rgba(0,194,255,0.35); }
.nuc-col-wrap[data-focused="false"] .nuc-sidebar-item.is-active { background: linear-gradient(165deg, rgba(0,194,255,0.04) 0%, rgba(0,100,180,0.06) 100%); color: rgba(255,255,255,0.88); border-color: rgba(0,194,255,0.14); box-shadow: none; text-shadow: none; }
.nuc-sidebar-item-icon { flex: 0 0 auto; display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; }
.nuc-sidebar-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(0,194,255,0.18), transparent); margin: 6px 0; }

.holo-corner { position: absolute; width: 20px; height: 20px; pointer-events: none; z-index: 5; }
.holo-corner svg { width: 100%; height: 100%; }
.holo-corner-tl { top: 8px; left: 8px; }
.holo-corner-tr { top: 8px; right: 8px; transform: scaleX(-1); }
.holo-corner-bl { bottom: 8px; left: 8px; transform: scaleY(-1); }
.holo-corner-br { bottom: 8px; right: 8px; transform: scale(-1); }
@keyframes holo-scan { 0% { top: -2px; opacity: 0; } 10% { opacity: 0.4; } 90% { opacity: 0.4; } 100% { top: 100%; opacity: 0; } }
.holo-scanline { position: absolute; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(0,194,255,0.3), transparent); pointer-events: none; z-index: 6; animation: holo-scan 6s linear infinite; }

.nuc-sello-bar { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 12px 0; background: linear-gradient(180deg, rgba(0,194,255,0.03) 0%, rgba(0,194,255,0.06) 100%); border: none; border-top: 1px solid rgba(0,194,255,0.12); border-radius: 0 0 20px 20px; color: rgba(0,194,255,0.7); font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.3s ease; }
.nuc-sello-bar:hover { background: linear-gradient(180deg, rgba(0,194,255,0.06) 0%, rgba(0,194,255,0.1) 100%); color: #00C2FF; text-shadow: 0 0 10px rgba(0,194,255,0.4); }
@keyframes nuc-breath{0%,100%{filter:brightness(1)}50%{filter:brightness(1.15)}}
@keyframes nuc-portal-glow{0%,100%{box-shadow:0 0 10px rgba(212,168,67,0.15),0 0 25px rgba(212,168,67,0.06)}8%{box-shadow:0 0 30px rgba(212,168,67,0.55),0 0 60px rgba(212,168,67,0.2),0 0 100px rgba(212,168,67,0.08)}16%{box-shadow:0 0 18px rgba(212,168,67,0.3),0 0 35px rgba(212,168,67,0.1)}24%{box-shadow:0 0 24px rgba(212,168,67,0.4),0 0 50px rgba(212,168,67,0.15),0 0 80px rgba(212,168,67,0.05)}40%{box-shadow:0 0 12px rgba(212,168,67,0.2),0 0 30px rgba(212,168,67,0.08)}}
@keyframes nuc-portal-breathe{0%,100%{transform:scale(1);filter:brightness(1) saturate(1)}9%{transform:scale(1.03);filter:brightness(1.14) saturate(1.1)}18%{transform:scale(1.01);filter:brightness(1.05) saturate(1.02)}27%{transform:scale(1.018);filter:brightness(1.09) saturate(1.06)}45%{transform:scale(0.997);filter:brightness(0.97) saturate(0.98)}70%{transform:scale(1.004);filter:brightness(1.02) saturate(1.01)}}
@keyframes nuc-portal-ring{0%{transform:scale(0.98);opacity:0.6}15%{transform:scale(1.06);opacity:0.3}40%{transform:scale(1.12);opacity:0.12}100%{transform:scale(1.2);opacity:0}}
@keyframes nuc-portal-shimmer{0%{transform:translateX(-120%) skewX(-15deg)}100%{transform:translateX(250%) skewX(-15deg)}}
@keyframes nuc-portal-ember{0%{transform:translateY(0) scale(1);opacity:0}15%{opacity:0.8}60%{opacity:0.4}100%{transform:translateY(-40px) scale(0.3);opacity:0}}
.nuc-portal-btn{position:relative;overflow:hidden}
.nuc-portal-btn::after{content:'';position:absolute;top:0;left:0;width:35%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.12),rgba(255,255,255,0.06),transparent);animation:nuc-portal-shimmer 6s ease-in-out infinite;pointer-events:none;border-radius:50px}

.nuc-cta-secondary { display: inline-flex; align-items: center; gap: 4px; background: none; border: none; padding: 8px 0; color: rgba(0,194,255,0.5); font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 400; letter-spacing: 0.04em; cursor: pointer; text-decoration: none; transition: all 0.25s ease; position: relative; }
.nuc-cta-secondary:hover { color: rgba(0,194,255,0.8); }

.nuc-pdf-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; background: linear-gradient(180deg, rgba(0,20,40,0.6) 0%, rgba(0,10,25,0.8) 100%); border-bottom: 1px solid rgba(0,194,255,0.12); border-radius: 14px 14px 0 0; }
.nuc-pdf-dl { display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 8px; background: rgba(0,194,255,0.06); border: 1px solid rgba(0,194,255,0.25); color: #00C2FF; font-size: 11px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; transition: all 0.25s ease; text-decoration: none; font-family: 'Inter', sans-serif; }
.nuc-pdf-dl:hover { background: rgba(0,194,255,0.14); border-color: rgba(0,194,255,0.5); box-shadow: 0 0 12px rgba(0,194,255,0.12); }

.nuc-modal-close { width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; outline: none; padding: 0; line-height: 1; border: 1px solid rgba(0,194,255,0.2); background: rgba(255,255,255,0.03); color: rgba(0,194,255,0.5); box-shadow: none; transform: rotate(0deg) scale(1); transition: transform 0.2s ease-out, box-shadow 0.2s ease-out, background 0.15s ease-out, color 0.15s ease-out, border-color 0.15s ease-out; }
.nuc-modal-close:hover { transform: rotate(90deg) scale(1.15) !important; box-shadow: 0 0 12px rgba(0,194,255,0.4), 0 0 24px rgba(0,194,255,0.15) !important; background: rgba(0,194,255,0.12) !important; border-color: currentColor !important; color: #00C2FF !important; }
.nuc-modal-close:active { transform: rotate(90deg) scale(0.95) !important; }

/* ═══════════════════════════════════════════════════════════
   v1.2 LENTE — adaptaciones mobile (viewport <768px).
   El layout de Centro de Mando se mantiene intacto por arriba
   de 768px. Dentro del breakpoint, el tabbar se fija al fondo
   del viewport (UX de app), las cards colapsan verticalmente,
   y la tipografía escala a proporciones legibles en 375px.
   ═══════════════════════════════════════════════════════════ */
@media (max-width: 767px) {
    /* v1.3 — Tabs en FLUJO NORMAL (no fixed). Antes estaban fixed a bottom:14
       pero el motion.div ancestor con animate=y aplicaba transform implícito
       que capturaba el position:fixed (bug CSS clásico) → tabs aparecían en
       lugar arbitrario y solapaban el título. Ahora tabs flotan glassy debajo
       del título, sin solapamiento. */
    .nuc-tabs {
        width: 100% !important;
        max-width: calc(100% - 4px) !important;
        margin: 0 auto !important;
        padding: 5px !important;
        gap: 4px !important;
        border-radius: 16px !important;
        backdrop-filter: blur(18px) saturate(1.4);
        -webkit-backdrop-filter: blur(18px) saturate(1.4);
        background: linear-gradient(180deg, rgba(0,20,40,0.82) 0%, rgba(0,10,25,0.92) 100%) !important;
        box-shadow: 0 4px 24px rgba(0,0,0,0.35), 0 0 20px rgba(0,194,255,0.06), inset 0 1px 0 rgba(255,255,255,0.05) !important;
    }
    .nuc-tab {
        flex: 1 !important;
        padding: 11px 4px !important;
        font-size: 9.5px !important;
        letter-spacing: 0.08em !important;
        text-align: center !important;
        white-space: nowrap !important;
    }
    /* Avatar: de 140px a 84px en el Lente */
    .nuc-avatar-ring {
        width: 84px !important;
        height: 84px !important;
        animation: none !important;
    }
    /* v3.18 — Cancelamos las animations encadenadas en mobile para
       evitar el bug de iOS WebKit donde el contra-spin del inner
       acumula drift rotacional sobre el spin del ring → foto se ve
       constantemente inclinada hacia la derecha. La estética del
       conic-gradient cyan/dorado se conserva (queda como halo
       estático), solo se elimina el giro. En desktop el spin sigue
       intacto sin issues. */
    .nuc-avatar-inner {
        animation: none !important;
    }
    .nuc-cam-btn {
        width: 24px !important;
        height: 24px !important;
        bottom: 2px !important;
        right: 2px !important;
        animation: none !important;
    }
    /* Name input más compacto */
    .nuc-name-input {
        font-size: 15px !important;
        max-width: 220px !important;
    }
    /* Pay row: grid horizontal → stack vertical */
    .nuc-pay-row {
        grid-template-columns: 1fr !important;
        gap: 4px !important;
        padding: 14px 16px !important;
    }
    /* Gold CTA compactado */
    .nuc-gold {
        padding: 11px 22px !important;
        font-size: 11px !important;
        letter-spacing: 0.06em !important;
    }
    /* Pill button compactado */
    .nuc-pill {
        padding: 7px 14px !important;
        font-size: 11px !important;
    }
    /* Glass cards: menos padding interno via CSS variables del componente */
    .nuc-glass {
        border-radius: 16px !important;
    }
    /* Sign-out button full-width-ish en Lente */
    .nuc-signout {
        padding: 9px 18px !important;
        font-size: 11px !important;
    }
    /* PDF toolbar compactada */
    .nuc-pdf-toolbar {
        padding: 11px 14px !important;
        flex-wrap: wrap !important;
        gap: 8px !important;
    }
    .nuc-pdf-dl {
        padding: 6px 12px !important;
        font-size: 10px !important;
    }
    /* Sello bar compactado */
    .nuc-sello-bar {
        font-size: 10px !important;
        padding: 11px 0 !important;
    }
    /* v1.3 — Cámara Solar: card de Estado Inmersión.
       En desktop la fila es horizontal (badge + fecha + gestionar).
       En el Lente la pantalla es muy angosta — hay overflow del texto
       "Renovación: Desactivada" + "Gestionar" → cut-off feo.
       Mobile: stack vertical, info usa todo el ancho con wrap. */
    .nuc-cam-status-row {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: 10px !important;
    }
    .nuc-cam-status-info {
        width: 100% !important;
        flex-wrap: wrap !important;
        gap: 8px 12px !important;
    }
    /* v1.3 — Sintonización portal: oculta los divisores verticales
       (líneas de 1px que se veían "extrañas" cuando los elementos
       envuelven a varias filas en el Lente). En desktop quedan
       intactos. */
    .nuc-tunesync-divider {
        display: none !important;
    }
    /* v1.4 — Mi Firma: títulos h2 de las secciones (Clave de Acceso,
       Registro de Transacciones) compactados para que entren en 1 línea
       en el Lente. En desktop conservan tamaño original (20px). */
    .nuc-section-h2 {
        font-size: 14px !important;
        letter-spacing: 0.08em !important;
        white-space: nowrap !important;
    }
    .nuc-section-sub {
        font-size: 10px !important;
        letter-spacing: 0.04em !important;
    }
    /* v1.4 — Tabla de Registro de Transacciones: el header con 5 columnas
       (Concepto / Fecha / Monto / Estado / Factura) no tiene sentido en
       stack vertical — se oculta. Cada row se renderiza como card con
       grid-areas: arriba concepto+dot, debajo fecha, y abajo una fila
       horizontal con monto + estado + factura bien alineados. Esto
       permite que la tabla se lea y navegue bien en el Lente. */
    .nuc-pay-head {
        display: none !important;
    }
    .nuc-pay-row {
        grid-template-columns: auto 1fr auto !important;
        grid-template-areas:
            "concept concept concept"
            "date date date"
            "amount status invoice" !important;
        column-gap: 10px !important;
        row-gap: 6px !important;
        padding: 14px 16px !important;
        align-items: center !important;
    }
    /* Ordenamiento por posición de hijo (5 siblings en este orden) */
    .nuc-pay-row > *:nth-child(1) { grid-area: concept !important; }
    .nuc-pay-row > *:nth-child(2) {
        grid-area: date !important;
        font-size: 11px !important;
        color: rgba(255,255,255,0.3) !important;
        margin-left: 18px !important;
    }
    .nuc-pay-row > *:nth-child(3) {
        grid-area: amount !important;
        text-align: left !important;
        margin-left: 18px !important;
        font-size: 14px !important;
    }
    .nuc-pay-row > *:nth-child(4) {
        grid-area: status !important;
        justify-self: end !important;
    }
    .nuc-pay-row > *:nth-child(5) {
        grid-area: invoice !important;
        justify-self: end !important;
    }
    /* v1.6 — HoloCinePlayer (modal de videos de Cámara Solar):
       en el Lente el modal toma TODA la pantalla. El video horizontal
       se renderiza con aspect-ratio 16/9 al ancho completo y queda
       CENTRADO verticalmente (ya no pegado al top). El espacio
       arriba/abajo es oscuro — sensación cinematográfica. Si el
       tripulante rota a landscape, el video crece y aprovecha la
       altura disponible. El botón X queda flotando arriba a la derecha
       FUERA del frame del video. */
    .holo-modal-cine {
        width: 100vw !important;
        max-width: 100vw !important;
        height: 100vh !important;
        height: 100dvh !important;
        border-radius: 0 !important;
        border: none !important;
        padding: 0 !important;
        box-shadow: none !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
    }
    .holo-modal-cine-video {
        flex: none !important;
        width: 100% !important;
        aspect-ratio: 16 / 9 !important;
        max-height: 100vh !important;
        margin-top: 0 !important;
        border-radius: 0 !important;
        border: none !important;
    }
    /* Cerrar arriba derecha sobre fondo oscuro semitransparente para que
       el botón sea siempre visible aunque el video esté brillante */
    .holo-modal-cine .nuc-modal-close {
        background: rgba(0,0,0,0.55) !important;
        backdrop-filter: blur(8px) !important;
        -webkit-backdrop-filter: blur(8px) !important;
        top: 14px !important;
        right: 14px !important;
    }
    /* v1.5 — HoloPDFViewer (Sello de Integración): mismo tratamiento.
       Toolbar arriba compacta, iframe full-bleed con FitH para que
       la página del PDF entre completa al ancho del Lente. Antes el
       iframe tenía width: calc(100% + 20px) que cortaba el lado
       derecho — en mobile lo forzamos a 100% exacto. */
    .holo-modal-pdf {
        width: 100vw !important;
        max-width: 100vw !important;
        height: 100vh !important;
        height: 100dvh !important;
        border-radius: 0 !important;
        border: none !important;
        box-shadow: none !important;
    }
    .holo-modal-pdf-content {
        margin: 0 !important;
        border-radius: 0 !important;
        border: none !important;
    }
    .holo-modal-pdf-iframe {
        width: 100% !important;
    }
    /* v1.7 — Cámara Solar: grid de sesiones grabadas. En desktop son
       2 columnas (cards más compactas, mejor uso del ancho generoso).
       En el Lente cada card debe tomar el ancho completo para que el
       thumbnail 16:9 se vea grande y legible — colapsa a 1 columna. */
    .nuc-sessions-grid {
        grid-template-columns: 1fr !important;
    }
    /* v1.8 — Pantalla guest "Expande Tu Frecuencia". El h1 a 42px con
       letter-spacing 0.4em desbordaba horizontalmente en el Lente.
       Mobile: 26px + letter-spacing más cerrado. Subtítulo también
       compactado para no saturar el espacio. */
    .nuc-guest-title {
        font-size: 26px !important;
        letter-spacing: 0.2em !important;
        margin-right: -0.2em !important;
        line-height: 1.4 !important;
    }
    .nuc-guest-sub {
        font-size: 12px !important;
        letter-spacing: 0.1em !important;
        margin-top: 22px !important;
    }
}
/* v1.8 — "SELLO DE INTEGRACIÓN" centrado en el toolbar del PDF viewer.
   Estructura: [icono left] [h3 centrado en el flex disponible] [Descargar right].
   El h3 con flex:1 + textAlign center queda visualmente centrado mientras el
   icono y Descargar mantienen sus posiciones laterales. */
.nuc-pdf-toolbar-title {
    flex: 1 !important;
    text-align: center !important;
    margin: 0 !important;
}
`

function useInjectCss() {
    useLayoutEffect(() => {
        if (typeof document === "undefined") return
        /* v1.2 — bump del id para forzar re-inyección del CSS
           (ahora incluye media query del Lente). */
        const id = "nucleo-css-v31"
        const p = document.getElementById(id) as HTMLStyleElement | null
        if (p) {
            p.textContent = CSS
            return
        }
        const s = document.createElement("style")
        s.id = id
        s.textContent = CSS
        document.head.appendChild(s)
    }, [])
}

/* Default export: componente fantasma + utilities como propiedades. */
function MNStylesRoot(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
MNStylesRoot.displayName = "MN_Styles"

const Styles = Object.assign(MNStylesRoot, {
    CSS,
    useInjectCss,
})

export default Styles
