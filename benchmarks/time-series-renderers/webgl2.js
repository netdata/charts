import { makePlotArea } from "@/chartLibraries/webgpu/visualizations/cartesian/axes"
import { makeSeriesColors } from "@/chartLibraries/webgpu/visualizations/cartesian/line/colors"
import { packAlignedData } from "@/chartLibraries/webgpu/visualizations/cartesian/line/data"
import {
  makeCurveSegments,
  makeDrawLayout,
} from "@/chartLibraries/webgpu/visualizations/cartesian/line/geometry"

const vertexShader = `#version 300 es
precision highp float;
precision highp int;

const float AA_PADDING = 1.0;
const float SMOOTH_ALPHA = 0.3333333333333333;
const uint MODE_STEP = 1u;
const uint MODE_SMOOTH = 2u;

uniform sampler2D uXValues;
uniform sampler2D uYValues;
uniform sampler2D uSeriesColors;
uniform ivec2 uXTextureSize;
uniform ivec2 uYTextureSize;
uniform ivec2 uColorTextureSize;
uniform vec4 uDomain;
uniform vec4 uPlot;
uniform vec4 uCanvas;
uniform uvec4 uCounts;

out float vAcross;
flat out float vWidth;
flat out vec4 vColor;

struct SmoothControls {
  vec2 left;
  vec2 right;
};

ivec2 linearCoordinate(int index, ivec2 size) {
  return ivec2(index % size.x, index / size.x);
}

float loadValue(sampler2D source, ivec2 size, int index) {
  return texelFetch(source, linearCoordinate(index, size), 0).r;
}

vec4 loadColor(int index) {
  return texelFetch(uSeriesColors, linearCoordinate(index, uColorTextureSize), 0);
}

vec2 quadCoordinates(int vertexIndex) {
  if (vertexIndex == 0) return vec2(0.0, 0.0);
  if (vertexIndex == 1) return vec2(1.0, 0.0);
  if (vertexIndex == 2 || vertexIndex == 3) return vec2(0.0, 1.0);
  if (vertexIndex == 4) return vec2(1.0, 0.0);
  return vec2(1.0, 1.0);
}

vec2 toScreen(vec2 point) {
  float xRange = max(uDomain.y - uDomain.x, 1e-20);
  float yRange = max(uDomain.w - uDomain.z, 1e-20);
  float x = uPlot.x + ((point.x - uDomain.x) / xRange) * uPlot.z;
  float y = uPlot.y + (1.0 - (point.y - uDomain.z) / yRange) * uPlot.w;
  return vec2(x, y);
}

vec2 loadScreenPoint(uint seriesIndex, uint pointIndex) {
  int yOffset = int(seriesIndex * uCounts.x);
  float x = loadValue(uXValues, uXTextureSize, int(pointIndex));
  float y = loadValue(uYValues, uYTextureSize, yOffset + int(pointIndex));
  return toScreen(vec2(x, y));
}

bool validScreenPoint(vec2 point) {
  return !isnan(point.y);
}

SmoothControls smoothControls(uint seriesIndex, uint pointIndex) {
  vec2 point = loadScreenPoint(seriesIndex, pointIndex);
  SmoothControls controls;
  controls.left = point;
  controls.right = point;
  if (pointIndex == 0u || pointIndex + 1u >= uCounts.x) return controls;

  vec2 previous = loadScreenPoint(seriesIndex, pointIndex - 1u);
  vec2 next = loadScreenPoint(seriesIndex, pointIndex + 1u);
  if (!validScreenPoint(previous) || !validScreenPoint(point) || !validScreenPoint(next)) {
    return controls;
  }

  vec2 left = (1.0 - SMOOTH_ALPHA) * point + SMOOTH_ALPHA * previous;
  vec2 right = (1.0 - SMOOTH_ALPHA) * point + SMOOTH_ALPHA * next;
  if (left.x != right.x) {
    float deltaY = point.y - right.y - ((point.x - right.x) * (left.y - right.y)) /
      (left.x - right.x);
    left.y += deltaY;
    right.y += deltaY;
  }

  if (left.y > previous.y && left.y > point.y) {
    left.y = max(previous.y, point.y);
    right.y = 2.0 * point.y - left.y;
  } else if (left.y < previous.y && left.y < point.y) {
    left.y = min(previous.y, point.y);
    right.y = 2.0 * point.y - left.y;
  }

  if (right.y > point.y && right.y > next.y) {
    right.y = max(point.y, next.y);
    left.y = 2.0 * point.y - right.y;
  } else if (right.y < point.y && right.y < next.y) {
    right.y = min(point.y, next.y);
    left.y = 2.0 * point.y - right.y;
  }

  controls.left = left;
  controls.right = right;
  return controls;
}

vec2 cubicPoint(vec2 a, vec2 c1, vec2 c2, vec2 b, float t) {
  vec2 q0 = mix(a, c1, t);
  vec2 q1 = mix(c1, c2, t);
  vec2 q2 = mix(c2, b, t);
  return mix(mix(q0, q1, t), mix(q1, q2, t), t);
}

void gapOutput(vec4 color) {
  gl_Position = vec4(-2.0, -2.0, 0.0, 1.0);
  vAcross = 0.0;
  vWidth = 0.0;
  vColor = color;
}

void main() {
  uint segmentsPerPair = uCounts.z;
  uint segmentsPerSeries = uCounts.w;
  uint instanceIndex = uint(gl_InstanceID);
  uint seriesIndex = instanceIndex / segmentsPerSeries;
  uint localSegment = instanceIndex % segmentsPerSeries;
  uint pairIndex = localSegment / segmentsPerPair;
  uint pairSegment = localSegment % segmentsPerPair;
  int yOffset = int(seriesIndex * uCounts.x);
  uint mode = uint(uCanvas.w);

  float x0 = loadValue(uXValues, uXTextureSize, int(pairIndex));
  float x1 = loadValue(uXValues, uXTextureSize, int(pairIndex + 1u));
  float y0 = loadValue(uYValues, uYTextureSize, yOffset + int(pairIndex));
  float y1 = loadValue(uYValues, uYTextureSize, yOffset + int(pairIndex + 1u));
  vec4 color = loadColor(int(seriesIndex));
  vec2 sourceA = toScreen(vec2(x0, y0));
  vec2 sourceB = toScreen(vec2(x1, y1));

  if (isnan(y0) || isnan(y1) || color.a <= 0.0) {
    gapOutput(color);
    return;
  }

  vec2 screenA = sourceA;
  vec2 screenB = sourceB;
  if (mode == MODE_STEP) {
    if (pairSegment == 0u) screenB = vec2(sourceB.x, sourceA.y);
    else screenA = vec2(sourceB.x, sourceA.y);
  } else if (mode == MODE_SMOOTH && segmentsPerPair > 1u) {
    SmoothControls controlsA = smoothControls(seriesIndex, pairIndex);
    SmoothControls controlsB = smoothControls(seriesIndex, pairIndex + 1u);
    float t0 = float(pairSegment) / float(segmentsPerPair);
    float t1 = float(pairSegment + 1u) / float(segmentsPerPair);
    screenA = cubicPoint(sourceA, controlsA.right, controlsB.left, sourceB, t0);
    screenB = cubicPoint(sourceA, controlsA.right, controlsB.left, sourceB, t1);
  }

  vec2 delta = screenB - screenA;
  float lengthPixels = length(delta);
  if (lengthPixels < 1e-6) {
    gapOutput(color);
    return;
  }

  vec2 quad = quadCoordinates(gl_VertexID);
  vec2 perpendicular = vec2(delta.y, -delta.x) / lengthPixels;
  float width = max(1.0, uCanvas.z);
  float halfExtent = width * 0.5 + AA_PADDING;
  float side = mix(1.0, -1.0, quad.y);
  vec2 screenPosition = mix(screenA, screenB, quad.x) + perpendicular * halfExtent * side;
  float clipX = screenPosition.x / uCanvas.x * 2.0 - 1.0;
  float clipY = 1.0 - screenPosition.y / uCanvas.y * 2.0;

  gl_Position = vec4(clipX, clipY, 0.0, 1.0);
  vAcross = halfExtent * (1.0 + side);
  vWidth = width;
  vColor = color;
}
`

const fragmentShader = `#version 300 es
precision highp float;

in float vAcross;
flat in float vWidth;
flat in vec4 vColor;
out vec4 outputColor;

void main() {
  const float AA_PADDING = 1.0;
  float center = vWidth * 0.5 + AA_PADDING;
  float distanceFromCenter = abs(vAcross - center);
  float antialias = max(fwidth(vAcross), 1e-3) * 0.75;
  float inner = max(0.0, vWidth * 0.5 - antialias);
  float outer = vWidth * 0.5 + antialias;
  float coverage = 1.0 - smoothstep(inner, outer, distanceFromCenter);
  outputColor = vec4(vColor.rgb, vColor.a * coverage);
}
`

let activeContexts = 0

const compileShader = (gl, type, source) => {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return shader
}

const nextTask = () => new Promise(resolve => setTimeout(resolve))

const makeProgram = gl => {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShader)
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader)
  const program = gl.createProgram()
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.flush()

  const completion = gl.getExtension("KHR_parallel_shader_compile")
  const ready = (async () => {
    while (completion && !gl.getProgramParameter(program, completion.COMPLETION_STATUS_KHR)) {
      await nextTask()
    }

    const errors = [vertex, fragment]
      .filter(shader => !gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      .map(shader => gl.getShaderInfoLog(shader))
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) errors.push(gl.getProgramInfoLog(program))
    gl.deleteShader(vertex)
    gl.deleteShader(fragment)
    if (errors.length) {
      gl.deleteProgram(program)
      throw new Error(errors.join("\n"))
    }
    return program
  })()

  return { program, ready }
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

const updateTexture = ({ gl, texture, state, values, components, internalFormat, format }) => {
  const layout = makeTextureLayout(values, components, gl.getParameter(gl.MAX_TEXTURE_SIZE))
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
  return state
}

const getRendererInfo = gl => {
  const debug = gl.getExtension("WEBGL_debug_renderer_info")
  return {
    vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
    renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    version: gl.getParameter(gl.VERSION),
    shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
  }
}

export const inspectWebGL2 = () => {
  const canvas = document.createElement("canvas")
  const gl = canvas.getContext("webgl2")
  if (!gl) return null
  const info = getRendererInfo(gl)
  gl.getExtension("WEBGL_lose_context")?.loseContext()
  return info
}

export const getActiveWebGL2Contexts = () => activeContexts

export default ({ chart, width, height }) => {
  let element = null
  let canvas = null
  let gl = null
  let program = null
  let programReady = Promise.resolve(false)
  let vertexArray = null
  let contextLost = false
  let mounted = false
  let bufferBytes = 0
  let uniformLocations = null
  let drawStats = null
  const textures = {}
  const textureStates = {
    x: { width: 0, height: 0, byteLength: 0 },
    y: { width: 0, height: 0, byteLength: 0 },
    color: { width: 0, height: 0, byteLength: 0 },
  }

  const uniform = name => uniformLocations[name]

  const render = () => {
    if (!gl || contextLost) return false
    const payload = chart.getPayload()
    const dimensionIds = chart.getPayloadDimensionIds()
    const packed = packAlignedData(payload.data, dimensionIds.length, payload.point, [
      chart.getAttribute("min"),
      chart.getAttribute("max"),
    ])
    const colors = makeSeriesColors(chart)
    const dpr = window.devicePixelRatio || 1
    const canvasWidth = Math.max(1, Math.round(width * dpr))
    const canvasHeight = Math.max(1, Math.round(height * dpr))
    if (canvas.width !== canvasWidth) canvas.width = canvasWidth
    if (canvas.height !== canvasHeight) canvas.height = canvasHeight

    const plot = makePlotArea(chart, width, height)
    const plotLeft = Math.max(0, Math.round(plot.left * dpr))
    const plotTop = Math.max(0, Math.round(plot.top * dpr))
    const plotWidth = Math.max(1, Math.round(plot.width * dpr))
    const plotHeight = Math.max(1, Math.round(plot.height * dpr))
    const [afterMs, beforeMs] = chart.getDateWindow()
    const rawMin = chart.getAttribute("min")
    const rawMax = chart.getAttribute("max")
    const rangeMin = (rawMin - packed.yOrigin) / packed.yScale
    const rangeMax = (rawMax - packed.yOrigin) / packed.yScale
    const stepped = chart.getAttribute("stepPlot")
    const drawLayout = makeDrawLayout({
      pointCount: packed.pointCount,
      seriesCount: packed.seriesCount,
      stepped,
      smooth: !stepped,
      curveSegments: makeCurveSegments({ pointCount: packed.pointCount, plotWidth }),
    })
    drawStats = {
      pointCount: packed.pointCount,
      seriesCount: packed.seriesCount,
      sourcePairs: Math.max(0, packed.pointCount - 1) * packed.seriesCount,
      ...drawLayout,
    }

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.activeTexture(gl.TEXTURE0)
    updateTexture({
      gl,
      texture: textures.x,
      state: textureStates.x,
      values: packed.x,
      components: 1,
      internalFormat: gl.R32F,
      format: gl.RED,
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
    })
    gl.activeTexture(gl.TEXTURE2)
    updateTexture({
      gl,
      texture: textures.color,
      state: textureStates.color,
      values: colors,
      components: 4,
      internalFormat: gl.RGBA32F,
      format: gl.RGBA,
    })
    bufferBytes = Object.values(textureStates).reduce(
      (total, state) => total + state.byteLength,
      0
    )

    gl.useProgram(program)
    gl.bindVertexArray(vertexArray)
    gl.uniform1i(uniform("uXValues"), 0)
    gl.uniform1i(uniform("uYValues"), 1)
    gl.uniform1i(uniform("uSeriesColors"), 2)
    gl.uniform2i(uniform("uXTextureSize"), textureStates.x.width, textureStates.x.height)
    gl.uniform2i(uniform("uYTextureSize"), textureStates.y.width, textureStates.y.height)
    gl.uniform2i(
      uniform("uColorTextureSize"),
      textureStates.color.width,
      textureStates.color.height
    )
    gl.uniform4f(
      uniform("uDomain"),
      (afterMs - packed.xOriginMs) / 1000,
      (beforeMs - packed.xOriginMs) / 1000,
      rangeMin,
      rangeMax
    )
    gl.uniform4f(uniform("uPlot"), plotLeft, plotTop, plotWidth, plotHeight)
    gl.uniform4f(
      uniform("uCanvas"),
      canvasWidth,
      canvasHeight,
      1.5 * dpr,
      stepped ? 1 : 2
    )
    gl.uniform4ui(
      uniform("uCounts"),
      packed.pointCount,
      packed.seriesCount,
      drawLayout.segmentsPerPair,
      drawLayout.segmentsPerSeries
    )

    gl.viewport(0, 0, canvasWidth, canvasHeight)
    gl.enable(gl.SCISSOR_TEST)
    gl.scissor(
      Math.min(plotLeft, canvasWidth - 1),
      Math.max(0, canvasHeight - plotTop - plotHeight),
      Math.max(1, Math.min(plotWidth, canvasWidth - plotLeft)),
      Math.max(1, Math.min(plotHeight, canvasHeight - plotTop))
    )
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, drawLayout.instanceCount)
    gl.bindVertexArray(null)
    return true
  }

  const contextLostListener = event => {
    event.preventDefault()
    contextLost = true
  }

  const mount = node => {
    if (mounted) return
    element = node
    canvas = document.createElement("canvas")
    canvas.dataset.renderer = "webgl2"
    canvas.style.display = "block"
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    element.appendChild(canvas)
    canvas.addEventListener("webglcontextlost", contextLostListener)
    gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: true,
      powerPreference: "default",
    })
    if (!gl) throw new Error("Unable to create a WebGL2 context")
    activeContexts += 1
    mounted = true
    const compiled = makeProgram(gl)
    program = compiled.program
    vertexArray = gl.createVertexArray()
    textures.x = gl.createTexture()
    textures.y = gl.createTexture()
    textures.color = gl.createTexture()
    programReady = compiled.ready.then(() => {
      if (!mounted || contextLost) return false
      uniformLocations = Object.fromEntries(
        [
          "uXValues",
          "uYValues",
          "uSeriesColors",
          "uXTextureSize",
          "uYTextureSize",
          "uColorTextureSize",
          "uDomain",
          "uPlot",
          "uCanvas",
          "uCounts",
        ].map(name => [name, gl.getUniformLocation(program, name)])
      )
      return render()
    })
  }

  const unmount = () => {
    if (!mounted) return
    canvas.removeEventListener("webglcontextlost", contextLostListener)
    Object.values(textures).forEach(texture => gl.deleteTexture(texture))
    gl.deleteVertexArray(vertexArray)
    gl.deleteProgram(program)
    gl.getExtension("WEBGL_lose_context")?.loseContext()
    canvas.remove()
    activeContexts -= 1
    element = null
    canvas = null
    gl = null
    program = null
    programReady = Promise.resolve(false)
    vertexArray = null
    mounted = false
    contextLost = false
    bufferBytes = 0
    uniformLocations = null
    drawStats = null
  }

  return {
    mount,
    unmount,
    render,
    invalidateRender: () => {},
    whenReady: () => programReady,
    getQueueDone: () => {
      if (!gl || contextLost) return Promise.reject(new Error("WebGL2 context lost"))
      gl.finish()
      return Promise.resolve()
    },
    getElement: () => element,
    getCanvas: () => canvas,
    getBufferBytes: () => bufferBytes,
    getDrawStats: () => drawStats,
    getPlotArea: () => makePlotArea(chart, width, height),
    isContextLost: () => contextLost || Boolean(gl?.isContextLost()),
  }
}
