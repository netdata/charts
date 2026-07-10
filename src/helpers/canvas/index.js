export const createCanvas = (width, height) => {
  const backgroundCanvas = document.createElement("canvas")
  backgroundCanvas.width = width
  backgroundCanvas.height = height

  return backgroundCanvas
}

export const copyCanvas = (sourceCanvas, targetCanvas) => {
  targetCanvas.width = sourceCanvas.width
  targetCanvas.height = sourceCanvas.height

  const ctx = targetCanvas.getContext("2d")
  ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height)
  ctx.drawImage(sourceCanvas, 0, 0)
}

let measureContext

const getMeasureContext = () => {
  if (typeof document === "undefined") return null
  if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) return null

  try {
    if (!measureContext) measureContext = document.createElement("canvas").getContext("2d")
  } catch {
    return null
  }

  return measureContext
}

export const measureTextWidth = (text, font) => {
  const context = getMeasureContext()
  if (!context) return null

  if (font) context.font = font

  return context.measureText(text || "").width
}
