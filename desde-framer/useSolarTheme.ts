// useSolarTheme.ts
import { useLayoutEffect, useState } from "react"

export type ThemeName = "matrix" | "neon"

const readDomTheme = (): ThemeName => {
    try {
        const el = document.documentElement
        const t =
            el.getAttribute("data-theme") ||
            localStorage.getItem("holo-theme") ||
            "matrix"
        return t === "neon" ? "neon" : "matrix"
    } catch {
        return "matrix"
    }
}

const readAccentVar = (): string => {
    try {
        const cs = getComputedStyle(document.documentElement)
        const v = cs.getPropertyValue("--accent")?.trim()
        return v || "#00FF41"
    } catch {
        return "#00FF41"
    }
}

/** #hex o rgb(...) → rgba(...) con alpha */
export const withAlpha = (color: string, a: number) => {
    if (!color) return `rgba(0,0,0,${a})`
    const c = color.trim()
    if (c.startsWith("#")) {
        const h = c.slice(1)
        const H =
            h.length === 3
                ? h
                      .split("")
                      .map((ch) => ch + ch)
                      .join("")
                : h
        const int = parseInt(H, 16)
        const r = (int >> 16) & 255
        const g = (int >> 8) & 255
        const b = int & 255
        return `rgba(${r},${g},${b},${a})`
    }
    const m = c.match(/rgb\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*\)/i)
    return m ? `rgba(${m[1]},${m[2]},${m[3]},${a})` : color
}

type Options = {
    neonAccent?: string
    matrixAccent?: string
}

/**
 * Hook universal del tema (matrix/neon) sincronizado con <html data-theme> y localStorage.
 * Export NOMBRADO: useSolarTheme
 */
export function useSolarTheme(opts: Options = {}) {
    const neonDefault = opts.neonAccent || "#00C2FF"
    const matrixDefault = opts.matrixAccent || "#00FF41"

    const [synced, setSynced] = useState(false)
    const [theme, setTheme] = useState<ThemeName>("matrix")
    const [accent, setAccent] = useState<string>(matrixDefault)

    useLayoutEffect(() => {
        const sync = () => {
            const t = readDomTheme()
            const a =
                readAccentVar() || (t === "neon" ? neonDefault : matrixDefault)
            setTheme(t)
            setAccent(a)
            setSynced(true)
        }
        sync()

        const el = document.documentElement
        const mo = new MutationObserver(sync)
        mo.observe(el, { attributes: true, attributeFilter: ["data-theme"] })

        const onStorage = (e: StorageEvent) => {
            if (e.key === "holo-theme") sync()
        }
        window.addEventListener("storage", onStorage)

        return () => {
            mo.disconnect()
            window.removeEventListener("storage", onStorage)
        }
    }, [])

    const setThemeGlobal = (t: ThemeName) => {
        try {
            localStorage.setItem("holo-theme", t)
            document.documentElement.setAttribute("data-theme", t)
            const a =
                readAccentVar() || (t === "neon" ? neonDefault : matrixDefault)
            setTheme(t)
            setAccent(a)
        } catch {}
    }

    const toggleTheme = () =>
        setThemeGlobal(theme === "neon" ? "matrix" : "neon")

    return {
        synced,
        theme,
        isNeon: theme === "neon",
        accent,
        setTheme: setThemeGlobal,
        toggleTheme,
    }
}
