import lineShader from "./shader"
import { makeCurveSegments, makeDrawLayout } from "./geometry"

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

export default async (runtime, surface) => {
  const { device, format } = runtime
  const pipeline = await runtime.getPipeline(`netdata-line-v1:${format}`, () =>
    makePipeline(runtime)
  )
  const buffers = {}
  let bindGroup = null
  let drawLayout = makeDrawLayout({ pointCount: 0, seriesCount: 0, stepped: false })
  let bufferBytes = 0
  let scissor = { left: 0, top: 0, width: 1, height: 1 }

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
    if (current) surface.destroyAfterSubmission(current)
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
    plot = { left: 0, top: 0, width, height },
    lineWidth,
    stepped,
    smooth,
  }) => {
    const canvasWidth = Math.max(1, Math.round(width * dpr))
    const canvasHeight = Math.max(1, Math.round(height * dpr))
    const plotLeft = Math.max(0, Math.round(plot.left * dpr))
    const plotTop = Math.max(0, Math.round(plot.top * dpr))
    const plotWidth = Math.max(1, Math.round(plot.width * dpr))
    const plotHeight = Math.max(1, Math.round(plot.height * dpr))

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
      smooth,
      curveSegments: makeCurveSegments({
        pointCount: packed.pointCount,
        plotWidth: plotWidth,
      }),
    })
    const [rawRangeMin, rawRangeMax] = normalizeRange(min, max)
    const rangeMin = (rawRangeMin - packed.yOrigin) / packed.yScale
    const rangeMax = (rawRangeMax - packed.yOrigin) / packed.yScale
    const uniformData = new ArrayBuffer(64)
    const floats = new Float32Array(uniformData)
    const integers = new Uint32Array(uniformData)
    floats.set([
      (afterMs - packed.xOriginMs) / 1000,
      (beforeMs - packed.xOriginMs) / 1000,
      rangeMin,
      rangeMax,
      plotLeft,
      plotTop,
      plotWidth,
      plotHeight,
      canvasWidth,
      canvasHeight,
      lineWidth * dpr,
      stepped ? 1 : smooth ? 2 : 0,
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
    scissor = {
      left: Math.min(plotLeft, canvasWidth - 1),
      top: Math.min(plotTop, canvasHeight - 1),
      width: Math.max(1, Math.min(plotWidth, canvasWidth - plotLeft)),
      height: Math.max(1, Math.min(plotHeight, canvasHeight - plotTop)),
    }

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

  const encode = pass => {
    const hasGeometry = Boolean(bindGroup && drawLayout.instanceCount)
    if (!hasGeometry) return false

    pass.setPipeline(pipeline)
    pass.setBindGroup(0, bindGroup)
    pass.setScissorRect(scissor.left, scissor.top, scissor.width, scissor.height)
    pass.draw(6, drawLayout.instanceCount)
    return true
  }

  const destroy = () => {
    Object.values(buffers).forEach(surface.destroyAfterSubmission)
    Object.keys(buffers).forEach(name => delete buffers[name])
    bindGroup = null
    drawLayout = makeDrawLayout({ pointCount: 0, seriesCount: 0, stepped: false })
    bufferBytes = 0
  }

  return {
    update,
    encode,
    destroy,
    getBufferBytes: () => bufferBytes,
  }
}
