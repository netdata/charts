import shader from "./shader"

const UNIFORM_SIZE = 128

const makePipeline = async runtime => {
  const { device, format } = runtime
  const module = device.createShaderModule({ label: "netdata-gauge-shader", code: shader })
  const compilation = await module.getCompilationInfo()
  const errors = compilation.messages.filter(message => message.type === "error")
  if (errors.length) throw new Error(errors.map(({ message }) => message).join("\n"))
  return device.createRenderPipelineAsync({
    label: "netdata-gauge-pipeline",
    layout: "auto",
    vertex: { module, entryPoint: "vertexMain" },
    fragment: {
      module,
      entryPoint: "fragmentMain",
      targets: [
        {
          format,
          blend: {
            color: { operation: "add", srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha" },
            alpha: { operation: "add", srcFactor: "one", dstFactor: "one-minus-src-alpha" },
          },
        },
      ],
    },
    primitive: { topology: "triangle-strip" },
  })
}

export default async (runtime, surface) => {
  const { device, format } = runtime
  const pipeline = await runtime.getPipeline(`netdata-gauge-v1:${format}`, () =>
    makePipeline(runtime)
  )
  const uniform = device.createBuffer({
    label: "netdata-gauge-uniform",
    size: UNIFORM_SIZE,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniform } }],
  })
  let visible = false

  const update = frame => {
    const values = new Float32Array(32)
    values.set(
      [frame.width * frame.dpr, frame.height * frame.dpr, frame.centerX, frame.centerY],
      0
    )
    values.set([frame.centerX, frame.centerY, frame.radius, frame.lineWidth], 4)
    values.set(
      [frame.startAngle, frame.totalSweep, frame.progressSweep, frame.pointerAngle],
      8
    )
    values.set(
      [
        frame.pointerLength,
        frame.pointerWidth,
        frame.gradientEnabled ? 1 : 0,
        frame.dpr,
      ],
      12
    )
    values.set(frame.progressStartColor, 16)
    values.set(frame.progressEndColor, 20)
    values.set(frame.trackColor, 24)
    values.set(frame.pointerColor, 28)
    device.queue.writeBuffer(uniform, 0, values)
    visible = true
  }

  const encode = (pass, size) => {
    if (!visible) return false
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, bindGroup)
    pass.setScissorRect(0, 0, size.width, size.height)
    pass.draw(4)
    return true
  }

  const destroy = () => {
    visible = false
    surface.destroyAfterSubmission(uniform)
  }

  return { update, encode, destroy, getBufferBytes: () => UNIFORM_SIZE }
}
