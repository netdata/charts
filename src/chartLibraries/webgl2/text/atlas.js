import makeBoundedCache from "@/chartLibraries/gpu/text/cache"
import {
  makeRasterCanvas,
  makeTextCacheKey,
  rasterizeText,
} from "@/chartLibraries/gpu/text"

const ATLAS_SIZE = 1024
const ATLAS_PADDING = 2
const CACHE_MAX = 1024

export default gl => {
  const size = Math.min(ATLAS_SIZE, gl.getParameter(gl.MAX_TEXTURE_SIZE))
  const canvas = makeRasterCanvas()
  const texture = gl.createTexture()
  let generation = 0
  let x = ATLAS_PADDING
  let y = ATLAS_PADDING
  let rowHeight = 0
  let destroyed = false
  const cache = makeBoundedCache(CACHE_MAX)

  const reset = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      size,
      size,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    )
    generation += 1
    x = ATLAS_PADDING
    y = ATLAS_PADDING
    rowHeight = 0
    cache.clear()
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
    const { width, height, pixelWidth, pixelHeight } = shaped
    let allocation = allocate(pixelWidth, pixelHeight)
    if (!allocation) {
      reset()
      allocation = allocate(pixelWidth, pixelHeight)
    }
    if (!allocation) return null

    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      allocation.x,
      allocation.y,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      canvas
    )

    const entry = {
      generation,
      width,
      height,
      u0: allocation.x / size,
      v0: allocation.y / size,
      u1: (allocation.x + pixelWidth) / size,
      v1: (allocation.y + pixelHeight) / size,
    }
    cache.set(key, entry)
    return entry
  }

  const destroy = () => {
    if (destroyed) return
    destroyed = true
    cache.clear()
    gl.deleteTexture(texture)
  }

  reset()
  return {
    texture,
    rasterize,
    destroy,
    get generation() {
      return generation
    },
  }
}
