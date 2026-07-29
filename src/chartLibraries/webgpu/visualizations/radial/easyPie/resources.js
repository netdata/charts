import makeSurface from "@/chartLibraries/webgpu/engine/surface"
import makeKernel from "./kernel"

export default async (runtime, canvas) => {
  const surface = makeSurface(runtime, canvas)
  try {
    const layer = await makeKernel(runtime, surface)
    return {
      surface,
      layer,
      destroy: () => {
        layer.destroy()
        surface.destroy()
      },
    }
  } catch (error) {
    surface.destroy()
    throw error
  }
}
