export class DataRequestError extends Error {
  constructor(message, { status, payload, cause, code } = {}) {
    super(message)
    this.name = "DataRequestError"
    this.status = status
    this.payload = payload
    this.code = code
    if (cause) this.cause = cause
  }
}

const getErrorMessage = (payload, status) =>
  payload?.errorMessage ||
  payload?.errorMsgKey ||
  payload?.message ||
  (status ? `Data request failed with HTTP ${status}` : "Data request failed")

export const fetchDataRequest = async (
  request,
  options = {},
  { rejectHttpErrors = true, timeoutMs, wrapJsonErrors = true } = {}
) => {
  const fetchOptions = { ...request.options, ...options }
  const lifecycleSignal = fetchOptions.signal
  const hasDeadline = Number.isFinite(timeoutMs) && timeoutMs > 0
  const controller = hasDeadline ? new AbortController() : null
  let abortCause
  let timeout
  const abortForLifecycle = () => {
    abortCause ??= "lifecycle"
    controller.abort()
  }

  if (controller) {
    fetchOptions.signal = controller.signal
    if (lifecycleSignal?.aborted) abortForLifecycle()
    else lifecycleSignal?.addEventListener("abort", abortForLifecycle, { once: true })
    timeout = setTimeout(() => {
      abortCause ??= "timeout"
      controller.abort()
    }, timeoutMs)
  }

  try {
    const response = await fetch(request.url, fetchOptions)
    let payload

    try {
      payload = await response.json()
    } catch (cause) {
      if (cause?.name === "AbortError") throw cause
      if (!wrapJsonErrors) throw cause
      throw new DataRequestError("Data request returned an invalid JSON response", {
        status: response.status,
        cause,
      })
    }

    if (rejectHttpErrors && response.ok === false)
      throw new DataRequestError(getErrorMessage(payload, response.status), {
        status: response.status,
        payload,
      })

    return payload
  } catch (cause) {
    if (abortCause === "timeout" && cause?.name === "AbortError")
      throw new DataRequestError(`Data request timed out after ${timeoutMs} ms`, {
        cause,
        code: "timeout",
      })
    throw cause
  } finally {
    if (timeout) clearTimeout(timeout)
    lifecycleSignal?.removeEventListener?.("abort", abortForLifecycle)
  }
}
