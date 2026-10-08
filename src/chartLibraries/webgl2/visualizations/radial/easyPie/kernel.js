import { fragmentShader, vertexShader } from "./shader"

export default async surface => {
  const { gl } = surface
  const program = await surface.getProgram("easy-pie-v1", vertexShader, fragmentShader)
  const vertexArray = gl.createVertexArray()
  const uniforms = Object.fromEntries(
    [
      "uCanvas",
      "uGeometry",
      "uValues",
      "uBarColor",
      "uTrackColor",
      "uScaleColor",
    ].map(name => [name, gl.getUniformLocation(program, name)])
  )
  let frame = null

  const update = nextFrame => {
    const canvasWidth = Math.max(1, Math.round(nextFrame.width * nextFrame.dpr))
    const canvasHeight = Math.max(1, Math.round(nextFrame.height * nextFrame.dpr))
    const halfSize = nextFrame.size * 0.5 + 1
    const left = Math.max(0, Math.floor(nextFrame.centerX - halfSize))
    const top = Math.max(0, Math.floor(nextFrame.centerY - halfSize))
    const right = Math.min(canvasWidth, Math.ceil(nextFrame.centerX + halfSize))
    const bottom = Math.min(canvasHeight, Math.ceil(nextFrame.centerY + halfSize))
    frame = {
      canvas: [canvasWidth, canvasHeight, nextFrame.centerX, nextFrame.centerY],
      geometry: [
        nextFrame.size,
        nextFrame.radius,
        nextFrame.lineWidth,
        nextFrame.scaleLength,
      ],
      values: [
        nextFrame.sweep,
        nextFrame.scaleEnabled ? 1 : 0,
        nextFrame.trackEnabled ? 1 : 0,
        nextFrame.dpr,
      ],
      barColor: nextFrame.barColor,
      trackColor: nextFrame.trackColor,
      scaleColor: nextFrame.scaleColor,
      scissor: {
        left: Math.min(left, canvasWidth - 1),
        top: Math.min(top, canvasHeight - 1),
        width: Math.max(1, right - left),
        height: Math.max(1, bottom - top),
      },
    }
  }

  const draw = size => {
    if (!frame) return false
    gl.useProgram(program)
    gl.bindVertexArray(vertexArray)
    gl.uniform4fv(uniforms.uCanvas, frame.canvas)
    gl.uniform4fv(uniforms.uGeometry, frame.geometry)
    gl.uniform4fv(uniforms.uValues, frame.values)
    gl.uniform4fv(uniforms.uBarColor, frame.barColor)
    gl.uniform4fv(uniforms.uTrackColor, frame.trackColor)
    gl.uniform4fv(uniforms.uScaleColor, frame.scaleColor)
    gl.enable(gl.SCISSOR_TEST)
    gl.scissor(
      frame.scissor.left,
      size.height - frame.scissor.top - frame.scissor.height,
      frame.scissor.width,
      frame.scissor.height
    )
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    gl.bindVertexArray(null)
    return true
  }

  const destroy = () => {
    frame = null
    gl.deleteVertexArray(vertexArray)
  }

  return {
    update,
    draw,
    destroy,
    getBufferBytes: () => 0,
  }
}
