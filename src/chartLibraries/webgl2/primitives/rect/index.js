import { parseColor } from "@/chartLibraries/gpu/color"
import makeInstancedLayer from "@/chartLibraries/webgl2/engine/makeInstancedLayer"

export const packRects = (rects, dpr = 1) => {
  const packed = new Float32Array(rects.length * 16)
  rects.forEach(({ x, y, width, height, color }, index) => {
    const offset = index * 16
    packed.set([x * dpr, y * dpr, width * dpr, height * dpr], offset)
    packed.set(parseColor(color), offset + 8)
    packed[offset + 12] = 0
  })
  return packed
}

export default async surface => {
  const layer = await makeInstancedLayer({
    surface,
    pack: packRects,
  })
  return {
    ...layer,
    update: ({ rects, ...frame }) => layer.update({ items: rects, ...frame }),
  }
}
