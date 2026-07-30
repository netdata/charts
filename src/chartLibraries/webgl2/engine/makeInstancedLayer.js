import { getSharedVisualizationProgram } from "./programs"

const nextBufferSize = byteLength => {
  let size = 4
  while (size < byteLength) size *= 2
  return size
}

const makeScissor = ({ scissor, width, height, dpr }) => {
  if (!scissor) return null
  const left = Math.max(0, Math.round(scissor.left * dpr))
  const top = Math.max(0, Math.round(scissor.top * dpr))
  return {
    left: Math.min(left, width - 1),
    top: Math.min(top, height - 1),
    width: Math.max(1, Math.min(Math.round(scissor.width * dpr), width - left)),
    height: Math.max(1, Math.min(Math.round(scissor.height * dpr), height - top)),
  }
}

export default async ({ surface, pack }) => {
  const { gl } = surface
  const program = await getSharedVisualizationProgram(surface)
  const vertexArray = gl.createVertexArray()
  const instances = gl.createBuffer()
  const canvasLocation = gl.getUniformLocation(program, "uCanvas")
  const passLocation = gl.getUniformLocation(program, "uPassType")
  let capacity = 0
  let count = 0
  let scissor = null

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

  const update = ({ items, width, height, dpr, scissor: nextScissor }) => {
    count = items.length
    scissor = makeScissor({
      scissor: nextScissor,
      width: Math.max(1, Math.round(width * dpr)),
      height: Math.max(1, Math.round(height * dpr)),
      dpr,
    })
    if (!count) return

    const packed = pack(items, dpr)
    gl.bindBuffer(gl.ARRAY_BUFFER, instances)
    if (capacity < packed.byteLength) {
      capacity = nextBufferSize(packed.byteLength)
      gl.bufferData(gl.ARRAY_BUFFER, capacity, gl.DYNAMIC_DRAW)
    }
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, packed)
  }

  const draw = size => {
    if (!count) return false
    gl.useProgram(program)
    gl.bindVertexArray(vertexArray)
    gl.uniform1i(passLocation, 1)
    gl.uniform4f(canvasLocation, size.width, size.height, 0, 0)
    gl.enable(gl.SCISSOR_TEST)
    if (scissor)
      gl.scissor(
        scissor.left,
        size.height - scissor.top - scissor.height,
        scissor.width,
        scissor.height
      )
    else gl.scissor(0, 0, size.width, size.height)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count)
    gl.bindVertexArray(null)
    return true
  }

  const destroy = () => {
    gl.deleteBuffer(instances)
    gl.deleteVertexArray(vertexArray)
    capacity = 0
    count = 0
  }

  return { update, draw, destroy, getBufferBytes: () => capacity }
}
