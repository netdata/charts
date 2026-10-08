import { parseColor } from "@/chartLibraries/gpu/color"
import makeInstancedLayer from "@/chartLibraries/webgpu/engine/makeInstancedLayer"
import shader from "./shader"

export const packCircles = (circles, dpr = 1) => {
  const packed = new Float32Array(circles.length * 8)
  circles.forEach(({ x, y, radius, color }, index) => {
    packed.set([x * dpr, y * dpr, radius * dpr, 0], index * 8)
    packed.set(parseColor(color), index * 8 + 4)
  })
  return packed
}

export default async (runtime, surface) => {
  const layer = await makeInstancedLayer({
    runtime,
    surface,
    key: "circle",
    shader,
    pack: packCircles,
  })
  return {
    ...layer,
    update: ({ circles, plot, ...frame }) =>
      layer.update({ items: circles, scissor: plot, ...frame }),
  }
}
