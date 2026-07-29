const ATLAS_PADDING = 2

export const makeRasterCanvas = () => {
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    return canvas
  }
  return new OffscreenCanvas(1, 1)
}

const getFontSize = font => Number(font.match(/([\d.]+)px/)?.[1]) || 10

export const makeTextCacheKey = ({ text, font, dpr }) => `${dpr}|${font}|${text}`

export const placeText = ({ x, y, width, height, align = "left", verticalAlign = "top" }) => ({
  x: align === "center" ? x - width / 2 : align === "right" ? x - width : x,
  y: verticalAlign === "middle" ? y - height / 2 : verticalAlign === "bottom" ? y - height : y,
  width,
  height,
})

export const rasterizeText = (canvas, { text, font, dpr }) => {
  let context = canvas.getContext("2d")
  if (!context) return null
  context.font = font
  const metrics = context.measureText(text)
  const fontSize = getFontSize(font)
  const ascent = Math.ceil(metrics.actualBoundingBoxAscent || fontSize)
  const descent = Math.ceil(metrics.actualBoundingBoxDescent || fontSize * 0.3)
  const width = Math.max(1, Math.ceil(metrics.width) + ATLAS_PADDING * 2)
  const height = Math.max(1, ascent + descent + ATLAS_PADDING * 2)
  const pixelWidth = Math.max(1, Math.ceil(width * dpr))
  const pixelHeight = Math.max(1, Math.ceil(height * dpr))

  canvas.width = pixelWidth
  canvas.height = pixelHeight
  context = canvas.getContext("2d")
  if (!context) return null
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, width, height)
  context.font = font
  context.textAlign = "left"
  context.textBaseline = "alphabetic"
  context.fillStyle = "#ffffff"
  context.fillText(text, ATLAS_PADDING, ATLAS_PADDING + ascent)

  return { width, height, pixelWidth, pixelHeight }
}
