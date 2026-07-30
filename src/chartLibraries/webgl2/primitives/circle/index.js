import { parseColor } from "@/chartLibraries/gpu/color"
import makeInstancedLayer from "@/chartLibraries/webgl2/engine/makeInstancedLayer"

export const packCircles = (circles, dpr = 1) => {
  const packed = new Float32Array(circles.length * 16)
  circles.forEach(({ x, y, radius, color }, index) => {
    const offset = index * 16
    packed.set([x * dpr, y * dpr, radius * dpr, radius * dpr], offset)
    packed.set(parseColor(color), offset + 8)
    packed[offset + 12] = 1
  })
  return packed
}

export default async surface => {
  const layer = await makeInstancedLayer({
    surface,
    pack: packCircles,
  })
  return {
    ...layer,
    update: ({ circles, plot, ...frame }) =>
      layer.update({ items: circles, scissor: plot, ...frame }),
  }
}
