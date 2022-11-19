import Dygraph from "@netdata/dygraphs"

export const darkenColor = colorStr => {
  // Defined in dygraph-utils.js
  var color = Dygraph.toRGB_(colorStr)
  color.r = Math.floor((255 + color.r) / 2)
  color.g = Math.floor((255 + color.g) / 2)
  color.b = Math.floor((255 + color.b) / 2)
  return "rgb(" + color.r + "," + color.g + "," + color.b + ")"
}
