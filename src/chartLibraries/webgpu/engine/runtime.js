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
  let uncapturedErrorListener = null
  let lastFailure = null
  const pipelinePromises = new Map()
  const resourceRecords = new Map()
  const lostListeners = new Set()

  const dispose = () => {
    if (disposed) return
    disposed = true
    clearTimeout(disposeTimer)
    disposeTimer = null
    pipelinePromises.clear()
    resourceRecords.forEach(record => {
      if (record.value) record.value.destroy?.()
      else record.promise.then(value => value.destroy?.(), () => {})
    })
    resourceRecords.clear()
    lostListeners.clear()
    if (device && uncapturedErrorListener)
      device.removeEventListener("uncapturederror", uncapturedErrorListener)
    uncapturedErrorListener = null
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
      uncapturedErrorListener = event => {
        event.preventDefault?.()
        if (disposed) return
        failedSDKs.add(sdk)
        const info = {
          reason: "uncaptured-error",
          message: event.error?.message || "Uncaptured WebGPU error",
        }
        lastFailure = info
        lostListeners.forEach(listener => listener(info))
      }
      device.addEventListener("uncapturederror", uncapturedErrorListener)
      device.lost.then(info => {
        if (disposed) return
        lastFailure = info
        failedSDKs.add(sdk)
        lostListeners.forEach(listener => listener(info))
      })
      return instance
    })().catch(error => {
      lastFailure = { reason: "initialization", message: error.message }
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

  const getResource = (key, create) => {
    if (!device) throw new Error("WebGPU runtime is not initialized")
    if (!resourceRecords.has(key)) {
      const record = { value: null, promise: null }
      record.promise = Promise.resolve()
        .then(create)
        .then(value => {
          record.value = value
          return value
        })
      resourceRecords.set(key, record)
    }
    return resourceRecords.get(key).promise
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
    getResource,
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
    get lastFailure() {
      return lastFailure
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
