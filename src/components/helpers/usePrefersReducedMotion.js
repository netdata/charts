import { useEffect, useState } from "react"

const query = "(prefers-reduced-motion: reduce)"

const getMedia = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(query)
    : null

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(() => !!getMedia()?.matches)

  useEffect(() => {
    const media = getMedia()
    if (!media) return

    const onChange = event => setReduced(!!event.matches)

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange)
      return () => media.removeEventListener("change", onChange)
    }

    media.addListener?.(onChange)
    return () => media.removeListener?.(onChange)
  }, [])

  return reduced
}

export default usePrefersReducedMotion
