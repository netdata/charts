const hexToRgb = hex => {
  const h = hex.replace("#", "")
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

const rgbToHex = (r, g, b) =>
  "#" +
  [r, g, b]
    .map(v => {
      const hex = Math.min(Math.max(Math.round(v), 0), 255).toString(16)
      return hex.length === 1 ? "0" + hex : hex
    })
    .join("")

const lightenColor = (hexColor, factor = 0.6) => {
  const [r, g, b] = hexToRgb(hexColor)
  return rgbToHex(r + (255 - r) * factor, g + (255 - g) * factor, b + (255 - b) * factor)
}

export default lightenColor
