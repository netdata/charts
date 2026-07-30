import createResourceSet from "@/chartLibraries/gpu/engine/createResourceSet"
import makeSurface from "@/chartLibraries/webgl2/engine/surface"
import makeCircleLayer from "@/chartLibraries/webgl2/primitives/circle"
import makeRectLayer from "@/chartLibraries/webgl2/primitives/rect"
import makeTextLayer from "@/chartLibraries/webgl2/text"
import makeKernel from "./kernel"

const makeEmptyLayer = () => ({
  destroy: () => {},
  draw: () => false,
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
    grid: () => makeRectLayer(surface),
    interaction: () => makeRectLayer(surface),
    overlay: () => makeRectLayer(surface),
    line: () => makeKernel(surface, { fillMode }),
    marker: () =>
      markers ? makeCircleLayer(surface) : Promise.resolve(makeEmptyLayer()),
    text: () => makeTextLayer(surface),
  })
}
