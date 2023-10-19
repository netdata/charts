import { useLayoutEffect, useState } from "react"

export default () => {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  })

  useLayoutEffect(() => {
    if (!window?.addEventListener) return

    const handler = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    handler()

    window.addEventListener("resize", handler)

    return () => {
      window.removeEventListener("resize", handler)
    }
  }, [])

  return windowSize
}
