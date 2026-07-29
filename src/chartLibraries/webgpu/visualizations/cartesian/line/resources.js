import makeSurface from "@/chartLibraries/webgpu/engine/surface"
import makeCircleLayer from "@/chartLibraries/webgpu/primitives/circle"
import makeRectLayer from "@/chartLibraries/webgpu/primitives/rect"
import makeTextLayer from "@/chartLibraries/webgpu/text"
import makeKernel from "./kernel"

export default async (runtime, canvas) => {
  const surface = makeSurface(runtime, canvas)
  let grid = null
  let interaction = null
  let overlay = null
  let line = null
  let marker = null
  let text = null
  try {
    grid = await makeRectLayer(runtime, surface, "grid")
    interaction = await makeRectLayer(runtime, surface, "interaction")
    overlay = await makeRectLayer(runtime, surface, "overlay")
    line = await makeKernel(runtime, surface)
    marker = await makeCircleLayer(runtime, surface)
    text = await makeTextLayer(runtime, surface)
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
  } catch (error) {
    grid?.destroy()
    interaction?.destroy()
    overlay?.destroy()
    line?.destroy()
    marker?.destroy()
    text?.destroy()
    surface.destroy()
    throw error
  }
}
