import makeSurface from "@/chartLibraries/webgl2/engine/surface"
import makeCircleLayer from "@/chartLibraries/webgl2/primitives/circle"
import makeRectLayer from "@/chartLibraries/webgl2/primitives/rect"
import makeTextLayer from "@/chartLibraries/webgl2/text"
import makeKernel from "./kernel"

export default async (runtime, canvas, { filled = false } = {}) => {
  const surface = makeSurface(runtime, canvas)
  const settled = await Promise.allSettled([
    makeRectLayer(surface),
    makeRectLayer(surface),
    makeRectLayer(surface),
    makeKernel(surface, { filled }),
    makeCircleLayer(surface),
    makeTextLayer(surface),
  ])
  const failed = settled.find(result => result.status === "rejected")
  if (failed) {
    settled.forEach(result => result.status === "fulfilled" && result.value.destroy())
    surface.destroy()
    throw failed.reason
  }

  const [grid, interaction, overlay, line, marker, text] = settled.map(
    result => result.value
  )
  return {
    surface,
    grid,
    interaction,
    overlay,
    line,
    marker,
    text,
    destroy: () => {
      grid.destroy()
      interaction.destroy()
      overlay.destroy()
      line.destroy()
      marker.destroy()
      text.destroy()
      surface.destroy()
    },
  }
}
