import shader from "./shader"

const MAX_SEGMENTS = 6
const UNIFORM_SIZE = 256

const makePipeline = async runtime => {
  const { device, format } = runtime
  const module = device.createShaderModule({ label: "netdata-d3pie-shader", code: shader })
  const compilation = await module.getCompilationInfo()
  const errors = compilation.messages.filter(message => message.type === "error")
  if (errors.length) throw new Error(errors.map(({ message }) => message).join("\n"))
  return device.createRenderPipelineAsync({
    label: "netdata-d3pie-pipeline",
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
  const pipeline = await runtime.getPipeline(`netdata-d3pie-v1:${format}`, () =>
    makePipeline(runtime)
  )
  const uniform = device.createBuffer({
    label: "netdata-d3pie-uniform",
    size: UNIFORM_SIZE,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  })
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniform } }],
  })
  let visible = false

  const update = frame => {
    if (frame.segments.length > MAX_SEGMENTS)
      throw new Error(`GPU D3 Pie supports at most ${MAX_SEGMENTS} grouped segments`)
    const values = new Float32Array(UNIFORM_SIZE / 4)
    values.set(
      [frame.width * frame.dpr, frame.height * frame.dpr, frame.centerX, frame.centerY],
      0
    )
    values.set(
      [frame.innerRadius, frame.outerRadius, frame.strokeWidth, frame.segments.length],
      4
    )
    values.set(frame.strokeColor, 8)
    frame.segments.forEach((segment, index) => {
      const offset = 12 + index * 8
      values.set(
        [segment.startAngle, segment.endAngle, segment.offsetX, segment.offsetY],
        offset
      )
      values.set(segment.color, offset + 4)
    })
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
