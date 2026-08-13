import * as React from "react"
import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/* ═══════════════════════════════════════════════════════════
   CSS — QUANTUM 6D LANDING v2
   ═══════════════════════════════════════════════════════════ */
const HOLO_CSS = String.raw`
:root {
  --bg-space: #000000;
  --text-color: #E6F7EF;
  --holo-primary: #00C2FF;
  --holo-secondary: #4dd6ff;
  --holo-glow: rgba(0,194,255,0.25);
  --orbit-stroke: rgba(0,194,255,0.45);
}

/* ── SCROLLBAR KILL ── */
html::-webkit-scrollbar,
body::-webkit-scrollbar,
.qr::-webkit-scrollbar { display:none!important; width:0!important; }
html,body,.qr { scrollbar-width:none!important; -ms-overflow-style:none!important; }

/* ── ROOT ── */
.qr {
  position:relative; width:100%; height:100vh;
  overflow-y:auto; overflow-x:hidden;
  background:#000; color:var(--text-color);
  scroll-behavior:smooth; font-family:'Inter',sans-serif;
}

/* ── STARS (pure black bg, no vignette tint) ── */
.sf-wrap {
  position:fixed; inset:0; width:100%; height:100%;
  z-index:0; pointer-events:none; overflow:hidden;
  perspective:400px; background:#000;
}
.sf-s {
  position:absolute; left:50%; top:50%;
  width:var(--sz); height:var(--sz);
  border-radius:50%; background:#fff;
  box-shadow:0 0 3px 1px rgba(255,255,255,0.5);
  animation:sf-fly var(--dur) linear infinite;
  animation-delay:var(--dl); opacity:0;
  will-change:transform,opacity;
}
@keyframes sf-fly {
  0%{transform:translate3d(var(--tx),var(--ty),-1000px);opacity:0}
  10%{opacity:1}
  100%{transform:translate3d(var(--tx),var(--ty),200px);opacity:0}
}

/* ── COMETS ── */
.comet{
  --x:0px;--y:0px;--dx:0px;--dy:0px;--rot:0deg;
  position:absolute;left:0;top:0;width:3px;height:3px;border-radius:50%;
  background:#fff;visibility:hidden;opacity:0;will-change:transform,opacity;
  filter:drop-shadow(0 0 8px #fff) drop-shadow(0 0 16px var(--holo-primary));
  animation:none;
}
.comet::after{content:"";position:absolute;left:-160px;top:50%;height:2px;width:160px;transform:translateY(-50%);background:linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.25) 60%,rgba(255,255,255,.9) 95%,rgba(255,255,255,0) 100%);filter:blur(.8px)}
.comet::before{content:"";position:absolute;right:-2px;top:-2px;width:8px;height:8px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,1),rgba(255,255,255,.35) 60%,rgba(255,255,255,0) 70%)}
@keyframes comet-move{
  0%{opacity:0;visibility:hidden;transform:translate(var(--x),var(--y)) rotate(var(--rot))}
  4%{visibility:visible}8%{opacity:1}
  100%{opacity:0;visibility:hidden;transform:translate(calc(var(--x)+var(--dx)),calc(var(--y)+var(--dy))) rotate(var(--rot))}
}

/* ── HERO STAGE ── */
.qr-stage {
  position:relative; width:100%; min-height:100vh;
  display:flex; flex-direction:column; align-items:center;
  padding:0 20px;
  margin-top:calc(var(--navbar-offset) + var(--title-offset));
  z-index:2;
}

/* ── TITLE (Gradient style from mobile) ── */
.qr-title {
  margin:0; font-family:'Inter',sans-serif; font-weight:100;
  font-size:clamp(32px,5vw,var(--title-size-px));
  text-transform:uppercase; letter-spacing:0.4em; margin-right:-0.4em;
  line-height:1; text-align:center;
  background:linear-gradient(180deg,var(--holo-primary),#fff);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  filter:drop-shadow(0 0 12px var(--holo-glow));
  -webkit-font-smoothing:antialiased;
}
.qr-sub {
  font-family:'Inter',sans-serif; font-size:1.05rem; font-weight:300;
  margin:12px 0 0; text-transform:uppercase; letter-spacing:0.3em;
  background:linear-gradient(180deg,var(--holo-primary),#fff);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  filter:drop-shadow(0 0 10px var(--holo-glow)); text-align:center;
}
.qr-tag {
  font-family:'Inter',sans-serif; font-size:clamp(0.85rem,1.8vw,1.1rem);
  font-weight:300; opacity:0.55; max-width:600px; text-align:center;
  margin:10px auto 0; color:#fff; letter-spacing:0.12em; line-height:1.6;
  white-space:pre-line;
}

/* ── TOROIDE ── */
.tor-wrap {
  position:absolute; inset:0;
  display:grid; place-items:center;
  pointer-events:none; z-index:3;
}
.tor-img {
  width:var(--tor-size,280px); height:auto; object-fit:contain;
  animation:tor-pulse 5s ease-in-out infinite alternate;
  filter:drop-shadow(0 0 25px var(--holo-glow))
         drop-shadow(0 0 60px rgba(212,168,67,0.25))
         drop-shadow(0 0 100px var(--holo-glow));
  will-change:transform,filter;
}
@keyframes tor-pulse {
  0%{transform:scale(0.97);filter:drop-shadow(0 0 25px var(--holo-glow)) drop-shadow(0 0 60px rgba(212,168,67,0.2))}
  100%{transform:scale(1.03);filter:drop-shadow(0 0 35px var(--holo-glow)) drop-shadow(0 0 80px rgba(212,168,67,0.35)) drop-shadow(0 0 120px var(--holo-glow))}
}

/* ── ORBIT AREA ── */
.qr-orbits {
  position:relative; width:100%; max-width:1400px;
  min-height:800px; aspect-ratio:1/1;
  overflow:visible; pointer-events:none;
}
.qr-orbits-svg {
  position:absolute; inset:0; width:100%; height:100%;
  pointer-events:none; z-index:1; overflow:visible;
}

/* ── ORBIT LINES: holographic energy rings ── */
.orb-back {
  fill:none; vector-effect:non-scaling-stroke;
  stroke:var(--holo-primary); stroke-width:0.5px; opacity:0.08;
}
.orb-front {
  fill:none; vector-effect:non-scaling-stroke;
  stroke:var(--holo-primary); stroke-width:0.8px; opacity:0.2;
  filter:drop-shadow(0 0 3px rgba(0,229,255,0.15));
  transition:all 0.6s ease;
}
.orb-front.is-active {
  stroke-width:1.2px; opacity:0.55;
  filter:drop-shadow(0 0 6px rgba(0,229,255,0.35)) drop-shadow(0 0 12px rgba(0,229,255,0.15));
}

/* ── PLANET ON PATH ── */
@keyframes orbit-move{to{offset-distance:100%}}
.onpath {
  position:absolute; offset-distance:0%; offset-rotate:0deg;
  will-change:offset-distance; z-index:4;
  offset-anchor:50% 50%; -webkit-offset-anchor:50% 50%;
  pointer-events:auto;
}
/* Global pause: freeze all orbits + labels when a node is active */
.qr-orbits.is-paused .onpath,
.qr-orbits.is-paused .onpath .lbl { animation-play-state:paused!important; }

/* ── 3D SHAPES ── */
.sh-wrap {
  position:absolute; inset:6%; pointer-events:none;
  filter:drop-shadow(0 0 5px var(--holo-primary)) drop-shadow(0 0 15px var(--holo-glow));
}
.sh { width:100%; height:100%; transform-origin:50% 50%; }
.lc { stroke:color-mix(in srgb,var(--holo-primary) 88%,white 6%); stroke-width:1.5; fill:none; vector-effect:non-scaling-stroke; stroke-linecap:round; stroke-linejoin:round; }
.ld { opacity:0.4; }

@keyframes spin-s{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
@keyframes spin-r{0%{transform:rotate(360deg)}100%{transform:rotate(0)}}
@keyframes flt-y{0%,100%{transform:translateY(-3%)}50%{transform:translateY(3%)}}
@keyframes pls-s{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes sw-t{0%{transform:rotate(-12deg) scale(0.95)}100%{transform:rotate(12deg) scale(1.05)}}

.pl-box {
  position:absolute; inset:0; background:transparent;
  overflow:visible; transition:transform 0.3s ease;
}
.pl-box.hov { transform:scale(1.15); filter:brightness(1.2); }

/* ── RETICLE ── */
.ret {
  position:absolute; width:var(--ret-sz); height:var(--ret-sz);
  left:50%; top:50%; transform:translate(-50%,-50%) scale(.9);
  opacity:0; transition:opacity .16s ease,transform .16s ease; pointer-events:none;
}
.ret.on { opacity:1; transform:translate(-50%,-50%) scale(1); }
.ret::before,.ret::after {
  content:""; position:absolute; inset:0; border-radius:3px;
  border:1px solid color-mix(in srgb,var(--holo-primary) 70%,transparent);
  box-shadow:0 0 calc(12px * var(--ret-glow)) var(--holo-primary);
  mask:linear-gradient(#000 0 0) center/66% .5px no-repeat,linear-gradient(#000 0 0) center/.5px 66% no-repeat;
  opacity:.6;
}
.ret .cn { position:absolute; width:16px; height:16px; border:1px solid var(--holo-secondary); box-shadow:0 0 8px var(--holo-primary); }
.cn.tl{top:-2px;left:-2px;border-right:0;border-bottom:0}
.cn.tr{top:-2px;right:-2px;border-left:0;border-bottom:0}
.cn.bl{bottom:-2px;left:-2px;border-right:0;border-top:0}
.cn.br{bottom:-2px;right:-2px;border-left:0;border-top:0}
.ret .scn {
  position:absolute;left:2px;right:2px;height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent);
  animation:ret-scn 2.2s linear infinite;
  filter:drop-shadow(0 0 6px var(--holo-primary));
}
@keyframes ret-scn{from{top:12%}to{top:88%}}

.lbl {
  position:absolute; left:50%;
  top:calc(100% + var(--lbl-off,6px));
  transform:translateX(-50%);
  font-size:11px; font-weight:400; color:#fff!important;
  letter-spacing:0.12em; text-transform:uppercase;
  opacity:0.75;
  text-shadow:0 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5);
  white-space:nowrap; pointer-events:none;
}
/* Flip label ABOVE planet when crossing top arc — sesiones only */
@keyframes lbl-flip {
  0%     { top:calc(100% + var(--lbl-off,6px)); }
  9.9%   { top:calc(100% + var(--lbl-off,6px)); }
  10%    { top:calc(0px - var(--lbl-off,6px) - 18px); }
  39.9%  { top:calc(0px - var(--lbl-off,6px) - 18px); }
  40%    { top:calc(100% + var(--lbl-off,6px)); }
  100%   { top:calc(100% + var(--lbl-off,6px)); }
}

/* ═══════ FLOATING GLASSMORPHISM CARD (hover panel) ═══════ */
.holo-float-card {
  position:fixed; z-index:50;
  width:380px;
  background:
    radial-gradient(ellipse at 50% 0%, rgba(0,194,255,0.06), transparent 60%),
    rgba(8,14,28,0.88);
  backdrop-filter:blur(24px) saturate(1.3);
  border:1px solid rgba(0,194,255,0.2);
  border-top:1px solid rgba(255,255,255,0.08);
  border-radius:22px;
  padding:36px 32px 32px;
  display:flex; flex-direction:column; align-items:center;
  text-align:center; gap:14px;
  box-shadow:
    0 20px 60px rgba(0,0,0,0.7),
    0 0 40px rgba(0,194,255,0.08),
    inset 0 0 30px rgba(0,194,255,0.03);
  pointer-events:auto;
}
.hfc-icon { width:52px; height:52px; color:var(--holo-primary); filter:drop-shadow(0 0 8px rgba(0,194,255,0.5)); }
.hfc-title {
  font-family:'Inter',sans-serif; font-weight:600; font-size:1.25rem;
  color:#fff; letter-spacing:0.08em; text-transform:uppercase;
  text-shadow:0 2px 4px rgba(0,0,0,0.6);
  margin:0;
}
.hfc-desc {
  font-family:'Inter',sans-serif; font-weight:300; font-size:0.95rem;
  color:rgba(200,225,240,0.85); line-height:1.6; margin:0;
}
.hfc-btn {
  display:inline-flex; align-items:center; justify-content:center;
  padding:12px 30px; border-radius:50px;
  font-family:'Inter',sans-serif; font-size:0.85rem; font-weight:600;
  letter-spacing:0.1em; text-transform:uppercase; text-decoration:none;
  color:var(--holo-primary); background:transparent;
  border:1px solid rgba(0,194,255,0.4);
  box-shadow:0 0 12px rgba(0,194,255,0.1);
  transition:all 0.25s ease;
  margin-top:4px;
}
.hfc-btn:hover {
  background:var(--holo-primary); color:#000;
  box-shadow:0 0 20px rgba(0,194,255,0.5);
}

/* ═══════ START SCREEN LAYER ═══════ */
.qr-start { position:absolute; top:0; left:0; width:100%; height:100vh; pointer-events:none; z-index:15; }
.scroll-dots-wrap {
  position:absolute; bottom:30px; left:50%; transform:translateX(-50%);
  display:flex; flex-direction:column; gap:12px;
  z-index:10; pointer-events:none; mix-blend-mode:screen;
}
.scroll-dot {
  width:6px; height:6px; background-color:var(--holo-primary);
  border-radius:50%; box-shadow:0 0 10px var(--holo-primary),0 0 20px var(--holo-primary);
  opacity:0;
}

/* ═══════ EARTH SECTION ═══════ */
.qr-earth {
  position:relative; z-index:20; width:100%; max-width:1200px;
  margin:-70vh auto 0; padding:80px 48px 120px;
  display:flex; flex-direction:column; gap:0;
  /* NO background frame — elements float in space */
}

/* ── Separators ── */
.sep { width:100%; height:1px; background:linear-gradient(90deg,transparent,rgba(0,194,255,0.4),transparent); opacity:0.3; margin:20px 0; }
.sep-sm { width:80px; height:1px; background:linear-gradient(90deg,transparent,rgba(0,194,255,0.4),transparent); opacity:0.3; }

/* ── Manifesto ── */
.man-block { text-align:center; max-width:900px; margin:0 auto 60px; display:flex; flex-direction:column; align-items:center; }
.man-text {
  font-family:'Inter',sans-serif; font-weight:200;
  font-size:clamp(1.3rem,2.5vw,1.8rem);
  line-height:1.6; color:#fff; margin:0;
  white-space:pre-line; text-align:center;
}

/* ── Gradient Title ── */
.gt {
  font-family:'Inter',sans-serif; font-weight:300; margin:0;
  background:linear-gradient(180deg,var(--holo-primary),#fff);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  letter-spacing:0.22em; text-align:center;
}

/* ── Guia Section ── */
.guia-sec {
  display:flex; flex-direction:column; align-items:center;
  gap:24px; padding:90px 40px 100px;
}
.guia-img {
  width:220px; height:220px; border-radius:50%; overflow:hidden;
  border:2px solid rgba(0,194,255,0.4);
  box-shadow:0 0 40px rgba(0,194,255,0.2),0 0 80px rgba(0,194,255,0.08);
}
.guia-img img { width:100%; height:100%; object-fit:cover; }
.guia-desc {
  font-family:'Inter',sans-serif; font-size:1.1rem; font-weight:300;
  color:#fff; opacity:0.6; margin:0; text-align:center;
  line-height:1.7; max-width:600px; white-space:pre-line;
}

/* ── Golden Button ── */
@keyframes gshim{0%{left:-100%}50%{left:140%}100%{left:140%}}
.gold-btn {
  position:relative; display:inline-flex; align-items:center; justify-content:center;
  gap:12px; padding:18px 44px; border-radius:16px;
  border:1px solid rgba(212,168,67,0.6);
  background:linear-gradient(135deg,rgba(212,168,67,0.15),transparent,rgba(212,168,67,0.1));
  color:#D4A843; font-family:'Inter',sans-serif; font-size:0.9rem; font-weight:600;
  letter-spacing:0.14em; text-transform:uppercase; cursor:pointer; outline:none;
  text-decoration:none; overflow:hidden; backdrop-filter:blur(4px);
  box-shadow:0 0 20px rgba(212,168,67,0.2),0 0 40px rgba(212,168,67,0.08),inset 0 1px 0 rgba(212,168,67,0.25);
  transition:all 0.3s ease;
}
.gold-btn:hover { border-color:rgba(212,168,67,0.9); box-shadow:0 0 30px rgba(212,168,67,0.35),0 0 60px rgba(212,168,67,0.15); transform:translateY(-2px); }
.gold-btn .shim { position:absolute; inset:0; border-radius:16px; overflow:hidden; pointer-events:none; }
.gold-btn .shim::after { content:''; position:absolute; top:0; left:-100%; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(212,168,67,0.25),transparent); animation:gshim 3.5s ease-in-out infinite; }

/* ── Hide / ReadMore ── */
.hide-btn {
  padding:12px 28px; border-radius:50px;
  border:1px solid rgba(0,194,255,0.2); background:transparent;
  color:rgba(0,194,255,0.5); font-family:'Inter',sans-serif;
  font-size:0.8rem; font-weight:400; letter-spacing:0.08em;
  cursor:pointer; outline:none; text-transform:uppercase; transition:all 0.3s;
}
.hide-btn:hover { border-color:rgba(0,194,255,0.5); color:rgba(0,194,255,0.8); }
.rm-btn {
  margin-top:28px; display:inline-flex; align-items:center; gap:10px;
  padding:14px 30px; border-radius:50px;
  border:1px solid rgba(0,194,255,0.25); background:transparent;
  color:rgba(0,194,255,0.6); font-family:'Inter',sans-serif; font-size:0.82rem;
  font-weight:500; letter-spacing:0.1em; text-transform:uppercase;
  cursor:pointer; outline:none; transition:all 0.3s;
}
.rm-btn:hover { border-color:rgba(0,194,255,0.5); color:rgba(0,194,255,0.9); }

/* ── Signal / Newsletter ── */
.sig-block { width:100%; display:flex; flex-direction:column; align-items:center; gap:40px; margin:70px 0; }
.sig-content { text-align:center; max-width:700px; }
.sig-title {
  font-family:'Inter',sans-serif; font-weight:300; font-size:1.1rem;
  letter-spacing:0.22em; text-transform:uppercase;
  background:linear-gradient(180deg,var(--holo-primary),#fff);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  margin-bottom:12px; filter:drop-shadow(0 0 8px var(--holo-glow));
}
.sig-desc { font-family:'Inter',sans-serif; font-weight:300; font-size:1.05rem; color:rgba(255,255,255,0.6); margin-bottom:36px; line-height:1.7; }
.sig-form { display:flex; gap:14px; width:100%; max-width:560px; margin:0 auto; }
.sig-input {
  flex:1; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1);
  border-radius:10px; padding:14px 20px; color:#fff; font-family:'Inter',sans-serif;
  font-size:1rem; outline:none; transition:border-color 0.3s,box-shadow 0.3s;
}
.sig-input:focus { border-color:var(--holo-primary); box-shadow:0 0 15px rgba(0,194,255,0.2); }
.sig-sub {
  background:rgba(0,194,255,0.1); border:1px solid var(--holo-primary);
  color:var(--holo-primary); padding:0 28px; border-radius:10px;
  font-family:'Inter',sans-serif; font-weight:600; font-size:0.9rem;
  cursor:pointer; text-transform:uppercase; letter-spacing:0.05em; transition:all 0.3s;
}
.sig-sub:hover { background:var(--holo-primary); color:#000; box-shadow:0 0 15px rgba(0,194,255,0.4); }
.sig-sub:disabled { opacity:0.5; cursor:not-allowed; }
.ff { margin-top:14px; font-size:0.95rem; font-family:'Inter',sans-serif; color:var(--holo-primary); animation:fi 0.5s ease; }
@keyframes fi{from{opacity:0}to{opacity:1}}

/* ── Satellites ── */
.sat-block { display:flex; gap:100px; justify-content:center; align-items:center; margin:60px auto; }
.sat-link { color:rgba(255,255,255,0.4); transition:all 0.3s cubic-bezier(0.25,0.8,0.25,1); display:flex; }
.sat-link:hover { color:var(--holo-primary); transform:scale(1.15) translateY(-2px); filter:drop-shadow(0 0 8px var(--holo-primary)); }
.sat-icon { width:48px; height:48px; stroke-width:1.5; }

/* ── Footer ── */
.foot-block { margin-top:60px; text-align:center; display:flex; flex-direction:column; align-items:center; gap:28px; opacity:0.8; }
.foot-text { font-family:'Inter',sans-serif; font-weight:300; font-size:1rem; letter-spacing:0.05em; color:rgba(255,255,255,0.6); margin:0; }
.foot-btn {
  display:flex; align-items:center; gap:14px; padding:14px 32px;
  border:1px solid rgba(0,194,255,0.3); border-radius:50px;
  background:rgba(0,0,0,0.3); color:var(--holo-primary); text-decoration:none;
  transition:all 0.3s ease; text-transform:uppercase; font-family:'Inter',sans-serif;
  font-size:0.9rem; letter-spacing:0.1em; font-weight:600; cursor:pointer; outline:none;
}
.foot-btn:hover { border-color:var(--holo-primary); box-shadow:0 0 20px rgba(0,194,255,0.4); background:rgba(0,194,255,0.05); color:#fff; }

/* ── Afinaciones Modal (Desktop Console) ── */
.afin-ov {
  position:fixed; inset:0; z-index:99998;
  background:rgba(0,0,0,0.75); backdrop-filter:blur(12px);
  display:flex; align-items:center; justify-content:center;
}
.afin-sh {
  width:92%; max-width:780px; max-height:88vh;
  background:
    radial-gradient(ellipse at 50% -10%, rgba(0,194,255,0.06), transparent 50%),
    linear-gradient(180deg, rgba(8,14,28,0.98) 0%, rgba(4,8,18,0.99) 100%);
  border-radius:28px;
  border:1px solid rgba(0,194,255,0.2);
  border-top:1px solid rgba(255,255,255,0.08);
  display:flex; flex-direction:column; overflow:hidden;
  box-shadow:
    0 40px 100px rgba(0,0,0,0.7),
    0 0 60px rgba(0,194,255,0.08),
    inset 0 0 40px rgba(0,194,255,0.03);
  backdrop-filter:blur(24px);
}
.afin-hd {
  flex-shrink:0; padding:36px 40px 20px;
  display:flex; justify-content:center; align-items:center;
  position:relative;
  border-bottom:1px solid rgba(0,194,255,0.08);
}
.afin-ti {
  font-family:'Inter',sans-serif; font-size:1.2rem; font-weight:500;
  color:var(--holo-primary); text-transform:uppercase; letter-spacing:0.25em;
  text-shadow:0 0 15px rgba(0,194,255,0.4);
}
.afin-x {
  position:absolute; right:28px; width:36px; height:36px; border-radius:50%;
  border:1px solid rgba(0,194,255,0.2); background:rgba(255,255,255,0.04);
  color:rgba(255,255,255,0.7); cursor:pointer; display:flex;
  align-items:center; justify-content:center; outline:none; padding:0;
  transition:all 0.25s ease;
}
.afin-x:hover { background:rgba(255,255,255,0.12); color:#fff; border-color:rgba(0,194,255,0.4); box-shadow:0 0 12px rgba(0,194,255,0.2); }
.afin-bd {
  flex:1; overflow-y:auto; display:flex; flex-direction:column;
  align-items:center; gap:24px; padding:32px 48px 40px;
  scrollbar-width:none;
}
.afin-bd::-webkit-scrollbar { display:none; }
.afin-desc {
  font-family:'Inter',sans-serif; font-size:1.05rem; font-weight:300;
  color:#fff; opacity:0.6; text-align:center; line-height:1.8;
  margin:0; white-space:pre-line; width:100%; max-width:600px;
}
.afin-ta {
  width:100%; min-height:180px; padding:22px 24px; border-radius:18px;
  border:1px solid rgba(0,194,255,0.12);
  background:rgba(5,10,20,0.5); color:#fff; outline:none;
  font-family:'Inter',sans-serif; font-size:1rem; line-height:1.7;
  resize:vertical; transition:border-color 0.3s,box-shadow 0.3s;
}
.afin-ta::placeholder { color:rgba(255,255,255,0.25); }
.afin-ta:focus {
  border-color:rgba(0,194,255,0.5);
  box-shadow:0 0 25px rgba(0,194,255,0.2), inset 0 0 10px rgba(0,194,255,0.05);
}
.afin-sub {
  width:100%; padding:18px; border-radius:16px;
  border:1px solid rgba(0,194,255,0.1); background:transparent;
  color:rgba(0,194,255,0.25); font-family:'Inter',sans-serif; font-size:0.95rem;
  font-weight:600; letter-spacing:0.12em; text-transform:uppercase;
  cursor:default; outline:none; transition:all 0.3s;
}
.afin-sub.hm {
  border-color:rgba(0,194,255,0.5); color:var(--holo-primary);
  background:linear-gradient(135deg,rgba(0,194,255,0.1),transparent);
  cursor:pointer;
  box-shadow:0 0 20px rgba(0,194,255,0.15), inset 0 1px 0 rgba(255,255,255,0.05);
}
.afin-sub.hm:hover {
  background:var(--holo-primary); color:#000;
  box-shadow:0 0 30px rgba(0,194,255,0.4);
}
.afin-sub.ok { border-color:rgba(100,255,150,0.4); background:rgba(100,255,150,0.08); color:rgba(100,255,150,0.9); cursor:default; }
`

/* ═══════ UTILS ═══════ */
const hexToRgba = (hex?: string, a = 1) => {
    if (!hex || typeof hex !== "string") return `rgba(0,194,255,${a})`
    const c = hex.replace("#", "")
    const f =
        c.length === 3
            ? c
                  .split("")
                  .map((x) => x + x)
                  .join("")
            : c
    const n = parseInt(f, 16)
    if (isNaN(n)) return `rgba(0,194,255,${a})`
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
const nl = (s: string) => (s || "").replace(/\\n/g, "\n")
const renderDesc = (t: string) =>
    t.split("\\n").map((l, i) => (
        <React.Fragment key={i}>
            {l}
            {i < t.split("\\n").length - 1 && <br />}
        </React.Fragment>
    ))

function useInjectCss(onReady?: () => void) {
    useLayoutEffect(() => {
        if (typeof document === "undefined") return
        const fId = "q-font"
        if (!document.getElementById(fId)) {
            const lnk = document.createElement("link")
            lnk.id = fId
            lnk.rel = "stylesheet"
            lnk.href =
                "https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&display=swap"
            document.head.appendChild(lnk)
        }
        const cId = "q-css-v2"
        let el = document.getElementById(cId) as HTMLStyleElement | null
        if (!el) {
            el = document.createElement("style")
            el.id = cId
            el.textContent = HOLO_CSS
            document.head.appendChild(el)
        } else if (el.dataset.h !== String(HOLO_CSS.length))
            el.textContent = HOLO_CSS
        el.dataset.h = String(HOLO_CSS.length)
        onReady?.()
    }, [])
}

function computeColorVars(ac: string) {
    const ok =
        typeof CSS !== "undefined" &&
        CSS.supports?.("color", "color-mix(in srgb, red, blue)")
    if (ok)
        return {
            secondary: `color-mix(in srgb,${ac},white 35%)`,
            glow: `color-mix(in srgb,${ac},transparent 75%)`,
            orbitStroke: `color-mix(in srgb,${ac},transparent 55%)`,
        }
    if (ac === "#00C2FF")
        return {
            secondary: "#4dd6ff",
            glow: "rgba(0,194,255,0.25)",
            orbitStroke: "rgba(0,194,255,0.45)",
        }
    return { secondary: ac, glow: ac, orbitStroke: ac }
}

/* ═══════ ANIMATION VARIANTS ═══════ */
const containerV = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { delayChildren: 0.4, staggerChildren: 0.2 },
    },
}
const titleV = {
    hidden: { opacity: 0, y: -30, filter: "blur(10px)" },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] },
    },
}
const sysV = {
    hidden: { opacity: 0, scale: 0.85, filter: "blur(5px)" },
    visible: {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        transition: { duration: 1.5, ease: "easeOut" },
    },
}
const epicR = {
    hidden: { opacity: 0, y: 60, filter: "blur(20px)" },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: 1.4, ease: [0.22, 1, 0.36, 1] },
    },
}
const cardV = {
    hidden: { opacity: 0, scale: 0.92, filter: "blur(8px)" },
    visible: {
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        transition: { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] },
    },
    exit: {
        opacity: 0,
        scale: 0.92,
        filter: "blur(6px)",
        transition: { duration: 0.25, ease: "easeIn" },
    },
}

/* ═══════ STARS ═══════ */
type Star = {
    id: number
    sz: number
    tx: number
    ty: number
    dur: number
    dl: number
}
const StarsBackground: React.FC<{
    count: number
    comets: number
    speed: number
}> = React.memo(({ count, comets, speed }) => {
    const stars = useMemo(() => {
        const a: Star[] = []
        const t = Math.floor(count * 1.5)
        for (let i = 0; i < t; i++)
            a.push({
                id: i,
                sz:
                    Math.random() > 0.8
                        ? Math.random() * 2 + 1
                        : Math.random() * 1.5 + 0.5,
                tx: (Math.random() - 0.5) * 250,
                ty: (Math.random() - 0.5) * 250,
                dur: 1.5 + Math.random() * 4,
                dl: Math.random() * 5,
            })
        return a
    }, [count])
    const cRefs = useRef<HTMLDivElement[]>([])
    const setupC = (el: HTMLDivElement | null) => {
        if (!el) return
        const w = window?.innerWidth ?? 1440,
            h = window?.innerHeight ?? 900
        const edge = Math.floor(Math.random() * 4)
        let x = 0,
            y = 0,
            ang = 0
        if (edge === 0) {
            x = Math.random() * w
            y = -40
            ang = 90 + (Math.random() * 60 - 30)
        } else if (edge === 1) {
            x = w + 40
            y = Math.random() * h
            ang = 180 + (Math.random() * 60 - 30)
        } else if (edge === 2) {
            x = Math.random() * w
            y = h + 40
            ang = -90 + (Math.random() * 60 - 30)
        } else {
            x = -40
            y = Math.random() * h
            ang = Math.random() * 60 - 30
        }
        const rad = (ang * Math.PI) / 180,
            travel = Math.sqrt(w * w + h * h) * 1.2
        el.style.setProperty("--x", `${x}px`)
        el.style.setProperty("--y", `${y}px`)
        el.style.setProperty("--dx", `${Math.cos(rad) * travel}px`)
        el.style.setProperty("--dy", `${Math.sin(rad) * travel}px`)
        el.style.setProperty("--rot", `${ang}deg`)
        el.style.setProperty("--dur", `${6 + Math.random() * 8}s`)
        el.style.setProperty("--delay", `${Math.random() * 6}s`)
        el.style.animation = "none"
        void el.offsetWidth
        el.style.animation = `comet-move var(--dur) linear var(--delay) 1 both`
    }
    useEffect(() => {
        cRefs.current = cRefs.current.slice(0, comets)
    }, [comets])
    useEffect(() => {
        cRefs.current.forEach((el) => el && setupC(el))
    }, [comets])
    return (
        <div className="sf-wrap">
            {stars.map((s) => (
                <div
                    key={s.id}
                    className="sf-s"
                    style={
                        {
                            ["--sz" as any]: `${s.sz}px`,
                            ["--tx" as any]: `${s.tx}vw`,
                            ["--ty" as any]: `${s.ty}vh`,
                            ["--dur" as any]: `${s.dur / speed}s`,
                            ["--dl" as any]: `${s.dl}s`,
                        } as React.CSSProperties
                    }
                />
            ))}
            {Array.from({ length: comets }).map((_, i) => (
                <div
                    key={`c${i}`}
                    className="comet"
                    ref={(el) => {
                        if (el) cRefs.current[i] = el
                    }}
                    onAnimationEnd={(e) =>
                        setupC(e.currentTarget as HTMLDivElement)
                    }
                />
            ))}
        </div>
    )
})
StarsBackground.displayName = "StarsBackground"

/* ═══════ SHAPE SVGs (Planet Icons) ═══════ */
const TesseractSVG = () => (
    <svg
        className="sh"
        viewBox="0 0 100 100"
        style={{ animation: "sw-t 6s ease-in-out infinite alternate" }}
    >
        <path d="M22,36 L62,36 L62,76 L22,76 Z" className="lc" />
        <path d="M34,26 L74,26 L74,66 L34,66 Z" className="lc ld" />
        <path
            d="M33,47 L51,47 L51,65 L33,65 Z"
            className="lc"
            style={{ strokeWidth: 2 }}
        />
        <path
            d="M22,36 L33,47 M62,36 L51,47 M22,76 L33,65 M62,76 L51,65"
            className="lc"
        />
    </svg>
)
const MerkabaSVG = () => (
    <svg
        className="sh"
        viewBox="0 0 100 100"
        style={{ animation: "spin-s 12s linear infinite" }}
    >
        <g
            style={{
                transformOrigin: "50% 50%",
                animation: "flt-y 4s ease-in-out infinite",
            }}
        >
            <path d="M20,30 L80,30 L50,82 Z" className="lc" />
            <path
                d="M20,30 L50,55 M80,30 L50,55 M50,82 L50,55"
                className="lc ld"
            />
            <path d="M20,70 L80,70 L50,18 Z" className="lc" />
            <path
                d="M20,70 L50,45 M80,70 L50,45 M50,18 L50,45"
                className="lc ld"
            />
            <circle
                cx="50"
                cy="50"
                r="4"
                fill="var(--holo-primary)"
                style={{ filter: "blur(2px)" }}
            />
        </g>
    </svg>
)
const GyroscopeSVG = () => (
    <svg className="sh" viewBox="0 0 100 100">
        <ellipse
            cx="50"
            cy="50"
            rx="45"
            ry="45"
            className="lc"
            style={{
                transformOrigin: "50% 50%",
                animation: "spin-s 8s linear infinite",
            }}
            strokeDasharray="4 4"
        />
        <ellipse
            cx="50"
            cy="50"
            rx="35"
            ry="12"
            className="lc"
            style={{
                transformOrigin: "50% 50%",
                animation: "spin-r 6s linear infinite",
            }}
        />
        <ellipse
            cx="50"
            cy="50"
            rx="12"
            ry="25"
            className="lc"
            style={{
                transformOrigin: "50% 50%",
                animation: "spin-s 5s linear infinite",
            }}
        />
        <circle
            cx="50"
            cy="50"
            r="6"
            fill="var(--holo-primary)"
            style={{ animation: "pls-s 2s ease-in-out infinite" }}
        />
    </svg>
)
const TorusSVG = () => (
    <svg
        className="sh"
        viewBox="0 0 100 100"
        style={{ animation: "spin-s 20s linear infinite" }}
    >
        <g style={{ opacity: 0.8 }}>
            {[0, 30, 60, 90, 120, 150].map((d) => (
                <ellipse
                    key={d}
                    cx="50"
                    cy="50"
                    rx="40"
                    ry="12"
                    className="lc"
                    style={{
                        transformOrigin: "50% 50%",
                        transform: `rotate(${d}deg)`,
                    }}
                />
            ))}
        </g>
        <circle
            cx="50"
            cy="50"
            r="8"
            stroke="var(--holo-primary)"
            strokeWidth="1"
            fill="none"
        />
    </svg>
)
const CrystalSVG = () => (
    <svg
        className="sh"
        viewBox="0 0 100 100"
        style={{ animation: "flt-y 6s ease-in-out infinite" }}
    >
        <g
            style={{
                transformOrigin: "50% 50%",
                animation: "spin-r 15s linear infinite",
            }}
        >
            <path
                d="M50,10 L85,30 L85,70 L50,90 L15,70 L15,30 Z"
                className="lc"
                strokeWidth="1.8"
            />
            <path
                d="M50,10 L50,50 M85,30 L50,50 M85,70 L50,50 M50,90 L50,50 M15,70 L50,50 M15,30 L50,50"
                className="lc ld"
            />
        </g>
    </svg>
)

/* Small card icon versions */
const CardIcon: React.FC<{ id: string }> = ({ id }) => {
    switch (id) {
        case "simuladores":
            return <TesseractSVG />
        case "codices":
            return <MerkabaSVG />
        case "sesiones":
            return <GyroscopeSVG />
        case "meditaciones":
            return <TorusSVG />
        case "fragmentos":
            return <CrystalSVG />
        default:
            return <div />
    }
}

/* ═══════ SOCIAL ICONS ═══════ */
const IconSpotify = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="sat-icon"
    >
        <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
        <path
            d="M8 12c2.5-1.5 6.5-1.5 9 0"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        <path
            d="M7 15c3-2 8-2 11 0"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.8"
        />
        <path
            d="M9 9c2-1 5-1 7 0"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.6"
        />
    </svg>
)
const IconInstagram = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="sat-icon"
    >
        <rect x="3" y="3" width="18" height="18" rx="5" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="4" strokeWidth="1.5" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
)
const IconX = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="sat-icon"
    >
        <path
            d="M19.9962 4H17.1761L12.5361 9.352L8.49413 4H2.68213L9.62612 13.126L3.05412 20.636H5.87612L10.9641 14.824L15.4081 20.636H21.0821L13.8321 11.048L19.9962 4Z"
            strokeWidth="1.5"
            strokeLinejoin="round"
        />
        <path d="M6.5 5.5 L17.5 19" strokeWidth="1.2" strokeLinecap="butt" />
    </svg>
)
const IconAntenna = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        style={{ width: 20, height: 20 }}
    >
        <path d="M12 22V12" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 12L8 8" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 12L16 8" strokeWidth="1.5" strokeLinecap="round" />
        <path
            d="M4 10C4 10 7 14 12 14C17 14 20 10 20 10"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
        <circle cx="12" cy="5" r="2" strokeWidth="1.5" />
    </svg>
)

/* ═══════ AFINACIONES MODAL ═══════ */
const AfinacionesModal: React.FC<{
    title: string
    text: string
    webhookUrl: string
    onClose: () => void
}> = ({ title, text, webhookUrl, onClose }) => {
    const [msg, setMsg] = useState("")
    const [st, setSt] = useState<"idle" | "loading" | "success" | "error">(
        "idle"
    )
    const hm = msg.trim().length > 0
    useEffect(() => {
        const f = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", f)
        return () => window.removeEventListener("keydown", f)
    }, [onClose])
    const sub = async () => {
        if (!msg.trim() || !webhookUrl) {
            if (!webhookUrl) setSt("error")
            return
        }
        setSt("loading")
        try {
            const r = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mensaje: msg,
                    source: "redsolarviva_afinaciones",
                    fecha: new Date().toISOString(),
                }),
            })
            if (r.ok) {
                setSt("success")
                setMsg("")
            } else setSt("error")
        } catch {
            setSt("error")
        }
    }
    return (
        <motion.div
            className="afin-ov"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="afin-sh"
                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 40 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="afin-hd">
                    <span className="afin-ti">{title}</span>
                    <button className="afin-x" onClick={onClose}>
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 14 14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        >
                            <line x1="1" y1="1" x2="13" y2="13" />
                            <line x1="13" y1="1" x2="1" y2="13" />
                        </svg>
                    </button>
                </div>
                <div className="afin-bd">
                    <p className="afin-desc">{nl(text)}</p>
                    <div className="sep-sm" />
                    <textarea
                        className="afin-ta"
                        value={msg}
                        onChange={(e) => setMsg(e.target.value)}
                        disabled={st === "loading" || st === "success"}
                        placeholder="Escribe aquí tu propuesta de afinación…"
                        onKeyDown={(e) => {
                            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                                e.preventDefault()
                                sub()
                            }
                        }}
                    />
                    <button
                        className={`afin-sub ${hm ? "hm" : ""} ${st === "success" ? "ok" : ""}`}
                        onClick={sub}
                        disabled={st === "loading" || st === "success" || !hm}
                    >
                        {st === "loading"
                            ? "..."
                            : st === "success"
                              ? "✓ ENVIADO"
                              : "ENVIAR"}
                    </button>
                    {st === "success" && (
                        <p className="ff">
                            Señal recibida. Gracias por co-crear.
                        </p>
                    )}
                    {st === "error" && (
                        <p className="ff" style={{ color: "#ff4d4d" }}>
                            Error en la señal. Intenta de nuevo.
                        </p>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}

/* ═══════ SCROLL DOTS ═══════ */
const ScrollDots = () => (
    <motion.div
        className="scroll-dots-wrap"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.5 } }}
        transition={{ duration: 1, delay: 1.0 }}
    >
        {[0, 1, 2].map((i) => (
            <motion.div
                key={i}
                className="scroll-dot"
                custom={i}
                animate={(idx: number) => ({
                    opacity: [0.1, 1, 0.1],
                    transition: {
                        delay: idx * 0.4,
                        repeat: Infinity,
                        duration: 3,
                        ease: "easeInOut",
                    },
                })}
            />
        ))}
    </motion.div>
)

/* ═══════ FLOATING GLASSMORPHISM CARD ═══════ */
const FloatingCard: React.FC<{
    planet: PlanetConfig
    x: number
    y: number
    onClose: () => void
}> = ({ planet, x, y, onClose }) => {
    const cardW = 380,
        cardH = 340
    const vw = typeof window !== "undefined" ? window.innerWidth : 1440
    const vh = typeof window !== "undefined" ? window.innerHeight : 900
    const centerX = vw / 2,
        centerY = vh / 2

    /* Determine which side of the screen the node is on, push card to the OUTER edge */
    const nodeIsLeft = x < centerX
    let left: number, top: number

    if (nodeIsLeft) {
        /* Node is on left half → card goes to far left */
        left = Math.max(20, x - cardW - 40)
    } else {
        /* Node is on right half → card goes to far right */
        left = Math.min(vw - cardW - 20, x + 40)
    }

    /* Vertical: center on node but clamp to viewport */
    top = Math.max(80, Math.min(y - cardH / 2, vh - cardH - 20))

    /* Final safety: if card would overlap the center zone (toroide), push further out */
    const cardRight = left + cardW,
        cardCenterX = left + cardW / 2
    const deadZoneL = centerX - 180,
        deadZoneR = centerX + 180
    if (cardCenterX > deadZoneL && cardCenterX < deadZoneR) {
        if (nodeIsLeft) left = deadZoneL - cardW - 10
        else left = deadZoneR + 10
    }
    left = Math.max(20, Math.min(left, vw - cardW - 20))

    return (
        <motion.div
            className="holo-float-card"
            variants={cardV}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ left, top, position: "fixed" }}
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={onClose}
        >
            <div className="hfc-icon">
                <div
                    className="sh-wrap"
                    style={{ position: "relative", width: 52, height: 52 }}
                >
                    <CardIcon id={planet.id} />
                </div>
            </div>
            <h4 className="hfc-title">{planet.panelTitle}</h4>
            <p
                className="hfc-desc"
                dangerouslySetInnerHTML={{
                    __html: planet.desc
                        .replace(/\\n/g, "\n")
                        .replace(/\n/g, "<br/>"),
                }}
            />
            <a
                className="hfc-btn"
                href={planet.link}
                target={planet.targetBlank ? "_blank" : "_self"}
                rel="noopener noreferrer"
            >
                Ir al nodo →
            </a>
        </motion.div>
    )
}

/* ═══════ EARTH SECTION ═══════ */
const EarthSection: React.FC<{
    webhookUrl?: string
    manifestoShort: string
    manifestoLong: string
    guiaImage?: string
    guiaNombre: string
    guiaDescShort: string
    guiaDescLong: string
    guiaCtaText: string
    afinacionesTitle: string
    afinacionesText: string
    afinacionesWebhookUrl: string
}> = ({
    webhookUrl,
    manifestoShort,
    manifestoLong,
    guiaImage,
    guiaNombre,
    guiaDescShort,
    guiaDescLong,
    guiaCtaText,
    afinacionesTitle,
    afinacionesText,
    afinacionesWebhookUrl,
}) => {
    const [email, setEmail] = useState("")
    const [es, setEs] = useState<"idle" | "loading" | "success" | "error">(
        "idle"
    )
    const [me, setMe] = useState(false)
    const [ge, setGe] = useState(false)
    const [sa, setSa] = useState(false)
    const subEmail = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!webhookUrl) {
            setEs("error")
            return
        }
        setEs("loading")
        try {
            const r = await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, source: "redsolarviva_landing" }),
            })
            if (r.ok) {
                setEs("success")
                setEmail("")
            } else setEs("error")
        } catch {
            setEs("error")
        }
    }
    return (
        <div className="qr-earth">
            <AnimatePresence>
                {sa && (
                    <AfinacionesModal
                        title={afinacionesTitle}
                        text={afinacionesText}
                        webhookUrl={afinacionesWebhookUrl}
                        onClose={() => setSa(false)}
                    />
                )}
            </AnimatePresence>

            {/* MANIFESTO */}
            <motion.div
                className="man-block"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
            >
                <motion.div
                    variants={epicR}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <div className="sep-sm" style={{ marginBottom: 30 }} />
                    <p className="man-text">{nl(manifestoShort)}</p>
                    <AnimatePresence>
                        {me && (
                            <motion.p
                                className="man-text"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{
                                    duration: 0.5,
                                    ease: "easeInOut",
                                }}
                                style={{ overflow: "hidden", marginTop: 16 }}
                            >
                                {nl(manifestoLong)}
                            </motion.p>
                        )}
                    </AnimatePresence>
                    {!me ? (
                        <button className="rm-btn" onClick={() => setMe(true)}>
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            >
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            LEER MÁS
                        </button>
                    ) : (
                        <button
                            className="hide-btn"
                            style={{ marginTop: 20 }}
                            onClick={() => setMe(false)}
                        >
                            OCULTAR
                        </button>
                    )}
                </motion.div>
            </motion.div>

            <div className="sep" />

            {/* GUÍA */}
            <motion.div
                className="guia-sec"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: "easeOut" }}
            >
                <div className="sep-sm" style={{ marginBottom: 10 }} />
                {guiaImage && (
                    <div className="guia-img">
                        <img src={guiaImage} alt={guiaNombre} />
                    </div>
                )}
                <span className="gt" style={{ fontSize: "1.5rem" }}>
                    {guiaNombre}
                </span>
                <p className="guia-desc">{guiaDescShort}</p>
                <AnimatePresence>
                    {ge && (
                        <motion.p
                            className="guia-desc"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            style={{ overflow: "hidden" }}
                        >
                            {nl(guiaDescLong)}
                        </motion.p>
                    )}
                </AnimatePresence>
                {!ge ? (
                    <button className="gold-btn" onClick={() => setGe(true)}>
                        <span className="shim" />
                        <span style={{ position: "relative", zIndex: 1 }}>
                            {guiaCtaText}
                        </span>
                    </button>
                ) : (
                    <button className="hide-btn" onClick={() => setGe(false)}>
                        OCULTAR
                    </button>
                )}
            </motion.div>

            <div className="sep" />

            {/* NEWSLETTER */}
            <motion.div
                className="sig-block"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={epicR}
            >
                <div className="sig-content">
                    <h4 className="sig-title">ÚNETE AL NODO CENTRAL</h4>
                    <p className="sig-desc">
                        Recibe las transmisiones de Red Solar Viva, avisos de
                        nuevos lanzamientos y actualizaciones significativas.
                    </p>
                    <form className="sig-form" onSubmit={subEmail}>
                        <input
                            type="email"
                            placeholder="Tu frecuencia (email)..."
                            className="sig-input"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={es === "loading" || es === "success"}
                        />
                        <button
                            type="submit"
                            className="sig-sub"
                            disabled={es === "loading" || es === "success"}
                        >
                            {es === "loading"
                                ? "..."
                                : es === "success"
                                  ? "✓"
                                  : "CONECTAR"}
                        </button>
                    </form>
                    {es === "success" && (
                        <div className="ff">
                            Enlace establecido. Bienvenido al nodo.
                        </div>
                    )}
                    {es === "error" && (
                        <div className="ff" style={{ color: "#ff4d4d" }}>
                            Error en la señal. Intenta de nuevo.
                        </div>
                    )}
                </div>
            </motion.div>

            <div className="sep" />

            {/* SOCIAL */}
            <motion.div
                className="sat-block"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
            >
                <a
                    href="https://open.spotify.com/artist/6BSsXgmAnoie8tUgLtIbqb?si=Yal8ZrynSxeT4lRLJd1mwA"
                    target="_blank"
                    rel="noreferrer"
                    className="sat-link"
                >
                    <IconSpotify />
                </a>
                <a
                    href="https://x.com/ZakHaarSol"
                    target="_blank"
                    rel="noreferrer"
                    className="sat-link"
                >
                    <IconX />
                </a>
                <a
                    href="https://www.instagram.com/zakhaarsol/#"
                    target="_blank"
                    rel="noreferrer"
                    className="sat-link"
                >
                    <IconInstagram />
                </a>
            </motion.div>

            <div className="sep" />

            {/* FOOTER */}
            <motion.div
                className="foot-block"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <p className="foot-text">
                    Red Solar Viva es un organismo vivo que evoluciona contigo:
                </p>
                <button className="foot-btn" onClick={() => setSa(true)}>
                    <IconAntenna />
                    Enviar Señal de Ajuste
                </button>
            </motion.div>
        </div>
    )
}

/* ═══════ TYPES ═══════ */
type PlanetConfig = {
    id: string
    size: number
    title: string
    panelTitle: string
    desc: string
    link: string
    targetBlank: boolean
    orbitDuration: number
    labelOffset: number
}

type Props = {
    webhookUrl?: string
    navbarOffset?: number
    planetGlow?: number
    orbitSpeed?: number
    orbitPulseSpeed?: number
    orbitTilt?: number
    reticleSize?: number
    reticleGlow?: number
    warpSpeed?: number
    heroTitleText?: string
    heroSubtitleText?: string
    heroTagline?: string
    subtitleOffsetY?: number
    consoleWidth?: number
    titleSize?: number
    accentColor?: string
    bgColor?: string
    textColor?: string
    numStars?: number
    numComets?: number
    titleOffsetY?: number
    systemOffsetY?: number
    systemOffsetX?: number
    toroideImage?: string
    toroideSize?: number
    manifestoShort?: string
    manifestoLong?: string
    guiaImage?: string
    guiaNombre?: string
    guiaDescShort?: string
    guiaDescLong?: string
    guiaCtaText?: string
    afinacionesTitle?: string
    afinacionesText?: string
    afinacionesWebhookUrl?: string
    p1_Size: number
    p1_Title: string
    p1_PanelTitle: string
    p1_Desc: string
    p1_Link: string
    p1_TargetBlank: boolean
    p1_OrbitDuration: number
    p1_LabelOffset: number
    p2_Size: number
    p2_Title: string
    p2_PanelTitle: string
    p2_Desc: string
    p2_Link: string
    p2_TargetBlank: boolean
    p2_OrbitDuration: number
    p2_LabelOffset: number
    p3_Size: number
    p3_Title: string
    p3_PanelTitle: string
    p3_Desc: string
    p3_Link: string
    p3_TargetBlank: boolean
    p3_OrbitDuration: number
    p3_LabelOffset: number
    p4_Size: number
    p4_Title: string
    p4_PanelTitle: string
    p4_Desc: string
    p4_Link: string
    p4_TargetBlank: boolean
    p4_OrbitDuration: number
    p4_LabelOffset: number
    p5_Size: number
    p5_Title: string
    p5_PanelTitle: string
    p5_Desc: string
    p5_Link: string
    p5_TargetBlank: boolean
    p5_OrbitDuration: number
    p5_LabelOffset: number
}

/* ═══════ MAIN ═══════ */
export function SolarSystem(props: Props) {
    const cssReady = useRef(false)
    useInjectCss(() => {
        cssReady.current = true
    })

    const {
        webhookUrl,
        navbarOffset = 72,
        planetGlow = 0.8,
        orbitSpeed = 12,
        orbitPulseSpeed = 1.0,
        orbitTilt = 0.35,
        reticleSize = 64,
        reticleGlow = 0.6,
        warpSpeed = 1.0,
        heroTitleText = "RED SOLAR VIVA",
        heroSubtitleText = "TEMPLO SOLAR 5D",
        heroTagline = "Biblioteca de la Nueva Tierra",
        subtitleOffsetY = 12,
        consoleWidth = 800,
        titleSize = 72,
        accentColor = "#00C2FF",
        bgColor = "#000000",
        textColor = "#E6F7EF",
        numStars = 150,
        numComets = 2,
        titleOffsetY = 48,
        systemOffsetY = 48,
        systemOffsetX = 0,
        toroideImage,
        toroideSize = 280,
        manifestoShort = "La vieja estructura se disuelve.\nPara navegar el colapso y construir lo nuevo, no necesitas suerte; necesitas Instrucción.",
        manifestoLong = "Hemos abierto los Códices de Luz: la biblioteca con los códigos para reactivar tu biología, potenciar tu mente y recordar tu diseño original.\n\nRed Solar Viva no es solo información. Es un campo vivo de activación.",
        guiaImage,
        guiaNombre = "Zak'Haar Solar",
        guiaDescShort = "Guía de la Cámara Solar y portador de los Códices de Luz.",
        guiaDescLong = "Zak'Haar canaliza instrucción directa desde el campo solar. Su trabajo integra biología, frecuencia y memoria estelar para devolverte al centro de tu diseño original.",
        guiaCtaText = "Conocer al Guía",
        afinacionesTitle = "AFINACIONES",
        afinacionesText = "¿Hay algo que te gustaría que agregáramos o afináramos aquí? Tu mirada es parte del pulso solar.\\n\\nSi sientes una idea, una mejora o una nueva función que podría expandir el campo de Red Solar Viva, compártela: cada sugerencia ayuda a que Red Solar Viva siga evolucionando como un espacio vivo de co-creación.\\n\\nEscribe tu propuesta aquí abajo y la meditaremos.\\n\\n¡Gracias por co-crear este espacio solar!",
        afinacionesWebhookUrl = "",
        p1_Size,
        p1_Title,
        p1_PanelTitle,
        p1_Desc,
        p1_Link,
        p1_TargetBlank,
        p1_OrbitDuration,
        p1_LabelOffset,
        p2_Size,
        p2_Title,
        p2_PanelTitle,
        p2_Desc,
        p2_Link,
        p2_TargetBlank,
        p2_OrbitDuration,
        p2_LabelOffset,
        p3_Size,
        p3_Title,
        p3_PanelTitle,
        p3_Desc,
        p3_Link,
        p3_TargetBlank,
        p3_OrbitDuration,
        p3_LabelOffset,
        p4_Size,
        p4_Title,
        p4_PanelTitle,
        p4_Desc,
        p4_Link,
        p4_TargetBlank,
        p4_OrbitDuration,
        p4_LabelOffset,
        p5_Size,
        p5_Title,
        p5_PanelTitle,
        p5_Desc,
        p5_Link,
        p5_TargetBlank,
        p5_OrbitDuration,
        p5_LabelOffset,
    } = props

    useEffect(() => {
        if (typeof document !== "undefined") {
            document.documentElement.style.backgroundColor = bgColor
            document.body.style.backgroundColor = bgColor
            document.body.style.margin = "0"
        }
    }, [bgColor])

    const [isReady, setIsReady] = useState(false)
    useEffect(() => {
        let c = false
        const chk = () => {
            if (c) return
            if (cssReady.current)
                requestAnimationFrame(() =>
                    requestAnimationFrame(() =>
                        requestAnimationFrame(() => {
                            if (!c) setIsReady(true)
                        })
                    )
                )
            else requestAnimationFrame(chk)
        }
        requestAnimationFrame(chk)
        return () => {
            c = true
        }
    }, [])

    const [hoveredId, setHoveredId] = useState<string | null>(null)
    const [activePlanet, setActivePlanet] = useState<PlanetConfig | null>(null)
    const [cardPos, setCardPos] = useState({ x: 0, y: 0 })
    const cooldown = useRef(0)
    const rootRef = useRef<HTMLDivElement>(null)
    const [section, setSection] = useState<"space" | "earth">("space")
    const scrolling = useRef(false)
    const scrollT = useRef<any>(null)

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        scrolling.current = true
        if (scrollT.current) clearTimeout(scrollT.current)
        scrollT.current = setTimeout(() => {
            scrolling.current = false
        }, 150)
        const st = e.currentTarget.scrollTop
        /* Dismiss floating card smoothly on any scroll */
        if (activePlanet) closeCard()
        if (st > 400 && section !== "earth") {
            setSection("earth")
            setActivePlanet(null)
        } else if (st <= 400 && section !== "space") setSection("space")
    }

    const planets: PlanetConfig[] = useMemo(
        () => [
            {
                id: "sesiones",
                size: p2_Size,
                title: p2_Title,
                panelTitle: p2_PanelTitle || p2_Title,
                desc: p2_Desc,
                link: p2_Link,
                targetBlank: p2_TargetBlank,
                orbitDuration: p2_OrbitDuration,
                labelOffset: p2_LabelOffset,
            },
            {
                id: "simuladores",
                size: p5_Size,
                title: p5_Title,
                panelTitle: p5_PanelTitle || p5_Title,
                desc: p5_Desc,
                link: p5_Link,
                targetBlank: p5_TargetBlank,
                orbitDuration: p5_OrbitDuration,
                labelOffset: p5_LabelOffset,
            },
            {
                id: "codices",
                size: p1_Size,
                title: p1_Title,
                panelTitle: p1_PanelTitle || p1_Title,
                desc: p1_Desc,
                link: p1_Link,
                targetBlank: p1_TargetBlank,
                orbitDuration: p1_OrbitDuration,
                labelOffset: p1_LabelOffset,
            },
            {
                id: "fragmentos",
                size: p3_Size,
                title: p3_Title,
                panelTitle: p3_PanelTitle || p3_Title,
                desc: p3_Desc,
                link: p3_Link,
                targetBlank: p3_TargetBlank,
                orbitDuration: p3_OrbitDuration,
                labelOffset: p3_LabelOffset,
            },
            {
                id: "meditaciones",
                size: p4_Size,
                title: p4_Title,
                panelTitle: p4_PanelTitle || p4_Title,
                desc: p4_Desc,
                link: p4_Link,
                targetBlank: p4_TargetBlank,
                orbitDuration: p4_OrbitDuration,
                labelOffset: p4_LabelOffset,
            },
        ],
        [
            p1_Size,
            p1_Title,
            p1_PanelTitle,
            p1_Desc,
            p1_Link,
            p1_TargetBlank,
            p1_OrbitDuration,
            p1_LabelOffset,
            p2_Size,
            p2_Title,
            p2_PanelTitle,
            p2_Desc,
            p2_Link,
            p2_TargetBlank,
            p2_OrbitDuration,
            p2_LabelOffset,
            p3_Size,
            p3_Title,
            p3_PanelTitle,
            p3_Desc,
            p3_Link,
            p3_TargetBlank,
            p3_OrbitDuration,
            p3_LabelOffset,
            p4_Size,
            p4_Title,
            p4_PanelTitle,
            p4_Desc,
            p4_Link,
            p4_TargetBlank,
            p4_OrbitDuration,
            p4_LabelOffset,
            p5_Size,
            p5_Title,
            p5_PanelTitle,
            p5_Desc,
            p5_Link,
            p5_TargetBlank,
            p5_OrbitDuration,
            p5_LabelOffset,
        ]
    )

    const areaRef = useRef<HTMLDivElement>(null)
    const [vb, setVb] = useState({ w: 1400, h: 800 })
    useEffect(() => {
        const el = areaRef.current
        if (!el) return
        const u = () => setVb({ w: el.clientWidth, h: el.clientHeight })
        u()
        const ro = new ResizeObserver(u)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const svgW = vb.w,
        svgH = vb.h
    const cx = svgW / 2,
        cy = svgH / 2
    const ry = (r: number) => r * orbitTilt
    /* Calculate 5 rings from toroide outward, then SKIP ring 0 (too close) */
    const allRingCount = 5
    const TOR_R = toroideSize / 2
    const innerR = TOR_R + 200
    const maxR = Math.min(svgW, svgH / orbitTilt) / 2 - 40
    const effectiveMax = Math.max(maxR, innerR + 400)
    const allSpacing = (effectiveMax - innerR) / Math.max(1, allRingCount - 1)
    const allRingR = Array.from(
        { length: allRingCount },
        (_, i) => innerR + i * allSpacing
    )
    /* Visible rings = indices 1-4 (skip 0) */
    const ringR = allRingR.slice(1)
    const ringCount = ringR.length

    /* Planets mapped to visible rings 0-3 */
    const ringMap: Record<string, number> = {
        sesiones: 0,
        simuladores: 1,
        codices: 2,
        fragmentos: 2,
        meditaciones: 3,
    }
    const phaseMap: Record<string, number> = {
        sesiones: 0.12,
        simuladores: 0.35,
        codices: 0.08,
        fragmentos: 0.58,
        meditaciones: 0.75,
    }
    const ePath = (rx: number, ryv: number) =>
        `M ${cx - rx},${cy} a ${rx},${ryv} 0 1,0 ${rx * 2},0 a ${rx},${ryv} 0 1,0 ${-rx * 2},0`

    const colorVars = useMemo(
        () => computeColorVars(accentColor),
        [accentColor]
    )

    const rootStyle: React.CSSProperties = {
        ["--holo-primary" as any]: accentColor,
        ["--holo-secondary" as any]: colorVars.secondary,
        ["--holo-glow" as any]: colorVars.glow,
        ["--orbit-stroke" as any]: colorVars.orbitStroke,
        ["--planet-glow" as any]: String(planetGlow),
        ["--ret-sz" as any]: `${reticleSize}px`,
        ["--ret-glow" as any]: String(reticleGlow),
        ["--navbar-offset" as any]: `${navbarOffset}px`,
        ["--title-offset" as any]: `${titleOffsetY}px`,
        ["--title-size-px" as any]: `${titleSize}px`,
        ["--tor-size" as any]: `${toroideSize}px`,
        color: textColor,
    }

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                closeCard()
                return
            }
            if (
                section === "space" &&
                (e.key === "ArrowRight" || e.key === "ArrowLeft")
            ) {
                e.preventDefault()
                const ci = activePlanet
                    ? planets.findIndex((p) => p.id === activePlanet.id)
                    : -1
                let ni =
                    ci === -1
                        ? 0
                        : e.key === "ArrowRight"
                          ? (ci + 1) % planets.length
                          : (ci - 1 + planets.length) % planets.length
                setActivePlanet(planets[ni])
                setHoveredId(planets[ni].id)
                /* Approximate position for keyboard nav */
                const vw = window.innerWidth,
                    vh = window.innerHeight
                setCardPos({ x: vw / 2 + 100, y: vh / 2 })
            }
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [activePlanet, planets, section])

    function closeCard() {
        setHoveredId(null)
        setActivePlanet(null)
        cooldown.current = Date.now() + 400
    }

    const [pulseIdx, setPulseIdx] = useState(0)
    const activeId = hoveredId ?? activePlanet?.id ?? null
    const activeRing = activeId ? (ringMap[activeId] ?? -1) : -1
    useEffect(() => {
        if (activeId) {
            setPulseIdx(-1)
            return
        }
        if (pulseIdx === -1) setPulseIdx(0)
        const t = setInterval(
            () =>
                setPulseIdx((p) =>
                    p >= ringCount - 1 || p === -1 ? 0 : p + 1
                ),
            orbitPulseSpeed * 1000
        )
        return () => clearInterval(t)
    }, [activeId, orbitPulseSpeed])

    return (
        <div
            className="qr"
            style={rootStyle}
            ref={rootRef}
            onScroll={handleScroll}
            onClick={() => {
                if (activePlanet) closeCard()
            }}
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isReady ? 1 : 0 }}
                transition={{ duration: 3, ease: "easeInOut" }}
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 0,
                    pointerEvents: "none",
                }}
            >
                <StarsBackground
                    count={numStars}
                    comets={numComets}
                    speed={warpSpeed}
                />
            </motion.div>

            <motion.div
                className="qr-stage"
                variants={containerV}
                initial="hidden"
                animate={isReady ? "visible" : "hidden"}
            >
                <motion.div
                    variants={titleV}
                    style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <h1 className="qr-title">{heroTitleText}</h1>
                        {heroSubtitleText && (
                            <p
                                className="qr-sub"
                                style={{ marginTop: subtitleOffsetY }}
                            >
                                {heroSubtitleText}
                            </p>
                        )}
                        {heroTagline && (
                            <p className="qr-tag">{nl(heroTagline)}</p>
                        )}
                    </div>
                </motion.div>

                <motion.div
                    ref={areaRef}
                    className={`qr-orbits ${activePlanet ? "is-paused" : ""}`}
                    variants={sysV}
                    style={{ x: systemOffsetX, y: systemOffsetY }}
                >
                    {/* TOROIDE */}
                    <div className="tor-wrap">
                        {toroideImage ? (
                            <img
                                src={toroideImage}
                                alt="RSV"
                                className="tor-img"
                            />
                        ) : (
                            <div
                                style={{
                                    width: toroideSize,
                                    height: toroideSize,
                                    borderRadius: "50%",
                                    background:
                                        "radial-gradient(circle at 55% 45%,#fff 8%,#ffd06b 30%,#ff9a2e 57%,#ff7a00 75%,transparent 76%)",
                                    boxShadow: `0 0 22px rgba(255,169,64,.95),0 0 70px rgba(255,136,0,.65),0 0 120px ${hexToRgba(accentColor, 0.4)}`,
                                    animation:
                                        "tor-pulse 5s ease-in-out infinite alternate",
                                }}
                            />
                        )}
                    </div>

                    {/* ORBITS */}
                    <svg
                        className="qr-orbits-svg"
                        viewBox={`0 0 ${svgW} ${svgH}`}
                        preserveAspectRatio="xMidYMid meet"
                    >
                        {ringR.map((r, i) => (
                            <path
                                key={`b${i}`}
                                className="orb-back"
                                d={ePath(r, ry(r))}
                            />
                        ))}
                        {ringR.map((r, i) => {
                            const inter = activeRing !== -1
                            const pulse = !inter && i <= pulseIdx
                            const on = inter ? activeRing === i : pulse
                            return (
                                <path
                                    key={`f${i}`}
                                    className={`orb-front ${on ? "is-active" : ""}`}
                                    d={ePath(r, ry(r))}
                                />
                            )
                        })}
                    </svg>

                    {/* PLANETS — counter-scale to stay upright against tilt */}
                    {planets.map((p) => {
                        const ring = ringMap[p.id] ?? 0
                        const r = ringR[ring]
                        const d = ePath(r, ry(r))
                        const phase = phaseMap[p.id] ?? 0
                        const dur = p.orbitDuration
                        const baseMult = 1.5
                        const extraMult = p.id === "simuladores" ? 1.2 : 1
                        const pSize = Math.round(p.size * baseMult * extraMult)
                        return (
                            <div
                                key={p.id}
                                className="onpath"
                                style={
                                    {
                                        offsetPath: `path('${d}')`,
                                        WebkitOffsetPath: `path('${d}')` as any,
                                        offsetRotate: "0deg",
                                        WebkitOffsetRotate: "0deg" as any,
                                        animation: `orbit-move ${dur}s linear infinite`,
                                        animationDelay: `-${phase * dur}s`,
                                        width: pSize,
                                        height: pSize,
                                    } as React.CSSProperties
                                }
                            >
                                <a
                                    href={p.link}
                                    target={p.targetBlank ? "_blank" : "_self"}
                                    rel="noopener noreferrer"
                                    onMouseEnter={(e) => {
                                        if (
                                            scrolling.current ||
                                            section === "earth"
                                        )
                                            return
                                        if (Date.now() < cooldown.current)
                                            return
                                        setHoveredId(p.id)
                                        setActivePlanet(p)
                                        const rect = (
                                            e.currentTarget as HTMLElement
                                        ).getBoundingClientRect()
                                        setCardPos({
                                            x: rect.left + rect.width / 2,
                                            y: rect.top + rect.height / 2,
                                        })
                                    }}
                                    onMouseLeave={() => {
                                        /* don't close if hovering card */ setHoveredId(
                                            (prev) =>
                                                prev === p.id ? null : prev
                                        )
                                    }}
                                    style={{
                                        display: "block",
                                        position: "absolute",
                                        inset: 0,
                                    }}
                                >
                                    <div
                                        className={`pl-box ${hoveredId === p.id ? "hov" : ""}`}
                                    >
                                        <div className="sh-wrap">
                                            <CardIcon id={p.id} />
                                        </div>
                                    </div>
                                    <div
                                        className={`lbl ${p.id === "sesiones" ? "lbl-flip" : ""}`}
                                        style={{
                                            ["--lbl-off" as any]: `${p.labelOffset}px`,
                                            ...(p.id === "sesiones"
                                                ? {
                                                      animationName: "lbl-flip",
                                                      animationDuration: `${dur}s`,
                                                      animationTimingFunction:
                                                          "linear",
                                                      animationDelay: `${-phase * dur}s`,
                                                      animationIterationCount:
                                                          "infinite",
                                                  }
                                                : {}),
                                        }}
                                    >
                                        {p.title}
                                    </div>
                                    <div
                                        className={`ret ${hoveredId === p.id || activePlanet?.id === p.id ? "on" : ""}`}
                                        aria-hidden="true"
                                    >
                                        <span className="cn tl" />
                                        <span className="cn tr" />
                                        <span className="cn bl" />
                                        <span className="cn br" />
                                        <span className="scn" />
                                    </div>
                                </a>
                            </div>
                        )
                    })}
                </motion.div>
            </motion.div>

            {/* SCROLL DOTS */}
            <div className="qr-start">
                <AnimatePresence>
                    {section === "space" && !activePlanet && <ScrollDots />}
                </AnimatePresence>
            </div>

            {/* EARTH */}
            <EarthSection
                webhookUrl={webhookUrl}
                manifestoShort={manifestoShort!}
                manifestoLong={manifestoLong!}
                guiaImage={guiaImage}
                guiaNombre={guiaNombre!}
                guiaDescShort={guiaDescShort!}
                guiaDescLong={guiaDescLong!}
                guiaCtaText={guiaCtaText!}
                afinacionesTitle={afinacionesTitle!}
                afinacionesText={afinacionesText!}
                afinacionesWebhookUrl={afinacionesWebhookUrl!}
            />

            {/* FLOATING CARD (near node) — click-outside handled by root onClick */}
            <AnimatePresence>
                {activePlanet && section === "space" && (
                    <FloatingCard
                        key={activePlanet.id}
                        planet={activePlanet}
                        x={cardPos.x}
                        y={cardPos.y}
                        onClose={closeCard}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

/* ═══════ DEFAULTS ═══════ */
SolarSystem.defaultProps = {
    webhookUrl: "",
    navbarOffset: 72,
    planetGlow: 0.8,
    orbitSpeed: 12,
    orbitPulseSpeed: 1.0,
    orbitTilt: 0.35,
    reticleSize: 64,
    reticleGlow: 0.6,
    warpSpeed: 1.0,
    bgColor: "#000000",
    textColor: "#E6F7EF",
    subtitleOffsetY: 12,
    consoleWidth: 800,
    titleSize: 72,
    accentColor: "#00C2FF",
    heroTitleText: "RED SOLAR VIVA",
    heroSubtitleText: "TEMPLO SOLAR 5D",
    heroTagline: "Biblioteca de la Nueva Tierra",
    numStars: 150,
    numComets: 2,
    titleOffsetY: 48,
    systemOffsetY: 48,
    systemOffsetX: 0,
    toroideImage: undefined,
    toroideSize: 280,
    manifestoShort:
        "La vieja estructura se disuelve.\nPara navegar el colapso y construir lo nuevo, no necesitas suerte; necesitas Instrucción.",
    manifestoLong:
        "Hemos abierto los Códices de Luz: la biblioteca con los códigos para reactivar tu biología, potenciar tu mente y recordar tu diseño original.\n\nRed Solar Viva no es solo información. Es un campo vivo de activación.",
    guiaImage: undefined,
    guiaNombre: "Zak'Haar Solar",
    guiaDescShort: "Guía de la Cámara Solar y portador de los Códices de Luz.",
    guiaDescLong:
        "Zak'Haar canaliza instrucción directa desde el campo solar. Su trabajo integra biología, frecuencia y memoria estelar para devolverte al centro de tu diseño original.",
    guiaCtaText: "Conocer al Guía",
    afinacionesTitle: "AFINACIONES",
    afinacionesText:
        "¿Hay algo que te gustaría que agregáramos o afináramos aquí? Tu mirada es parte del pulso solar.\\n\\nSi sientes una idea, una mejora o una nueva función que podría expandir el campo de Red Solar Viva, compártela: cada sugerencia ayuda a que Red Solar Viva siga evolucionando como un espacio vivo de co-creación.\\n\\nEscribe tu propuesta aquí abajo y la meditaremos.\\n\\n¡Gracias por co-crear este espacio solar!",
    afinacionesWebhookUrl: "",
    p1_Size: 70,
    p1_Title: "Códices",
    p1_PanelTitle: "Códices de Luz",
    p1_Desc:
        "La biblioteca técnica con los códigos para reactivar tu biología, potenciar tu mente y recordar tu diseño original.",
    p1_Link: "https://www.redsolarviva.com/codices",
    p1_TargetBlank: false,
    p1_OrbitDuration: 110,
    p1_LabelOffset: 4,
    p2_Size: 60,
    p2_Title: "Sesiones",
    p2_PanelTitle: "Sesiones",
    p2_Desc: "Acompañamiento y recalibración vibral para nodos en activación.",
    p2_Link: "https://www.redsolarviva.com/sesiones",
    p2_TargetBlank: false,
    p2_OrbitDuration: 90,
    p2_LabelOffset: 4,
    p3_Size: 55,
    p3_Title: "Fragmentos",
    p3_PanelTitle: "Fragmentos del Sol",
    p3_Desc:
        "Episodios de pulsos visuales y sonoros para la activación del campo.",
    p3_Link: "https://www.redsolarviva.com/fragmentosdelsol",
    p3_TargetBlank: false,
    p3_OrbitDuration: 110,
    p3_LabelOffset: 4,
    p4_Size: 65,
    p4_Title: "Meditaciones",
    p4_PanelTitle: "Meditaciones",
    p4_Desc: "Sintonías y guías meditativas para alinear tu campo.",
    p4_Link: "https://www.redsolarviva.com/meditaciones",
    p4_TargetBlank: false,
    p4_OrbitDuration: 100,
    p4_LabelOffset: 4,
    p5_Size: 64,
    p5_Title: "Simuladores",
    p5_PanelTitle: "Simuladores",
    p5_Desc: "Capa lúdica de la Red: juegos y dinámicas para activar el campo.",
    p5_Link: "https://www.redsolarviva.com/simuladores",
    p5_TargetBlank: false,
    p5_OrbitDuration: 110,
    p5_LabelOffset: 4,
}

/* ═══════ PROPERTY CONTROLS ═══════ */
addPropertyControls(SolarSystem, {
    webhookUrl: {
        type: ControlType.String,
        title: "Webhook URL",
        placeholder: "https://...",
    },
    manifestoShort: {
        type: ControlType.String,
        title: "📜 Manifiesto (corto)",
        defaultValue: SolarSystem.defaultProps.manifestoShort,
        displayTextArea: true,
    },
    manifestoLong: {
        type: ControlType.String,
        title: "📜 Manifiesto (extendido)",
        defaultValue: SolarSystem.defaultProps.manifestoLong,
        displayTextArea: true,
    },
    guiaImage: { type: ControlType.Image, title: "👤 Foto Guía" },
    guiaNombre: {
        type: ControlType.String,
        title: "👤 Nombre Guía",
        defaultValue: "Zak'Haar Solar",
    },
    guiaDescShort: {
        type: ControlType.String,
        title: "👤 Desc. corta",
        defaultValue: SolarSystem.defaultProps.guiaDescShort,
        displayTextArea: true,
    },
    guiaDescLong: {
        type: ControlType.String,
        title: "👤 Desc. extendida",
        defaultValue: SolarSystem.defaultProps.guiaDescLong,
        displayTextArea: true,
    },
    guiaCtaText: {
        type: ControlType.String,
        title: "👤 Texto Botón Guía",
        defaultValue: "Conocer al Guía",
    },
    afinacionesTitle: {
        type: ControlType.String,
        title: "🔧 Modal Título",
        defaultValue: "AFINACIONES",
    },
    afinacionesText: {
        type: ControlType.String,
        title: "🔧 Modal Texto",
        defaultValue: SolarSystem.defaultProps.afinacionesText,
        displayTextArea: true,
    },
    afinacionesWebhookUrl: {
        type: ControlType.String,
        title: "⚡ Webhook Mensajes",
        defaultValue: "",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Color Primario",
        defaultValue: "#00C2FF",
    },
    titleSize: {
        type: ControlType.Number,
        title: "Tamaño Título",
        defaultValue: 72,
        min: 24,
        max: 200,
        step: 2,
        displayStepper: true,
    },
    navbarOffset: {
        type: ControlType.Number,
        title: "Navbar Offset",
        defaultValue: 72,
        min: 0,
        max: 240,
        step: 1,
        displayStepper: true,
    },
    subtitleOffsetY: {
        type: ControlType.Number,
        title: "Subtítulo Y",
        defaultValue: 12,
        min: -200,
        max: 160,
        step: 1,
        displayStepper: true,
    },
    heroSubtitleText: {
        type: ControlType.String,
        title: "Subtítulo",
        defaultValue: "TEMPLO SOLAR 5D",
    },
    heroTagline: {
        type: ControlType.String,
        title: "Tagline",
        defaultValue: "Biblioteca de la Nueva Tierra",
        displayTextArea: true,
    },
    toroideImage: { type: ControlType.Image, title: "🌀 Toroide PNG" },
    toroideSize: {
        type: ControlType.Number,
        title: "🌀 Toroide (px)",
        defaultValue: 280,
        min: 100,
        max: 500,
        step: 10,
        displayStepper: true,
    },
    planetGlow: {
        type: ControlType.Number,
        title: "Glow Planeta",
        defaultValue: 0.8,
        min: 0,
        max: 1,
        step: 0.05,
    },
    orbitPulseSpeed: {
        type: ControlType.Number,
        title: "Veloc. Pulso (s)",
        defaultValue: 1.0,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        displayStepper: true,
    },
    warpSpeed: {
        type: ControlType.Number,
        title: "Velocidad Warp",
        defaultValue: 1.0,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        displayStepper: true,
    },
    orbitTilt: {
        type: ControlType.Number,
        title: "Tilt 3D",
        defaultValue: 0.35,
        min: 0.1,
        max: 1,
        step: 0.01,
    },
    reticleSize: {
        type: ControlType.Number,
        title: "Retícula (px)",
        defaultValue: 64,
        min: 32,
        max: 140,
        step: 2,
    },
    reticleGlow: {
        type: ControlType.Number,
        title: "Glow Retícula",
        defaultValue: 0.6,
        min: 0,
        max: 1,
        step: 0.05,
    },
    bgColor: {
        type: ControlType.Color,
        title: "Fondo",
        defaultValue: "#000000",
    },
    textColor: {
        type: ControlType.Color,
        title: "Texto",
        defaultValue: "#E6F7EF",
    },
    numStars: {
        type: ControlType.Number,
        title: "Estrellas",
        defaultValue: 150,
        min: 0,
        max: 500,
        step: 10,
    },
    numComets: {
        type: ControlType.Number,
        title: "Cometas",
        defaultValue: 2,
        min: 0,
        max: 12,
        step: 1,
    },
    titleOffsetY: {
        type: ControlType.Number,
        title: "Título Y",
        defaultValue: 48,
        min: -80,
        max: 240,
        step: 2,
        displayStepper: true,
    },
    systemOffsetY: {
        type: ControlType.Number,
        title: "Sistema Y",
        defaultValue: 48,
        min: -800,
        max: 300,
        step: 2,
        displayStepper: true,
    },
    systemOffsetX: {
        type: ControlType.Number,
        title: "Sistema X",
        defaultValue: 0,
        min: -300,
        max: 300,
        step: 2,
        displayStepper: true,
    },
    p1_Size: {
        type: ControlType.Number,
        title: "P1 Tamaño",
        min: 30,
        max: 150,
        step: 1,
    },
    p1_Title: { type: ControlType.String, title: "P1 Título" },
    p1_PanelTitle: { type: ControlType.String, title: "P1 Panel Title" },
    p1_Desc: {
        type: ControlType.String,
        title: "P1 Desc",
        displayTextArea: true,
    },
    p1_Link: { type: ControlType.String, title: "P1 Link" },
    p1_TargetBlank: { type: ControlType.Boolean, title: "P1 Nuevo Tab" },
    p1_OrbitDuration: {
        type: ControlType.Number,
        title: "P1 Duración",
        min: 10,
        max: 180,
        step: 1,
    },
    p1_LabelOffset: {
        type: ControlType.Number,
        title: "P1 Label Gap",
        min: -50,
        max: 50,
        defaultValue: 4,
    },
    p2_Size: {
        type: ControlType.Number,
        title: "P2 Tamaño",
        min: 30,
        max: 150,
        step: 1,
    },
    p2_Title: { type: ControlType.String, title: "P2 Título" },
    p2_PanelTitle: { type: ControlType.String, title: "P2 Panel Title" },
    p2_Desc: {
        type: ControlType.String,
        title: "P2 Desc",
        displayTextArea: true,
    },
    p2_Link: { type: ControlType.String, title: "P2 Link" },
    p2_TargetBlank: { type: ControlType.Boolean, title: "P2 Nuevo Tab" },
    p2_OrbitDuration: {
        type: ControlType.Number,
        title: "P2 Duración",
        min: 10,
        max: 180,
        step: 1,
    },
    p2_LabelOffset: {
        type: ControlType.Number,
        title: "P2 Label Gap",
        min: -50,
        max: 50,
        defaultValue: 4,
    },
    p3_Size: {
        type: ControlType.Number,
        title: "P3 Tamaño",
        min: 30,
        max: 150,
        step: 1,
    },
    p3_Title: { type: ControlType.String, title: "P3 Título" },
    p3_PanelTitle: { type: ControlType.String, title: "P3 Panel Title" },
    p3_Desc: {
        type: ControlType.String,
        title: "P3 Desc",
        displayTextArea: true,
    },
    p3_Link: { type: ControlType.String, title: "P3 Link" },
    p3_TargetBlank: { type: ControlType.Boolean, title: "P3 Nuevo Tab" },
    p3_OrbitDuration: {
        type: ControlType.Number,
        title: "P3 Duración",
        min: 10,
        max: 180,
        step: 1,
    },
    p3_LabelOffset: {
        type: ControlType.Number,
        title: "P3 Label Gap",
        min: -50,
        max: 50,
        defaultValue: 4,
    },
    p4_Size: {
        type: ControlType.Number,
        title: "P4 Tamaño",
        min: 30,
        max: 150,
        step: 1,
    },
    p4_Title: { type: ControlType.String, title: "P4 Título" },
    p4_PanelTitle: { type: ControlType.String, title: "P4 Panel Title" },
    p4_Desc: {
        type: ControlType.String,
        title: "P4 Desc",
        displayTextArea: true,
    },
    p4_Link: { type: ControlType.String, title: "P4 Link" },
    p4_TargetBlank: { type: ControlType.Boolean, title: "P4 Nuevo Tab" },
    p4_OrbitDuration: {
        type: ControlType.Number,
        title: "P4 Duración",
        min: 10,
        max: 180,
        step: 1,
    },
    p4_LabelOffset: {
        type: ControlType.Number,
        title: "P4 Label Gap",
        min: -50,
        max: 50,
        defaultValue: 4,
    },
    p5_Size: {
        type: ControlType.Number,
        title: "P5 Tamaño",
        min: 30,
        max: 150,
        step: 1,
    },
    p5_Title: { type: ControlType.String, title: "P5 Título" },
    p5_PanelTitle: { type: ControlType.String, title: "P5 Panel Title" },
    p5_Desc: {
        type: ControlType.String,
        title: "P5 Desc",
        displayTextArea: true,
    },
    p5_Link: { type: ControlType.String, title: "P5 Link" },
    p5_TargetBlank: { type: ControlType.Boolean, title: "P5 Nuevo Tab" },
    p5_OrbitDuration: {
        type: ControlType.Number,
        title: "P5 Duración",
        min: 10,
        max: 180,
        step: 1,
    },
    p5_LabelOffset: {
        type: ControlType.Number,
        title: "P5 Label Gap",
        min: -50,
        max: 50,
        defaultValue: 4,
    },
})
