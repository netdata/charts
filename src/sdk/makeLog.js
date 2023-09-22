const defaultLogOptions = {
  payload: {},
}

const makeLog =
  chart =>
  (payload = {}) => {
    if (!chart) return () => {}

    const logOptions = chart.getAttribute("logOptions") || defaultLogOptions
    const { sendLog, payload: logPayload } = logOptions
    const mergedData = {
      ...(payload?.data ? { ...payload.data } : {}),
      ...(logPayload?.data ? { ...logPayload.data } : {}),
    }

    if (typeof sendLog === "function") {
      sendLog({
        ...payload,
        ...logPayload,
        ...mergedData,
        chartId: chart.getAttribute("id"),
      })
    }
  }

export default makeLog
