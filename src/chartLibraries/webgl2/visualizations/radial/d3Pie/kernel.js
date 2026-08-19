import { fragmentShader, vertexShader } from "./shader"

const MAX_SEGMENTS = 6

export default async surface => {
  const { gl } = surface
  const program = await surface.getProgram("d3pie-v1", vertexShader, fragmentShader)
  const vertexArray = gl.createVertexArray()
  const uniforms = Object.fromEntries(
    [
      "uCanvas",
      "uGeometry",
      "uStrokeColor",
      "uSegmentGeometry[0]",
      "uSegmentColors[0]",
    ].map(name => [name, gl.getUniformLocation(program, name)])
  )
  let frame = null

  const update = nextFrame => {
    if (nextFrame.segments.length > MAX_SEGMENTS)
      throw new Error(`GPU D3 Pie supports at most ${MAX_SEGMENTS} grouped segments`)
    const segmentGeometry = new Float32Array(MAX_SEGMENTS * 4)
    const segmentColors = new Float32Array(MAX_SEGMENTS * 4)
    nextFrame.segments.forEach((segment, index) => {
      segmentGeometry.set(
        [segment.startAngle, segment.endAngle, segment.offsetX, segment.offsetY],
        index * 4
      )
      segmentColors.set(segment.color, index * 4)
    })
    frame = {
      canvas: [
        nextFrame.width * nextFrame.dpr,
        nextFrame.height * nextFrame.dpr,
        nextFrame.centerX,
        nextFrame.centerY,
      ],
      geometry: [
        nextFrame.innerRadius,
        nextFrame.outerRadius,
        nextFrame.strokeWidth,
        nextFrame.segments.length,
      ],
      strokeColor: nextFrame.strokeColor,
      segmentGeometry,
      segmentColors,
    }
  }

  const draw = size => {
    if (!frame) return false
    gl.useProgram(program)
    gl.bindVertexArray(vertexArray)
    gl.uniform4fv(uniforms.uCanvas, frame.canvas)
    gl.uniform4fv(uniforms.uGeometry, frame.geometry)
    gl.uniform4fv(uniforms.uStrokeColor, frame.strokeColor)
    gl.uniform4fv(uniforms["uSegmentGeometry[0]"], frame.segmentGeometry)
    gl.uniform4fv(uniforms["uSegmentColors[0]"], frame.segmentColors)
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
