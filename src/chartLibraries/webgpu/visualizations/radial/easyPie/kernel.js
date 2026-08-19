import shader from "./shader"

const UNIFORM_SIZE = 96

const makePipeline = async runtime => {
  const { device, format } = runtime
  const module = device.createShaderModule({ label: "netdata-easy-pie-shader", code: shader })
  const compilation = await module.getCompilationInfo()
  const errors = compilation.messages.filter(message => message.type === "error")
  if (errors.length) throw new Error(errors.map(({ message }) => message).join("\n"))

  return device.createRenderPipelineAsync({
    label: "netdata-easy-pie-pipeline",
    layout: "auto",
    vertex: { module, entryPoint: "vertexMain" },
    fragment: {
      module,
      entryPoint: "fragmentMain",
      targets: [
        {
          format,
          blend: {
            color: {
              operation: "add",
              srcFactor: "src-alpha",
              dstFactor: "one-minus-src-alpha",
            },
            alpha: {
              operation: "add",
              srcFactor: "one",
              dstFactor: "one-minus-src-alpha",
            },
          },
        },
      ],
    },
    primitive: { topology: "triangle-strip" },
  })
}

export default async (runtime, surface) => {
  const { device, format } = runtime
  const pipeline = await runtime.getPipeline(`netdata-easy-pie-v1:${format}`, () =>
    makePipeline(runtime)
  )
  const uniform = device.createBuffer({
    label: "netdata-easy-pie-uniform",
    size: UNIFORM_SIZE,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniform } }],
  })
  let visible = false
  let scissor = { left: 0, top: 0, width: 1, height: 1 }

  const update = frame => {
    const canvasWidth = Math.max(1, Math.round(frame.width * frame.dpr))
    const canvasHeight = Math.max(1, Math.round(frame.height * frame.dpr))
    const halfSize = frame.size * 0.5 + 1
    const left = Math.max(0, Math.floor(frame.centerX - halfSize))
    const top = Math.max(0, Math.floor(frame.centerY - halfSize))
    const right = Math.min(canvasWidth, Math.ceil(frame.centerX + halfSize))
    const bottom = Math.min(canvasHeight, Math.ceil(frame.centerY + halfSize))
    scissor = {
      left: Math.min(left, canvasWidth - 1),
      top: Math.min(top, canvasHeight - 1),
      width: Math.max(1, right - left),
      height: Math.max(1, bottom - top),
    }

    const values = new Float32Array(24)
    values.set([canvasWidth, canvasHeight, frame.centerX, frame.centerY], 0)
    values.set([frame.size, frame.radius, frame.lineWidth, frame.scaleLength], 4)
    values.set(
      [
        frame.sweep,
        frame.scaleEnabled ? 1 : 0,
        frame.trackEnabled ? 1 : 0,
        frame.dpr,
      ],
      8
    )
    values.set(frame.barColor, 12)
    values.set(frame.trackColor, 16)
    values.set(frame.scaleColor, 20)
    device.queue.writeBuffer(uniform, 0, values)
    visible = true
  }

  const encode = pass => {
    if (!visible) return false
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, bindGroup)
    pass.setScissorRect(scissor.left, scissor.top, scissor.width, scissor.height)
    pass.draw(4)
    return true
  }

  const destroy = () => {
    visible = false
    surface.destroyAfterSubmission(uniform)
  }

  return {
    update,
    encode,
    destroy,
    getBufferBytes: () => UNIFORM_SIZE,
  }
}
