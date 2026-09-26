import createResourceSet from "@/chartLibraries/gpu/engine/createResourceSet"
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

export default (
  runtime,
  canvas,
  { fillMode = null, markers = true } = {}
) => {
  const surface = makeSurface(runtime, canvas)
  return createResourceSet(surface, {
    grid: () => makeRectLayer(runtime, surface, "grid"),
    interaction: () => makeRectLayer(runtime, surface, "interaction"),
    overlay: () => makeRectLayer(runtime, surface, "overlay"),
    line: () => makeKernel(runtime, surface, { fillMode }),
    marker: () =>
      markers
        ? makeCircleLayer(runtime, surface)
        : Promise.resolve(makeEmptyLayer()),
    text: () => makeTextLayer(runtime, surface),
  })
}
