import makeRenderState from "@/chartLibraries/gpu/visualizations/cartesian/line/renderState"
import areaShader from "../area/shader"
import heatmapShader from "../heatmap/shader"
import stackedShader from "../stacked/shader"
import stackedBarShader from "../stackedBar/shader"
import lineShader from "./shader"
import {
  makeScissor,
  makeUniformData,
  uniformByteLength,
} from "./uniforms"

const nextBufferSize = byteLength => {
  let size = 4
  while (size < byteLength) size *= 2
  return size
}

const makePipeline = async (
  runtime,
  { label, shader, topology = "triangle-list" }
) => {
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
    primitive: { topology },
  })
}

export default async (runtime, surface, { fillMode = null } = {}) => {
  const { device, format } = runtime
  const isMultiBar = fillMode === "multiBar"
  const isHeatmap = fillMode === "heatmap"
  const isBar = fillMode === "stackedBar" || isMultiBar || isHeatmap
  const usesStackedData = fillMode === "stacked" || fillMode === "stackedBar"
  const linePipeline = isBar
    ? null
    : await runtime.getPipeline(`netdata-line-v2:${format}`, () =>
        makePipeline(runtime, { label: "netdata-line", shader: lineShader })
      )
  const fillShader =
    fillMode === "stacked"
      ? stackedShader
      : isHeatmap
        ? heatmapShader
        : isBar
          ? stackedBarShader
          : areaShader
  const fillPipeline = fillMode
    ? await runtime.getPipeline(`netdata-${fillMode}-v1:${format}`, () =>
        makePipeline(runtime, {
          label: `netdata-${fillMode}`,
          shader: fillShader,
          topology: isHeatmap ? "triangle-strip" : "triangle-list",
        })
      )
    : null
  const buffers = {}
  const bindGroups = { fill: null, line: null }
  let drawLayout = { instanceCount: 0 }
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
    barWidth = 0,
    heatmapMax = 0,
    stepped,
    smooth,
  }) => {
    const uniform = ensureBuffer(
      "uniform",
      uniformByteLength,
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    )
    const x = ensureBuffer("x", packed.x.byteLength, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST)
    const y = ensureBuffer("y", packed.y.byteLength, GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST)
    const color = ensureBuffer(
      "color",
      colors.byteLength,
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    )
    const base =
      usesStackedData
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

    const renderState = makeRenderState({
      packed,
      fillMode,
      afterMs,
      beforeMs,
      minimum: min,
      maximum: max,
      width,
      height,
      dpr,
      plot,
      fillAlpha,
      lineWidth,
      barWidth,
      heatmapMaximum: heatmapMax,
      stepped,
      smooth,
    })
    drawLayout = renderState.drawLayout
    drawStats = renderState.drawStats
    device.queue.writeBuffer(
      uniform,
      0,
      makeUniformData({ packed, drawLayout, ...renderState })
    )
    scissor = makeScissor(renderState)

    const makeBindGroup = (pipeline, includeBase = false) => {
      const entries = [
        { binding: 0, resource: { buffer: uniform } },
        { binding: 1, resource: { buffer: x } },
        { binding: 2, resource: { buffer: y } },
        { binding: 3, resource: { buffer: color } },
      ]
      if (includeBase)
        entries.push({ binding: 4, resource: { buffer: base || y } })
      return device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries })
    }
    if (linePipeline && !bindGroups.line) bindGroups.line = makeBindGroup(linePipeline)
    if (fillPipeline && !bindGroups.fill)
      bindGroups.fill = makeBindGroup(
        fillPipeline,
        fillMode === "stacked" || (isBar && !isHeatmap)
      )
  }

  const encode = pass => {
    if (!drawLayout.instanceCount) return false

    pass.setScissorRect(scissor.left, scissor.top, scissor.width, scissor.height)
    if (drawLayout.fillInstanceCount) {
      pass.setPipeline(fillPipeline)
      pass.setBindGroup(0, bindGroups.fill)
      pass.draw(isHeatmap ? 4 : 6, drawLayout.fillInstanceCount)
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
    drawLayout = { instanceCount: 0 }
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
