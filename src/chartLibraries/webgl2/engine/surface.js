export default (runtime, canvas) => {
  const { gl, canvas: source } = runtime
  const context = canvas.getContext("2d")
  if (!gl || !source || !context) throw new Error("Unable to create a WebGL2 presentation surface")

  let destroyed = false

  const resize = ({ width, height, dpr }) => {
    const pixelWidth = Math.max(1, Math.round(width * dpr))
    const pixelHeight = Math.max(1, Math.round(height * dpr))
    if (source.width < pixelWidth) source.width = pixelWidth
    if (source.height < pixelHeight) source.height = pixelHeight
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight
    return { width: pixelWidth, height: pixelHeight, dpr }
  }

  const draw = (layers, frame) => {
    if (destroyed || gl.isContextLost()) return false
    const size = resize(frame)
    gl.viewport(0, 0, size.width, size.height)
    gl.disable(gl.SCISSOR_TEST)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.BLEND)
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA
    )

    let rendered = false
    for (const layer of layers) rendered = layer.draw(size) || rendered
    // drawImage synchronizes its source; finish() would stall every shared-context chart.
    gl.flush()
    context.clearRect(0, 0, size.width, size.height)
    context.drawImage(
      source,
      0,
      source.height - size.height,
      size.width,
      size.height,
      0,
      0,
      size.width,
      size.height
    )
    return rendered
  }

  const destroy = () => {
    destroyed = true
  }

  return {
    gl,
    draw,
    destroy,
    getProgram: (...args) => runtime.getProgram(...args),
    getResource: (...args) => runtime.getResource(...args),
    getQueueDone: () => Promise.resolve(),
  }
}
