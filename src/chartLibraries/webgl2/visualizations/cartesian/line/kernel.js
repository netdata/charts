import {
  makeCurveSegments,
  makeDrawLayout,
} from "@/chartLibraries/gpu/visualizations/cartesian/line/geometry"
import { getSharedVisualizationProgram } from "@/chartLibraries/webgl2/engine/programs"
import makeUniformWriter from "@/chartLibraries/webgl2/engine/uniforms"
import { updateTexture } from "./textures"
import makeUniformValues from "./uniforms"
import {
  fragmentShader as heatmapFragmentShader,
  vertexShader as heatmapVertexShader,
} from "../heatmap/shader"

const normalizeRange = (min, max) => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [-1, 1]
  if (min !== max) return [min, max]
  const padding = Math.abs(min || 1) * 0.01
  return [min - padding, max + padding]
}

export default async (surface, { fillMode = null } = {}) => {
  const { gl } = surface
  const isMultiBar = fillMode === "multiBar"
  const isHeatmap = fillMode === "heatmap"
  const isBar = fillMode === "stackedBar" || isMultiBar || isHeatmap
  const usesStackedData = fillMode === "stacked" || fillMode === "stackedBar"
  const program = isHeatmap
    ? await surface.getProgram(
        "heatmap-v1",
        heatmapVertexShader,
        heatmapFragmentShader
      )
    : await getSharedVisualizationProgram(surface)
  const vertexArray = gl.createVertexArray()
  const textures = {
    x: gl.createTexture(),
    y: gl.createTexture(),
    color: gl.createTexture(),
    ...(usesStackedData && { base: gl.createTexture() }),
  }
  const textureStates = {
    x: { width: 0, height: 0, byteLength: 0 },
    y: { width: 0, height: 0, byteLength: 0 },
    color: { width: 0, height: 0, byteLength: 0 },
    ...(usesStackedData && {
      base: { width: 0, height: 0, byteLength: 0 },
    }),
  }
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
  const writeUniforms = makeUniformWriter(gl, program, {
    uPassType: "int",
    uXValues: "int",
    uYValues: "int",
    uSeriesColors: "int",
    uBaseValues: "int",
    uXTextureSize: "ivec2",
    uYTextureSize: "ivec2",
    uColorTextureSize: "ivec2",
    uBaseTextureSize: "ivec2",
    uDomain: "vec4",
    uPlot: "vec4",
    uCanvas: "vec4",
    uFill: isHeatmap ? "vec4" : "vec3",
    uCounts: "uvec4",
  })
  let drawState = null
  let bufferBytes = 0

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
    const canvasWidth = Math.max(1, Math.round(width * dpr))
    const canvasHeight = Math.max(1, Math.round(height * dpr))
    const plotLeft = Math.max(0, Math.round(plot.left * dpr))
    const plotTop = Math.max(0, Math.round(plot.top * dpr))
    const plotWidth = Math.max(1, Math.round(plot.width * dpr))
    const plotHeight = Math.max(1, Math.round(plot.height * dpr))

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    if (dataChanged) {
      gl.activeTexture(gl.TEXTURE0)
      updateTexture({
        gl,
        texture: textures.x,
        state: textureStates.x,
        values: packed.x,
        components: 1,
        internalFormat: gl.R32F,
        format: gl.RED,
        maxTextureSize,
      })
      gl.activeTexture(gl.TEXTURE1)
      updateTexture({
        gl,
        texture: textures.y,
        state: textureStates.y,
        values: packed.y,
        components: 1,
        internalFormat: gl.R32F,
        format: gl.RED,
        maxTextureSize,
      })
      if (usesStackedData) {
        gl.activeTexture(gl.TEXTURE3)
        updateTexture({
          gl,
          texture: textures.base,
          state: textureStates.base,
          values: packed.base,
          components: 1,
          internalFormat: gl.R32F,
          format: gl.RED,
          maxTextureSize,
        })
      }
    }
    if (colorsChanged) {
      gl.activeTexture(gl.TEXTURE2)
      updateTexture({
        gl,
        texture: textures.color,
        state: textureStates.color,
        values: colors,
        components: 4,
        internalFormat: gl.RGBA32F,
        format: gl.RGBA,
        maxTextureSize,
      })
    }
    bufferBytes = Object.values(textureStates).reduce(
      (total, state) => total + state.byteLength,
      0
    )

    const drawLayout = isBar
      ? {
          instanceCount: packed.pointCount * packed.seriesCount,
          fillInstanceCount: packed.pointCount * packed.seriesCount,
          strokeInstanceCount: 0,
          segmentsPerPair: 0,
          segmentsPerSeries: 0,
        }
      : makeDrawLayout({
          pointCount: packed.pointCount,
          seriesCount: packed.seriesCount,
          stepped,
          smooth,
          curveSegments: makeCurveSegments({ pointCount: packed.pointCount, plotWidth }),
          filled: Boolean(fillMode && fillAlpha > 0),
          stroke: lineWidth > 0,
        })
    const [rawRangeMin, rawRangeMax] = normalizeRange(min, max)
    drawState = {
      domain: {
        after: (afterMs - packed.xOriginMs) / 1000,
        before: (beforeMs - packed.xOriginMs) / 1000,
        minimum: (rawRangeMin - packed.yOrigin) / packed.yScale,
        maximum: (rawRangeMax - packed.yOrigin) / packed.yScale,
      },
      plot: {
        left: plotLeft,
        top: plotTop,
        width: plotWidth,
        height: plotHeight,
      },
      canvas: {
        width: canvasWidth,
        height: canvasHeight,
        lineWidth: lineWidth * dpr,
        mode: stepped ? 1 : smooth ? 2 : 0,
      },
      fill: {
        baseline: isBar
          ? barWidth * dpr
          : (0 - packed.yOrigin) / packed.yScale,
        opacity: isMultiBar
          ? (0 - packed.yOrigin) / packed.yScale
          : fillAlpha,
        mode: usesStackedData ? 1 : isMultiBar ? 2 : isHeatmap ? 3 : 0,
        heatmapMaximum: isHeatmap ? heatmapMax : 0,
      },
      fillPass: fillMode === "stacked" ? 3 : isBar ? 4 : 2,
      counts: {
        points: packed.pointCount,
        series: packed.seriesCount,
        segmentsPerPair: drawLayout.segmentsPerPair,
        segmentsPerSeries: drawLayout.segmentsPerSeries,
      },
      fillInstanceCount: drawLayout.fillInstanceCount,
      strokeInstanceCount: drawLayout.strokeInstanceCount,
      instanceCount: drawLayout.instanceCount,
      drawStats: {
        pointCount: packed.pointCount,
        seriesCount: packed.seriesCount,
        sourcePairs: Math.max(0, packed.pointCount - 1) * packed.seriesCount,
        barInstanceCount: isBar ? packed.pointCount * packed.seriesCount : 0,
        barWidth: isBar ? barWidth : null,
        valueRange: [min, max],
        ...drawLayout,
      },
    }
  }

  const draw = size => {
    if (!drawState?.instanceCount) return false
    gl.useProgram(program)
    gl.bindVertexArray(vertexArray)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, textures.x)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, textures.y)
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, textures.color)
    if (usesStackedData) {
      gl.activeTexture(gl.TEXTURE3)
      gl.bindTexture(gl.TEXTURE_2D, textures.base)
    } else if (isMultiBar) {
      gl.activeTexture(gl.TEXTURE3)
      gl.bindTexture(gl.TEXTURE_2D, textures.y)
    }
    writeUniforms(
      makeUniformValues({
        frame: drawState,
        textureStates,
        usesStackedData,
        isMultiBar,
        isHeatmap,
      })
    )
    gl.enable(gl.SCISSOR_TEST)
    gl.scissor(
      drawState.plot.left,
      size.height - drawState.plot.top - drawState.plot.height,
      drawState.plot.width,
      drawState.plot.height
    )
    if (drawState.fillInstanceCount) {
      writeUniforms({ uPassType: drawState.fillPass })
      gl.drawArraysInstanced(
        isHeatmap ? gl.TRIANGLE_STRIP : gl.TRIANGLES,
        0,
        isHeatmap ? 4 : 6,
        drawState.fillInstanceCount
      )
    }
    if (drawState.strokeInstanceCount) {
      writeUniforms({ uPassType: 0 })
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, drawState.strokeInstanceCount)
    }
    gl.bindVertexArray(null)
    return true
  }

  const destroy = () => {
    Object.values(textures).forEach(texture => gl.deleteTexture(texture))
    gl.deleteVertexArray(vertexArray)
    drawState = null
    bufferBytes = 0
  }

  return {
    update,
    draw,
    destroy,
    getBufferBytes: () => bufferBytes,
    getDrawStats: () => drawState?.drawStats || null,
  }
}
