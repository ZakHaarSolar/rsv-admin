import { useEffect, useState, useCallback } from "react"
export type HoloTheme = "matrix" | "neon"
const KEY = "holo-theme"

export function useTheme(initial: HoloTheme = "matrix") {
    const [theme, setThemeState] = useState<HoloTheme>(initial)
    useEffect(() => {
        const saved = (typeof window !== "undefined" &&
            localStorage.getItem(KEY)) as HoloTheme | null
        setThemeState(saved ?? initial)
    }, [initial])
    useEffect(() => {
        if (typeof document !== "undefined")
            document.documentElement.setAttribute("data-theme", theme)
        if (typeof localStorage !== "undefined")
            localStorage.setItem(KEY, theme)
    }, [theme])
    const setTheme = useCallback((t: HoloTheme) => setThemeState(t), [])
    const toggleTheme = useCallback(
        () => setThemeState((p) => (p === "matrix" ? "neon" : "matrix")),
        []
    )
    return { theme, setTheme, toggleTheme }
}
