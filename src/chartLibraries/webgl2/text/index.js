import { parseColor } from "@/chartLibraries/gpu/color"
import { placeRasterizedText } from "@/chartLibraries/gpu/text"
import makeAtlas from "./atlas"
import { fragmentShader, vertexShader } from "./shader"

const nextBufferSize = byteLength => {
  let size = 4
  while (size < byteLength) size *= 2
  return size
}

const resolveEntries = (atlas, labels, dpr) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const generation = atlas.generation
    const entries = labels.map(({ text, font = "10px sans-serif" }) =>
      atlas.rasterize({ text: `${text}`, font, dpr })
    )
    if (atlas.generation === generation) return entries
  }
  throw new Error("WebGL2 text atlas cannot fit the active label set")
}

export default async surface => {
  const { gl } = surface
  const [program, atlas] = await Promise.all([
    surface.getProgram("gpu", vertexShader, fragmentShader),
    Promise.resolve(makeAtlas(gl)),
  ])
  const vertexArray = gl.createVertexArray()
  const instances = gl.createBuffer()
  const canvasLocation = gl.getUniformLocation(program, "uCanvas")
  const passLocation = gl.getUniformLocation(program, "uPassType")
  const atlasLocation = gl.getUniformLocation(program, "uAtlas")
  let capacity = 0
  let count = 0
  let atlasGeneration = 0

  gl.bindVertexArray(vertexArray)
  gl.bindBuffer(gl.ARRAY_BUFFER, instances)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 64, 0)
  gl.vertexAttribDivisor(0, 1)
  gl.enableVertexAttribArray(1)
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 64, 16)
  gl.vertexAttribDivisor(1, 1)
  gl.enableVertexAttribArray(2)
  gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 64, 32)
  gl.vertexAttribDivisor(2, 1)
  gl.enableVertexAttribArray(3)
  gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 64, 48)
  gl.vertexAttribDivisor(3, 1)
  gl.bindVertexArray(null)

  const update = ({ labels, dpr }) => {
    count = labels.length
    if (!count) return

    const entries = resolveEntries(atlas, labels, dpr)
    const packed = new Float32Array(count * 16)
    labels.forEach((label, index) => {
      const entry = entries[index]
      if (!entry) return
      const placement = placeRasterizedText({ label, entry, dpr })
      const offset = index * 16
      packed.set(
        [
          placement.x,
          placement.y,
          placement.width,
          placement.height,
          entry.u0,
          entry.v0,
          entry.u1,
          entry.v1,
        ],
        offset
      )
      packed.set(parseColor(label.color), offset + 8)
      packed[offset + 12] = 2
    })

    gl.bindBuffer(gl.ARRAY_BUFFER, instances)
    if (capacity < packed.byteLength) {
      capacity = nextBufferSize(packed.byteLength)
      gl.bufferData(gl.ARRAY_BUFFER, capacity, gl.DYNAMIC_DRAW)
    }
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, packed)
    atlasGeneration = atlas.generation
  }

  const draw = size => {
    if (!count) return false
    gl.useProgram(program)
    gl.bindVertexArray(vertexArray)
    gl.uniform1i(passLocation, 1)
    gl.uniform4f(canvasLocation, size.width, size.height, 0, 0)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, atlas.texture)
    gl.uniform1i(atlasLocation, 0)
    gl.enable(gl.SCISSOR_TEST)
    gl.scissor(0, 0, size.width, size.height)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count)
    gl.bindVertexArray(null)
    return true
  }

  const destroy = () => {
    atlas.destroy()
    gl.deleteBuffer(instances)
    gl.deleteVertexArray(vertexArray)
    capacity = 0
    count = 0
  }

  return {
    update,
    draw,
    destroy,
    needsUpdate: () => atlasGeneration !== atlas.generation,
    getBufferBytes: () => capacity,
  }
}
