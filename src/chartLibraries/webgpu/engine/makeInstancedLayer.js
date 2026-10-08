const nextBufferSize = byteLength => {
  let size = 4
  while (size < byteLength) size *= 2
  return size
}

const makePipeline = async (runtime, key, shader) => {
  const { device, format } = runtime
  const module = device.createShaderModule({ label: `netdata-${key}-shader`, code: shader })
  const compilation = await module.getCompilationInfo()
  const errors = compilation.messages.filter(message => message.type === "error")
  if (errors.length) throw new Error(errors.map(({ message }) => message).join("\n"))

  return device.createRenderPipelineAsync({
    label: `netdata-${key}-pipeline`,
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
    primitive: { topology: "triangle-list" },
  })
}

const makeScissor = ({ scissor, width, height, dpr }) => {
  if (!scissor) return null
  const canvasWidth = Math.max(1, Math.round(width * dpr))
  const canvasHeight = Math.max(1, Math.round(height * dpr))
  const left = Math.max(0, Math.round(scissor.left * dpr))
  const top = Math.max(0, Math.round(scissor.top * dpr))
  return {
    left: Math.min(left, canvasWidth - 1),
    top: Math.min(top, canvasHeight - 1),
    width: Math.max(1, Math.min(Math.round(scissor.width * dpr), canvasWidth - left)),
    height: Math.max(1, Math.min(Math.round(scissor.height * dpr), canvasHeight - top)),
  }
}

export default async ({ runtime, surface, key, label = key, shader, pack }) => {
  const { device, format } = runtime
  const pipeline = await runtime.getPipeline(`netdata-${key}-v1:${format}`, () =>
    makePipeline(runtime, key, shader)
  )
  let uniform = null
  let instances = null
  let bindGroup = null
  let count = 0
  let bufferBytes = 0
  let scissor = null

  const replaceBuffer = (current, next) => {
    bufferBytes += next.size - (current?.size || 0)
    if (current) surface.destroyAfterSubmission(current)
    return next
  }

  const ensureUniform = () => {
    if (uniform) return uniform
    uniform = replaceBuffer(
      uniform,
      device.createBuffer({
        label: `netdata-${label}-uniform`,
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })
    )
    bindGroup = null
    return uniform
  }

  const ensureInstances = byteLength => {
    if (instances && instances.size >= byteLength) return instances
    instances = replaceBuffer(
      instances,
      device.createBuffer({
        label: `netdata-${label}-instances`,
        size: nextBufferSize(byteLength),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      })
    )
    bindGroup = null
    return instances
  }

  const update = ({ items, width, height, dpr, scissor: nextScissor }) => {
    count = items.length
    scissor = makeScissor({ scissor: nextScissor, width, height, dpr })
    if (!count) return

    const packed = pack(items, dpr)
    const uniformBuffer = ensureUniform()
    const instanceBuffer = ensureInstances(packed.byteLength)
    device.queue.writeBuffer(uniformBuffer, 0, new Float32Array([width * dpr, height * dpr, 0, 0]))
    device.queue.writeBuffer(instanceBuffer, 0, packed)

    if (!bindGroup) {
      bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: uniformBuffer } },
          { binding: 1, resource: { buffer: instanceBuffer } },
        ],
      })
    }
  }

  const encode = (pass, size) => {
    if (!count || !bindGroup) return false
    pass.setPipeline(pipeline)
    pass.setBindGroup(0, bindGroup)
    if (scissor)
      pass.setScissorRect(scissor.left, scissor.top, scissor.width, scissor.height)
    else pass.setScissorRect(0, 0, size.width, size.height)
    pass.draw(6, count)
    return true
  }

  const destroy = () => {
    if (uniform) surface.destroyAfterSubmission(uniform)
    if (instances) surface.destroyAfterSubmission(instances)
    uniform = null
    instances = null
    bindGroup = null
    count = 0
    scissor = null
    bufferBytes = 0
  }

  return { update, encode, destroy, getBufferBytes: () => bufferBytes }
}
