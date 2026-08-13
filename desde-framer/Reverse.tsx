import * as React from "react"
import { useRef, useEffect, useState } from "react"
import { Frame } from "framer"

export function AlternatingVideo() {
    const videoRef = useRef(null)
    const [reverse, setReverse] = useState(false)

    useEffect(() => {
        const video = videoRef.current

        if (!video) return

        video.playbackRate = 1
        video.play()

        const handleEnded = () => {
            setReverse((prev) => !prev)
        }

        video.addEventListener("ended", handleEnded)

        return () => {
            video.removeEventListener("ended", handleEnded)
        }
    }, [])

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        video.pause()
        video.currentTime = reverse ? video.duration : 0

        const playInDirection = () => {
            const step = reverse ? -0.04 : 0.04 // velocidad de reproducción
            const interval = setInterval(() => {
                video.currentTime += step

                if (
                    (!reverse && video.currentTime >= video.duration) ||
                    (reverse && video.currentTime <= 0)
                ) {
                    clearInterval(interval)
                    setReverse((prev) => !prev)
                }
            }, 40)
        }

        playInDirection()
    }, [reverse])

    return (
        <video
            ref={videoRef}
            src="https://yourdomain.com/path-to-video.mp4" // cambia esta ruta
            width="100%"
            height="100%"
            style={{ objectFit: "cover" }}
        />
    )
}
