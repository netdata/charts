import { makeCurveSegments, makeDrawLayout } from "@/chartLibraries/gpu/visualizations/cartesian/line/geometry"
import areaShader from "../area/shader"
import stackedShader from "../stacked/shader"
import lineShader from "./shader"

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

const makePipeline = async (runtime, { label, shader }) => {
  const { device, format } = runtime
  const module = device.createShaderModule({ label: `${label}-shader`, code: shader })
  const compilation = await module.getCompilationInfo()
  const errors = compilation.messages.filter(message => message.type === "error")
  if (errors.length) throw new Error(errors.map(({ message }) => message).join("\n"))

  return device.createRenderPipelineAsync({
    label: `${label}-pipeline`,
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

export default async (runtime, surface, { fillMode = null } = {}) => {
  const { device, format } = runtime
  const linePipeline = await runtime.getPipeline(`netdata-line-v2:${format}`, () =>
    makePipeline(runtime, { label: "netdata-line", shader: lineShader })
  )
  const fillPipeline = fillMode
    ? await runtime.getPipeline(`netdata-${fillMode}-v1:${format}`, () =>
        makePipeline(runtime, {
          label: `netdata-${fillMode}`,
          shader: fillMode === "stacked" ? stackedShader : areaShader,
        })
      )
    : null
  const buffers = {}
  const bindGroups = { fill: null, line: null }
  let drawLayout = makeDrawLayout({ pointCount: 0, seriesCount: 0, stepped: false })
  let drawStats = null
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
    bindGroups.fill = null
    bindGroups.line = null
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
    fillAlpha = 0,
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

    const uniform = ensureBuffer("uniform", 80, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST)
    const x = ensureBuffer("x", packed.x.byteLength, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST)
    const y = ensureBuffer("y", packed.y.byteLength, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST)
    const color = ensureBuffer(
      "color",
      colors.byteLength,
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    )
    const base =
      fillMode === "stacked"
        ? ensureBuffer(
            "base",
            packed.base.byteLength,
            GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
          )
        : null

    if (dataChanged) {
      device.queue.writeBuffer(x, 0, packed.x)
      device.queue.writeBuffer(y, 0, packed.y)
      if (base) device.queue.writeBuffer(base, 0, packed.base)
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
      filled: Boolean(fillMode && fillAlpha > 0),
      stroke: lineWidth > 0,
    })
    drawStats = {
      pointCount: packed.pointCount,
      seriesCount: packed.seriesCount,
      sourcePairs: Math.max(0, packed.pointCount - 1) * packed.seriesCount,
      ...drawLayout,
    }
    const [rawRangeMin, rawRangeMax] = normalizeRange(min, max)
    const rangeMin = (rawRangeMin - packed.yOrigin) / packed.yScale
    const rangeMax = (rawRangeMax - packed.yOrigin) / packed.yScale
    const uniformData = new ArrayBuffer(80)
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
      (0 - packed.yOrigin) / packed.yScale,
      fillAlpha,
      fillMode === "stacked" ? 1 : 0,
      0,
    ])
    integers.set(
      [
        packed.pointCount,
        packed.seriesCount,
        drawLayout.segmentsPerPair,
        drawLayout.segmentsPerSeries,
      ],
      16
    )
    device.queue.writeBuffer(uniform, 0, uniformData)
    scissor = {
      left: Math.min(plotLeft, canvasWidth - 1),
      top: Math.min(plotTop, canvasHeight - 1),
      width: Math.max(1, Math.min(plotWidth, canvasWidth - plotLeft)),
      height: Math.max(1, Math.min(plotHeight, canvasHeight - plotTop)),
    }

    const makeBindGroup = (pipeline, includeBase = false) => {
      const entries = [
        { binding: 0, resource: { buffer: uniform } },
        { binding: 1, resource: { buffer: x } },
        { binding: 2, resource: { buffer: y } },
        { binding: 3, resource: { buffer: color } },
      ]
      if (includeBase) entries.push({ binding: 4, resource: { buffer: base } })
      return device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries })
    }
    if (!bindGroups.line) bindGroups.line = makeBindGroup(linePipeline)
    if (fillPipeline && !bindGroups.fill)
      bindGroups.fill = makeBindGroup(fillPipeline, fillMode === "stacked")
  }

  const encode = pass => {
    if (!drawLayout.instanceCount) return false

    pass.setScissorRect(scissor.left, scissor.top, scissor.width, scissor.height)
    if (drawLayout.fillInstanceCount) {
      pass.setPipeline(fillPipeline)
      pass.setBindGroup(0, bindGroups.fill)
      pass.draw(6, drawLayout.fillInstanceCount)
    }
    if (drawLayout.strokeInstanceCount) {
      pass.setPipeline(linePipeline)
      pass.setBindGroup(0, bindGroups.line)
      pass.draw(6, drawLayout.strokeInstanceCount)
    }
    return true
  }

  const destroy = () => {
    Object.values(buffers).forEach(surface.destroyAfterSubmission)
    Object.keys(buffers).forEach(name => delete buffers[name])
    bindGroups.fill = null
    bindGroups.line = null
    drawLayout = makeDrawLayout({ pointCount: 0, seriesCount: 0, stepped: false })
    drawStats = null
    bufferBytes = 0
  }

  return {
    update,
    encode,
    destroy,
    getBufferBytes: () => bufferBytes,
    getDrawStats: () => drawStats,
  }
}
