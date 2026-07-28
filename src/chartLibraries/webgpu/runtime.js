const runtimes = new WeakMap()
const failedSDKs = new WeakSet()
const idleDisposeMs = 30000

export const isWebGPUSupported = sdk => {
  if (sdk && failedSDKs.has(sdk)) return false
  return typeof navigator !== "undefined" && Boolean(navigator.gpu)
}

const makeRuntime = sdk => {
  let adapter = null
  let device = null
  let format = null
  let initializing = null
  let references = 0
  let disposeTimer = null
  let disposed = false
  const pipelinePromises = new Map()
  const lostListeners = new Set()

  const dispose = () => {
    if (disposed) return
    disposed = true
    clearTimeout(disposeTimer)
    disposeTimer = null
    pipelinePromises.clear()
    lostListeners.clear()
    device?.destroy()
    device = null
    adapter = null
    format = null
    initializing = null
    runtimes.delete(sdk)
  }

  const initialize = async () => {
    if (device) return instance
    if (initializing) return initializing

    initializing = (async () => {
      if (!isWebGPUSupported(sdk)) throw new Error("WebGPU is unavailable")

      adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" })
      if (!adapter) throw new Error("WebGPU adapter acquisition failed")

      device = await adapter.requestDevice()
      format = navigator.gpu.getPreferredCanvasFormat()
      device.lost.then(info => {
        if (disposed) return
        failedSDKs.add(sdk)
        lostListeners.forEach(listener => listener(info))
      })
      return instance
    })().catch(error => {
      failedSDKs.add(sdk)
      initializing = null
      throw error
    })

    return initializing
  }

  const acquire = async () => {
    references += 1
    clearTimeout(disposeTimer)
    disposeTimer = null

    try {
      return await initialize()
    } catch (error) {
      references = Math.max(0, references - 1)
      throw error
    }
  }

  const release = () => {
    references = Math.max(0, references - 1)
    if (references || disposed) return

    clearTimeout(disposeTimer)
    disposeTimer = setTimeout(dispose, idleDisposeMs)
  }

  const getPipeline = (key, create) => {
    if (!device) throw new Error("WebGPU runtime is not initialized")
    if (!pipelinePromises.has(key)) pipelinePromises.set(key, Promise.resolve().then(create))
    return pipelinePromises.get(key)
  }

  const onLost = listener => {
    lostListeners.add(listener)
    return () => lostListeners.delete(listener)
  }

  const instance = {
    acquire,
    release,
    dispose,
    getPipeline,
    onLost,
    get adapter() {
      return adapter
    },
    get device() {
      return device
    },
    get format() {
      return format
    },
    get references() {
      return references
    },
  }

  return instance
}

export const markWebGPUFailed = sdk => failedSDKs.add(sdk)

export const getWebGPURuntime = sdk => {
  if (!runtimes.has(sdk)) runtimes.set(sdk, makeRuntime(sdk))
  return runtimes.get(sdk)
}

export const disposeWebGPURuntime = sdk => runtimes.get(sdk)?.dispose()
