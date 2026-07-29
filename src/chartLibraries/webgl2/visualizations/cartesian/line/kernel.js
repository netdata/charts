import {
  makeCurveSegments,
  makeDrawLayout,
} from "@/chartLibraries/gpu/visualizations/cartesian/line/geometry"
import { fragmentShader, vertexShader } from "./shader"

const normalizeRange = (min, max) => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [-1, 1]
  if (min !== max) return [min, max]
  const padding = Math.abs(min || 1) * 0.01
  return [min - padding, max + padding]
}

const makeTextureLayout = (values, components, maxTextureSize) => {
  const texelCount = Math.max(1, Math.ceil(values.length / components))
  const width = Math.min(maxTextureSize, texelCount)
  const height = Math.ceil(texelCount / width)
  if (height > maxTextureSize) throw new Error("WebGL2 texture capacity exceeded")

  const valueCount = width * height * components
  if (values.length === valueCount) return { width, height, values }
  const padded = new values.constructor(valueCount)
  padded.set(values)
  return { width, height, values: padded }
}

const updateTexture = ({
  gl,
  texture,
  state,
  values,
  components,
  internalFormat,
  format,
  maxTextureSize,
}) => {
  const layout = makeTextureLayout(values, components, maxTextureSize)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  if (state.width !== layout.width || state.height !== layout.height) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      layout.width,
      layout.height,
      0,
      format,
      gl.FLOAT,
      layout.values
    )
  } else {
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      layout.width,
      layout.height,
      format,
      gl.FLOAT,
      layout.values
    )
  }
  state.width = layout.width
  state.height = layout.height
  state.byteLength = layout.values.byteLength
}

export default async (surface, { fillMode = null } = {}) => {
  const { gl } = surface
  const isBar = fillMode === "stackedBar"
  const usesStackedData = fillMode === "stacked" || isBar
  const program = await surface.getProgram("gpu", vertexShader, fragmentShader)
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
  const uniforms = Object.fromEntries(
    [
      "uPassType",
      "uXValues",
      "uYValues",
      "uSeriesColors",
      "uBaseValues",
      "uXTextureSize",
      "uYTextureSize",
      "uColorTextureSize",
      "uBaseTextureSize",
      "uDomain",
      "uPlot",
      "uCanvas",
      "uFill",
      "uCounts",
    ].map(name => [name, gl.getUniformLocation(program, name)])
  )
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
      domain: [
        (afterMs - packed.xOriginMs) / 1000,
        (beforeMs - packed.xOriginMs) / 1000,
        (rawRangeMin - packed.yOrigin) / packed.yScale,
        (rawRangeMax - packed.yOrigin) / packed.yScale,
      ],
      plot: [plotLeft, plotTop, plotWidth, plotHeight],
      canvas: [canvasWidth, canvasHeight, lineWidth * dpr, stepped ? 1 : smooth ? 2 : 0],
      fill: [
        isBar ? barWidth * dpr : (0 - packed.yOrigin) / packed.yScale,
        fillAlpha,
        usesStackedData ? 1 : 0,
      ],
      fillPass: fillMode === "stacked" ? 3 : isBar ? 4 : 2,
      counts: [
        packed.pointCount,
        packed.seriesCount,
        drawLayout.segmentsPerPair,
        drawLayout.segmentsPerSeries,
      ],
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
    }
    gl.uniform1i(uniforms.uXValues, 0)
    gl.uniform1i(uniforms.uYValues, 1)
    gl.uniform1i(uniforms.uSeriesColors, 2)
    if (usesStackedData) gl.uniform1i(uniforms.uBaseValues, 3)
    gl.uniform2i(uniforms.uXTextureSize, textureStates.x.width, textureStates.x.height)
    gl.uniform2i(uniforms.uYTextureSize, textureStates.y.width, textureStates.y.height)
    gl.uniform2i(
      uniforms.uColorTextureSize,
      textureStates.color.width,
      textureStates.color.height
    )
    if (usesStackedData)
      gl.uniform2i(
        uniforms.uBaseTextureSize,
        textureStates.base.width,
        textureStates.base.height
      )
    gl.uniform4fv(uniforms.uDomain, drawState.domain)
    gl.uniform4fv(uniforms.uPlot, drawState.plot)
    gl.uniform4fv(uniforms.uCanvas, drawState.canvas)
    gl.uniform3fv(uniforms.uFill, drawState.fill)
    gl.uniform4uiv(uniforms.uCounts, drawState.counts)
    gl.enable(gl.SCISSOR_TEST)
    gl.scissor(
      drawState.plot[0],
      size.height - drawState.plot[1] - drawState.plot[3],
      drawState.plot[2],
      drawState.plot[3]
    )
    if (drawState.fillInstanceCount) {
      gl.uniform1i(uniforms.uPassType, drawState.fillPass)
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, drawState.fillInstanceCount)
    }
    if (drawState.strokeInstanceCount) {
      gl.uniform1i(uniforms.uPassType, 0)
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
