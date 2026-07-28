const hexToByte = value => Number.parseInt(value, 16)

export const parseColor = value => {
  if (typeof value !== "string") return [0, 0, 0, 1]

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

  return [0, 0, 0, 1]
}

export const makeSeriesColors = chart => {
  const colors = new Float32Array(chart.getPayloadDimensionIds().length * 4)

  chart.getPayloadDimensionIds().forEach((id, index) => {
    const rgba = parseColor(chart.selectDimensionColor(id))
    if (!chart.isDimensionVisible(id)) rgba[3] = 0
    colors.set(rgba, index * 4)
  })

  return colors
}
