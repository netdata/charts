const parseColor = colorStr => {
  // Handle rgb(r,g,b) format
  const rgbMatch = colorStr.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10)
    }
  }
  
  // Handle hex format #RRGGBB or #RGB
  const hexMatch = colorStr.match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
  if (hexMatch) {
    let hex = hexMatch[1]
    if (hex.length === 3) {
      // Convert #RGB to #RRGGBB
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }
    return {
      r: parseInt(hex.substr(0, 2), 16),
      g: parseInt(hex.substr(2, 2), 16),
      b: parseInt(hex.substr(4, 2), 16)
    }
  }
  
  // Default to black if parsing fails
  return { r: 0, g: 0, b: 0 }
}

export const darkenColor = colorStr => {
  const color = parseColor(colorStr)
  color.r = Math.floor((255 + color.r) / 2)
  color.g = Math.floor((255 + color.g) / 2)
  color.b = Math.floor((255 + color.b) / 2)
  return "rgb(" + color.r + "," + color.g + "," + color.b + ")"
}
