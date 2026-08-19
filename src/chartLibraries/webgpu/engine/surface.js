import retireAfterSubmission from "./retirement"

export default (runtime, canvas) => {
  const { device, format } = runtime
  const context = canvas.getContext("webgpu")
  if (!context) throw new Error("Unable to create a WebGPU canvas context")

  context.configure({ device, format, alphaMode: "premultiplied" })
  let submission = Promise.resolve()
  let destroyed = false

  const resize = ({ width, height, dpr }) => {
    const pixelWidth = Math.max(1, Math.round(width * dpr))
    const pixelHeight = Math.max(1, Math.round(height * dpr))
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight
    return { width: pixelWidth, height: pixelHeight, dpr }
  }

  const draw = (layers, frame) => {
    if (destroyed) return false
    const size = resize(frame)
    const encoder = device.createCommandEncoder({ label: "netdata-visualization-frame" })
    const pass = encoder.beginRenderPass({
      label: "netdata-visualization-pass",
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    })

    let rendered = false
    for (const layer of layers) rendered = layer.encode(pass, size) || rendered
    pass.end()
    device.queue.submit([encoder.finish()])
    submission = device.queue.onSubmittedWorkDone()
    return rendered
  }

  const destroyAfterSubmission = resource => retireAfterSubmission(submission, resource)

  const destroy = () => {
    if (destroyed) return
    destroyed = true
    context.unconfigure()
  }

  return {
    draw,
    destroy,
    destroyAfterSubmission,
    getQueueDone: () => submission,
  }
}
