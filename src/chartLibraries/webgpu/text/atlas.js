import makeBoundedCache from "@/chartLibraries/gpu/text/cache"
import {
  makeRasterCanvas,
  makeTextCacheKey,
  rasterizeText,
} from "@/chartLibraries/gpu/text"
import retireAfterSubmission from "@/chartLibraries/webgpu/engine/retirement"

const ATLAS_SIZE = 1024
const ATLAS_PADDING = 2
const CACHE_MAX = 1024

export { makeTextCacheKey }

export default runtime => {
  const { device } = runtime
  const size = Math.min(ATLAS_SIZE, device.limits.maxTextureDimension2D)
  const canvas = makeRasterCanvas()
  let texture = null
  let generation = 0
  let x = ATLAS_PADDING
  let y = ATLAS_PADDING
  let rowHeight = 0
  let destroyed = false
  const cache = makeBoundedCache(CACHE_MAX)

  const createTexture = () =>
    device.createTexture({
      label: "netdata-text-atlas",
      size: [size, size, 1],
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    })

  const reset = () => {
    const previous = texture
    texture = createTexture()
    generation += 1
    x = ATLAS_PADDING
    y = ATLAS_PADDING
    rowHeight = 0
    cache.clear()
    if (previous) retireAfterSubmission(device.queue.onSubmittedWorkDone(), previous)
  }

  const allocate = (width, height) => {
    if (width + ATLAS_PADDING * 2 > size || height + ATLAS_PADDING * 2 > size) return null
    if (x + width + ATLAS_PADDING > size) {
      x = ATLAS_PADDING
      y += rowHeight + ATLAS_PADDING
      rowHeight = 0
    }
    if (y + height + ATLAS_PADDING > size) return null

    const allocation = { x, y, width, height }
    x += width + ATLAS_PADDING
    rowHeight = Math.max(rowHeight, height)
    return allocation
  }

  const rasterize = ({ text, font, dpr }) => {
    if (destroyed || !text) return null
    const key = makeTextCacheKey({ text, font, dpr })
    const cached = cache.get(key)
    if (cached) return cached
    if (cache.isFullFor(key)) reset()

    const shaped = rasterizeText(canvas, { text, font, dpr })
    if (!shaped) return null
    const { width: widthCss, height: heightCss, pixelWidth: width, pixelHeight: height } =
      shaped

    let allocation = allocate(width, height)
    if (!allocation) {
      reset()
      allocation = allocate(width, height)
    }
    if (!allocation) return null

    device.queue.copyExternalImageToTexture(
      { source: canvas },
      { texture, origin: { x: allocation.x, y: allocation.y } },
      { width, height }
    )

    const entry = {
      generation,
      width: widthCss,
      height: heightCss,
      pixelWidth: width,
      pixelHeight: height,
      u0: allocation.x / size,
      v0: allocation.y / size,
      u1: (allocation.x + width) / size,
      v1: (allocation.y + height) / size,
    }
    cache.set(key, entry)
    return entry
  }

  const destroy = () => {
    if (destroyed) return
    destroyed = true
    cache.clear()
    texture?.destroy()
    texture = null
  }

  reset()

  return {
    rasterize,
    destroy,
    get texture() {
      return texture
    },
    get generation() {
      return generation
    },
    get size() {
      return size
    },
  }
}
