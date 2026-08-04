import createResourceSet from "@/chartLibraries/gpu/engine/createResourceSet"
import makeSurface from "@/chartLibraries/webgl2/engine/surface"

export default makeKernel => (runtime, canvas) => {
  const surface = makeSurface(runtime, canvas)
  return createResourceSet(surface, {
    layer: () => makeKernel(surface),
  })
}
