import { fragmentShader, vertexShader } from "./shader"

export default async surface => {
  const { gl } = surface
  const program = await surface.getProgram("gauge-v1", vertexShader, fragmentShader)
  const vertexArray = gl.createVertexArray()
  const uniforms = Object.fromEntries(
    [
      "uCanvas",
      "uGeometry",
      "uAngles",
      "uPointer",
      "uProgressStartColor",
      "uProgressEndColor",
      "uTrackColor",
      "uPointerColor",
    ].map(name => [name, gl.getUniformLocation(program, name)])
  )
  let frame = null

  const update = nextFrame => {
    frame = {
      canvas: [
        nextFrame.width * nextFrame.dpr,
        nextFrame.height * nextFrame.dpr,
        nextFrame.centerX,
        nextFrame.centerY,
      ],
      geometry: [
        nextFrame.centerX,
        nextFrame.centerY,
        nextFrame.radius,
        nextFrame.lineWidth,
      ],
      angles: [
        nextFrame.startAngle,
        nextFrame.totalSweep,
        nextFrame.progressSweep,
        nextFrame.pointerAngle,
      ],
      pointer: [
        nextFrame.pointerLength,
        nextFrame.pointerWidth,
        nextFrame.gradientEnabled ? 1 : 0,
        nextFrame.dpr,
      ],
      progressStartColor: nextFrame.progressStartColor,
      progressEndColor: nextFrame.progressEndColor,
      trackColor: nextFrame.trackColor,
      pointerColor: nextFrame.pointerColor,
    }
  }

  const draw = size => {
    if (!frame) return false
    gl.useProgram(program)
    gl.bindVertexArray(vertexArray)
    gl.uniform4fv(uniforms.uCanvas, frame.canvas)
    gl.uniform4fv(uniforms.uGeometry, frame.geometry)
    gl.uniform4fv(uniforms.uAngles, frame.angles)
    gl.uniform4fv(uniforms.uPointer, frame.pointer)
    gl.uniform4fv(uniforms.uProgressStartColor, frame.progressStartColor)
    gl.uniform4fv(uniforms.uProgressEndColor, frame.progressEndColor)
    gl.uniform4fv(uniforms.uTrackColor, frame.trackColor)
    gl.uniform4fv(uniforms.uPointerColor, frame.pointerColor)
    gl.enable(gl.SCISSOR_TEST)
    gl.scissor(0, 0, size.width, size.height)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    gl.bindVertexArray(null)
    return true
  }

  const destroy = () => {
    frame = null
    gl.deleteVertexArray(vertexArray)
  }

  return { update, draw, destroy, getBufferBytes: () => 0 }
}
