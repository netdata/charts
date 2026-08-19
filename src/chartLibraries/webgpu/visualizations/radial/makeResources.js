import createResourceSet from "@/chartLibraries/gpu/engine/createResourceSet"
import makeSurface from "@/chartLibraries/webgpu/engine/surface"

export default makeKernel => (runtime, canvas) => {
  const surface = makeSurface(runtime, canvas)
  return createResourceSet(surface, {
    layer: () => makeKernel(runtime, surface),
  })
}
