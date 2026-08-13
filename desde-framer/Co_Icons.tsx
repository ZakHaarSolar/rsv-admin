// Red Solar Viva — Co_Icons.tsx v1.0
// v1.0 — Todos los íconos SVG usados en Códices: estáticos mobile +
// desktop + sidenav. Parte del split de Codices.tsx (sello Co_).
//
// Excluido: HoloEyeIcon (animado complejo) — vive en Co_DesktopHolo.tsx
// porque pertenece al lenguaje hero del escritorio.
//
// Default export: ghost component + Object.assign con todos los íconos
// (patrón canónico para archivos utility-only en Framer).
//
// Consumidores: Co_Mobile.tsx, Co_Desktop.tsx, Co_DesktopHolo.tsx,
// Codices.tsx (shell, si llega a necesitarlos).

import * as React from "react"
import { motion } from "framer-motion"
import CoShared from "./Co_Shared.tsx"

const { hexToRgba } = CoShared

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  MOBILE ICONS                                                   ║
   ╚══════════════════════════════════════════════════════════════════╝ */

export const MIconSm = (d: string, sz = 18) => (
    <svg
        width={sz}
        height={sz}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        dangerouslySetInnerHTML={{ __html: d }}
    />
)

export const MIconTablet = () =>
    MIconSm(
        '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>'
    )

export const MIconHeadphones = () =>
    MIconSm(
        '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>'
    )

export const MIconBox = () =>
    MIconSm(
        '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'
    )

export const MIconEye = () =>
    MIconSm(
        '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
        16
    )

export const MIconChevronDown = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
)

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  MOBILE AUTHOR ICONS (animados — usan motion + hexToRgba)        ║
   ╚══════════════════════════════════════════════════════════════════╝ */

export const MSunIcon = ({
    color,
    size = 36,
}: {
    color: string
    size?: number
}) => {
    const A = (x: number) => hexToRgba(color, x)
    const rays = Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180
        return (
            <line
                key={i}
                x1={32 + Math.cos(a) * 15}
                y1={32 + Math.sin(a) * 15}
                x2={32 + Math.cos(a) * 24}
                y2={32 + Math.sin(a) * 24}
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                opacity={0.9}
            />
        )
    })
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            style={{
                overflow: "visible",
                filter: `drop-shadow(0 0 6px ${A(0.8)})`,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        >
            <circle
                cx="32"
                cy="32"
                r="10"
                fill={A(0.25)}
                stroke={color}
                strokeWidth="2"
            />
            {rays}
        </motion.svg>
    )
}

export const MDropIcon = ({
    color,
    size = 36,
}: {
    color: string
    size?: number
}) => {
    const A = (x: number) => hexToRgba(color, x)
    return (
        <motion.svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            style={{
                overflow: "visible",
                filter: `drop-shadow(0 0 6px ${A(0.8)})`,
            }}
            animate={{ y: [-1, 1, -1] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        >
            <path
                d="M32 6 C24 18 14 28 14 40 c0 10 8 18 18 18s18-8 18-18c0-12-10-22-18-34z"
                fill={A(0.22)}
                stroke={color}
                strokeWidth="2"
            />
        </motion.svg>
    )
}

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  DESKTOP ICONS                                                  ║
   ╚══════════════════════════════════════════════════════════════════╝ */

export const IconEye = () => (
    <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
)

export const IconTablet = () => (
    <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <polyline points="13 2 13 9 20 9" />
    </svg>
)

export const IconHeadphones = () => (
    <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
)

export const IconBox = () => (
    <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
)

export const IconLock = () => (
    <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
)

export const IconPlay = () => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
)

export const DIconSm = (d: string) => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        dangerouslySetInnerHTML={{ __html: d }}
    />
)

export const IconSmTablet = () =>
    DIconSm(
        '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>'
    )

export const IconSmHeadphones = () =>
    DIconSm(
        '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>'
    )

export const IconSmBox = () =>
    DIconSm(
        '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'
    )

export const IconSmLock = () =>
    DIconSm(
        '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
    )

export const IconSmEye = () =>
    DIconSm(
        '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
    )

export const IconSmPlay = () =>
    DIconSm('<polygon points="5 3 19 12 5 21 5 3"/>')

export const IconChevronUp = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="18 15 12 9 6 15" />
    </svg>
)

export const IconNucleo = () => (
    <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
    </svg>
)

export const IconSmNucleo = () =>
    DIconSm(
        '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>'
    )

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  DESKTOP SIDENAV ICONS                                          ║
   ╚══════════════════════════════════════════════════════════════════╝ */

export const SideNavSunIcon = ({ color }: { color: string }) => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
    >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="M4.93 4.93l1.41 1.41" />
        <path d="M17.66 17.66l1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="M4.93 19.07l1.41-1.41" />
        <path d="M17.66 6.34l1.41-1.41" />
    </svg>
)

export const SideNavDropIcon = ({ color }: { color: string }) => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M12 2C9 8 4 12 4 16c0 4.4 3.6 8 8 8s8-3.6 8-8c0-4-5-8-8-14z" />
    </svg>
)

/* ╔══════════════════════════════════════════════════════════════════╗
   ║  DEFAULT EXPORT — ghost + Object.assign con todos los íconos    ║
   ╚══════════════════════════════════════════════════════════════════╝ */

function CoIconsRoot(_props: any) {
    return <div style={{ display: "none" }} aria-hidden="true" />
}
CoIconsRoot.displayName = "RSV_Co_Icons"

const CoIcons = Object.assign(CoIconsRoot, {
    MIconSm,
    MIconTablet,
    MIconHeadphones,
    MIconBox,
    MIconEye,
    MIconChevronDown,
    MSunIcon,
    MDropIcon,
    IconEye,
    IconTablet,
    IconHeadphones,
    IconBox,
    IconLock,
    IconPlay,
    DIconSm,
    IconSmTablet,
    IconSmHeadphones,
    IconSmBox,
    IconSmLock,
    IconSmEye,
    IconSmPlay,
    IconChevronUp,
    IconNucleo,
    IconSmNucleo,
    SideNavSunIcon,
    SideNavDropIcon,
})

export default CoIcons
