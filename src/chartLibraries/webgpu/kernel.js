import lineShader from "./shader"
import { makeDrawLayout } from "./geometry"

const nextBufferSize = byteLength => {
  let size = 4
  while (size < byteLength) size *= 2
  return size
}

const normalizeRange = (min, max) => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [-1, 1]
  if (min !== max) return [min, max]
  const padding = Math.abs(min || 1) * 0.01
  return [min - padding, max + padding]
}

const makePipeline = async runtime => {
  const { device, format } = runtime
  const module = device.createShaderModule({ label: "netdata-line-shader", code: lineShader })
  const compilation = await module.getCompilationInfo()
  const errors = compilation.messages.filter(message => message.type === "error")
  if (errors.length) throw new Error(errors.map(({ message }) => message).join("\n"))

  return device.createRenderPipelineAsync({
    label: "netdata-line-pipeline",
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

export default async (runtime, canvas) => {
  const { device, format } = runtime
  const context = canvas.getContext("webgpu")
  if (!context) throw new Error("Unable to create a WebGPU canvas context")

  context.configure({ device, format, alphaMode: "premultiplied" })
  const pipeline = await runtime.getPipeline(`netdata-line-v1:${format}`, () =>
    makePipeline(runtime)
  )
  const buffers = {}
  let bindGroup = null
  let drawLayout = makeDrawLayout({ pointCount: 0, seriesCount: 0, stepped: false })
  let submission = Promise.resolve()
  let bufferBytes = 0

  const destroyAfterSubmission = buffer =>
    submission.then(
      () => buffer.destroy(),
      () => buffer.destroy()
    )

  const ensureBuffer = (name, byteLength, usage) => {
    const current = buffers[name]
    if (current && current.size >= byteLength) return current

    const next = device.createBuffer({
      label: `netdata-line-${name}`,
      size: nextBufferSize(byteLength),
      usage,
    })
    buffers[name] = next
    bindGroup = null
    bufferBytes += next.size - (current?.size || 0)
    if (current) destroyAfterSubmission(current)
    return next
  }

  const update = ({
    packed,
    colors,
    dataChanged,
    colorsChanged,
    afterMs,
    beforeMs,
    min,
    max,
    width,
    height,
    dpr,
    lineWidth,
    stepped,
  }) => {
    const canvasWidth = Math.max(1, Math.round(width * dpr))
    const canvasHeight = Math.max(1, Math.round(height * dpr))
    if (canvas.width !== canvasWidth) canvas.width = canvasWidth
    if (canvas.height !== canvasHeight) canvas.height = canvasHeight

    const uniform = ensureBuffer("uniform", 64, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST)
    const x = ensureBuffer("x", packed.x.byteLength, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST)
    const y = ensureBuffer("y", packed.y.byteLength, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST)
    const color = ensureBuffer(
      "color",
      colors.byteLength,
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    )

    if (dataChanged) {
      device.queue.writeBuffer(x, 0, packed.x)
      device.queue.writeBuffer(y, 0, packed.y)
    }
    if (colorsChanged) device.queue.writeBuffer(color, 0, colors)

    drawLayout = makeDrawLayout({
      pointCount: packed.pointCount,
      seriesCount: packed.seriesCount,
      stepped,
    })
    const [rangeMin, rangeMax] = normalizeRange(min, max)
    const uniformData = new ArrayBuffer(64)
    const floats = new Float32Array(uniformData)
    const integers = new Uint32Array(uniformData)
    floats.set([
      (afterMs - packed.xOriginMs) / 1000,
      (beforeMs - packed.xOriginMs) / 1000,
      rangeMin,
      rangeMax,
      0,
      0,
      canvasWidth,
      canvasHeight,
      canvasWidth,
      canvasHeight,
      lineWidth * dpr,
      0,
    ])
    integers.set(
      [
        packed.pointCount,
        packed.seriesCount,
        drawLayout.segmentsPerPair,
        drawLayout.segmentsPerSeries,
      ],
      12
    )
    device.queue.writeBuffer(uniform, 0, uniformData)

    if (!bindGroup) {
      bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: uniform } },
          { binding: 1, resource: { buffer: x } },
          { binding: 2, resource: { buffer: y } },
          { binding: 3, resource: { buffer: color } },
        ],
      })
    }
  }

  const draw = ({ clearOnly = false } = {}) => {
    const encoder = device.createCommandEncoder({ label: "netdata-line-frame" })
    const pass = encoder.beginRenderPass({
      label: "netdata-line-pass",
      colorAttachments: [
        {
          view: context.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    })
    const hasGeometry = Boolean(!clearOnly && bindGroup && drawLayout.instanceCount)
    if (hasGeometry) {
      pass.setPipeline(pipeline)
      pass.setBindGroup(0, bindGroup)
      pass.setScissorRect(0, 0, canvas.width, canvas.height)
      pass.draw(6, drawLayout.instanceCount)
    }
    pass.end()
    device.queue.submit([encoder.finish()])
    submission = device.queue.onSubmittedWorkDone()
    return Boolean(hasGeometry)
  }

  const destroy = () => {
    context.unconfigure()
    Object.values(buffers).forEach(destroyAfterSubmission)
    bindGroup = null
    bufferBytes = 0
  }

  return {
    update,
    draw,
    clear: () => draw({ clearOnly: true }),
    destroy,
    getQueueDone: () => submission,
    getBufferBytes: () => bufferBytes,
  }
}
