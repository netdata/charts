import makeResourceCache from "@/chartLibraries/gpu/engine/makeResourceCache"
import makeProgram from "./program"

const runtimes = new WeakMap()
const failedSDKs = new WeakSet()
const idleDisposeMs = 30000
let support
let activeContexts = 0

const getContextInfo = gl => {
  const debug = gl.getExtension("WEBGL_debug_renderer_info")
  return {
    vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
    renderer: debug
      ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER),
    version: gl.getParameter(gl.VERSION),
    shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
  }
}

const makeContext = canvas =>
  canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: true,
    powerPreference: "default",
  })

export const inspectWebGL2 = () => {
  if (typeof document === "undefined") return null
  try {
    const canvas = document.createElement("canvas")
    const gl = makeContext(canvas)
    if (!gl) return null
    const info = getContextInfo(gl)
    gl.getExtension("WEBGL_lose_context")?.loseContext()
    return info
  } catch {
    return null
  }
}

const probeSupport = () => Boolean(inspectWebGL2())

export const isWebGL2Supported = sdk => {
  if (sdk && failedSDKs.has(sdk)) return false
  if (support === undefined) support = probeSupport()
  return support
}

const makeRuntime = sdk => {
  let canvas = null
  let gl = null
  let info = null
  let references = 0
  let disposeTimer = null
  let disposed = false
  let contextLostListener = null
  let lastFailure = null
  const programs = new Map()
  const resourceCache = makeResourceCache()
  const lostListeners = new Set()

  const initialize = () => {
    if (gl) return instance
    if (!isWebGL2Supported(sdk)) throw new Error("WebGL2 is unavailable")

    canvas = document.createElement("canvas")
    gl = makeContext(canvas)
    if (!gl) throw new Error("Unable to create a shared WebGL2 context")
    activeContexts += 1
    info = getContextInfo(gl)
    contextLostListener = event => {
      event.preventDefault()
      if (disposed) return
      failedSDKs.add(sdk)
      lastFailure = { reason: "context-lost", message: "WebGL2 context lost" }
      lostListeners.forEach(listener => listener(lastFailure))
    }
    canvas.addEventListener("webglcontextlost", contextLostListener)
    return instance
  }

  const acquire = async () => {
    references += 1
    clearTimeout(disposeTimer)
    disposeTimer = null
    try {
      return initialize()
    } catch (error) {
      references = Math.max(0, references - 1)
      lastFailure = { reason: "initialization", message: error.message }
      failedSDKs.add(sdk)
      throw error
    }
  }

  const release = () => {
    references = Math.max(0, references - 1)
    if (references || disposed) return
    clearTimeout(disposeTimer)
    disposeTimer = setTimeout(dispose, idleDisposeMs)
  }

  const getProgram = (key, vertexShader, fragmentShader) => {
    if (!gl) throw new Error("WebGL2 runtime is not initialized")
    if (!programs.has(key)) {
      const record = { value: null, promise: null }
      record.promise = makeProgram(gl, vertexShader, fragmentShader).then(program => {
        record.value = program
        return program
      })
      programs.set(key, record)
    }
    return programs.get(key).promise
  }

  const getResource = (key, create) => {
    if (!gl) throw new Error("WebGL2 runtime is not initialized")
    return resourceCache.get(key, create)
  }

  const getResourceBytes = resourceCache.getBytes

  const onLost = listener => {
    lostListeners.add(listener)
    return () => lostListeners.delete(listener)
  }

  const dispose = () => {
    if (disposed) return
    disposed = true
    clearTimeout(disposeTimer)
    disposeTimer = null
    lostListeners.clear()
    programs.forEach(record => {
      if (record.value) gl?.deleteProgram(record.value)
      else record.promise.then(program => gl?.deleteProgram(program), () => {})
    })
    programs.clear()
    resourceCache.destroy()
    if (canvas && contextLostListener)
      canvas.removeEventListener("webglcontextlost", contextLostListener)
    contextLostListener = null
    if (gl) {
      gl.getExtension("WEBGL_lose_context")?.loseContext()
      activeContexts = Math.max(0, activeContexts - 1)
    }
    gl = null
    canvas = null
    info = null
    runtimes.delete(sdk)
  }

  const instance = {
    acquire,
    release,
    dispose,
    getProgram,
    getResource,
    getResourceBytes,
    onLost,
    get canvas() {
      return canvas
    },
    get gl() {
      return gl
    },
    get info() {
      return info
    },
    get references() {
      return references
    },
    get lastFailure() {
      return lastFailure
    },
  }
  return instance
}

export const getWebGL2Diagnostics = sdk => {
  const runtime = runtimes.get(sdk)
  return {
    supported: isWebGL2Supported(sdk),
    initialized: Boolean(runtime?.gl),
    context: runtime?.info || null,
    references: runtime?.references || 0,
    sharedResourceBytes: runtime?.getResourceBytes?.() || 0,
    lastFailure: runtime?.lastFailure || null,
  }
}
export const getWebGL2Runtime = sdk => {
  if (!runtimes.has(sdk)) runtimes.set(sdk, makeRuntime(sdk))
  return runtimes.get(sdk)
}
export const disposeWebGL2Runtime = sdk => runtimes.get(sdk)?.dispose()
export const getActiveWebGL2Contexts = () => activeContexts
