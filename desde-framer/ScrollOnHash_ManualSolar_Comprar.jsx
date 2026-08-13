// ScrollOnHash.jsx
import { useEffect } from "react"

export function ScrollOnHash() {
    useEffect(() => {
        // Espera medio segundo para que la página cargue
        const timer = setTimeout(() => {
            if (window.location.hash) {
                const id = window.location.hash.replace("#", "")
                const element = document.getElementById(id)
                if (element) {
                    element.scrollIntoView({ behavior: "smooth" })
                }
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [])

    // Devolvemos un div invisible para que Framer permita arrastrarlo al canvas
    return <div style={{ display: "none" }} />
}
