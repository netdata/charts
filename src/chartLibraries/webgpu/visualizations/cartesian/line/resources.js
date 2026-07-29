import makeSurface from "@/chartLibraries/webgpu/engine/surface"
import makeCircleLayer from "@/chartLibraries/webgpu/primitives/circle"
import makeRectLayer from "@/chartLibraries/webgpu/primitives/rect"
import makeTextLayer from "@/chartLibraries/webgpu/text"
import makeKernel from "./kernel"

const makeEmptyLayer = () => ({
  destroy: () => {},
  encode: () => false,
  getBufferBytes: () => 0,
  update: () => {},
})

export default async (
  runtime,
  canvas,
  { fillMode = null, markers = true } = {}
) => {
  const surface = makeSurface(runtime, canvas)
  const settled = await Promise.allSettled([
    makeRectLayer(runtime, surface, "grid"),
    makeRectLayer(runtime, surface, "interaction"),
    makeRectLayer(runtime, surface, "overlay"),
    makeKernel(runtime, surface, { fillMode }),
    markers ? makeCircleLayer(runtime, surface) : Promise.resolve(makeEmptyLayer()),
    makeTextLayer(runtime, surface),
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
