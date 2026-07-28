import { parseColor } from "@/chartLibraries/webgpu/engine/color"
import makeInstancedLayer from "@/chartLibraries/webgpu/engine/makeInstancedLayer"
import shader from "./shader"

export const packRects = (rects, dpr = 1) => {
  const packed = new Float32Array(rects.length * 8)
  rects.forEach(({ x, y, width, height, color }, index) => {
    packed.set([x * dpr, y * dpr, width * dpr, height * dpr], index * 8)
    packed.set(parseColor(color), index * 8 + 4)
  })
  return packed
}

export default async (runtime, surface, label = "rect") => {
  const layer = await makeInstancedLayer({
    runtime,
    surface,
    key: "rect",
    label,
    shader,
    pack: packRects,
  })
  return {
    ...layer,
    update: ({ rects, ...frame }) => layer.update({ items: rects, ...frame }),
  }
}
