const hexToByte = value => Number.parseInt(value, 16)
let colorContext = null

const resolveBrowserColor = value => {
  if (typeof document === "undefined") return null
  if (!colorContext) colorContext = document.createElement("canvas").getContext("2d")
  if (!colorContext) return null
  const sentinel = "rgba(1, 2, 3, 0.123)"
  colorContext.fillStyle = sentinel
  colorContext.fillStyle = value
  return colorContext.fillStyle === sentinel ? null : colorContext.fillStyle
}

export const parseColor = (value, resolve = true) => {
  if (typeof value !== "string") return [0, 0, 0, 1]
  if (value.trim().toLowerCase() === "transparent") return [0, 0, 0, 0]

  const hex = value.trim().match(/^#([\da-f]{3,8})$/i)?.[1]
  if (hex) {
    const expanded = hex.length <= 4 ? [...hex].map(part => `${part}${part}`).join("") : hex
    if (expanded.length === 6 || expanded.length === 8) {
      return [
        hexToByte(expanded.slice(0, 2)) / 255,
        hexToByte(expanded.slice(2, 4)) / 255,
        hexToByte(expanded.slice(4, 6)) / 255,
        expanded.length === 8 ? hexToByte(expanded.slice(6, 8)) / 255 : 1,
      ]
    }
  }

  const rgb = value
    .trim()
    .match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i)
  if (rgb) {
    return [
      Number(rgb[1]) / 255,
      Number(rgb[2]) / 255,
      Number(rgb[3]) / 255,
      rgb[4] == null ? 1 : Number(rgb[4]),
    ]
  }

  const resolved = resolve ? resolveBrowserColor(value) : null
  return resolved ? parseColor(resolved, false) : [0, 0, 0, 1]
}
