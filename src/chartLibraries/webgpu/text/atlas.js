import retireAfterSubmission from "@/chartLibraries/webgpu/engine/retirement"
import makeBoundedCache from "./cache"

const ATLAS_SIZE = 1024
const ATLAS_PADDING = 2
const CACHE_MAX = 1024

const makeRasterCanvas = () => {
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas")
    canvas.width = 1
    canvas.height = 1
    return canvas
  }
  return new OffscreenCanvas(1, 1)
}

const getFontSize = font => Number(font.match(/([\d.]+)px/)?.[1]) || 10

export const makeTextCacheKey = ({ text, font, dpr }) => `${dpr}|${font}|${text}`

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

    let context = canvas.getContext("2d")
    if (!context) return null
    context.font = font
    const metrics = context.measureText(text)
    const fontSize = getFontSize(font)
    const ascent = Math.ceil(metrics.actualBoundingBoxAscent || fontSize)
    const descent = Math.ceil(metrics.actualBoundingBoxDescent || fontSize * 0.3)
    const widthCss = Math.max(1, Math.ceil(metrics.width) + ATLAS_PADDING * 2)
    const heightCss = Math.max(1, ascent + descent + ATLAS_PADDING * 2)
    const width = Math.max(1, Math.ceil(widthCss * dpr))
    const height = Math.max(1, Math.ceil(heightCss * dpr))

    canvas.width = width
    canvas.height = height
    context = canvas.getContext("2d")
    if (!context) return null
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.clearRect(0, 0, widthCss, heightCss)
    context.font = font
    context.textAlign = "left"
    context.textBaseline = "alphabetic"
    context.fillStyle = "#ffffff"
    context.fillText(text, ATLAS_PADDING, ATLAS_PADDING + ascent)

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
