export const transformCorrelationData = (response, threshold = 0.01, scopeContexts = []) => {
  if (!response?.result || !response?.v_schema) {
    return []
  }

  const items = response.result.map(item => {
    const [dimension, context, nodeId] = item.id.split(",")
    const [dimensionName, contextName, nodeName] = item.nm.split(",")

    const [weight, timeframe, baseline] = item.v

    const correlationWeight = weight[0]
    const weightMin = weight[0]
    const weightMax = weight[2]

    const timeframeAvg = timeframe[1]
    const timeframeCount = timeframe[4]
    const baselineAvg = baseline[1]
    const baselineCount = baseline[4]

    const percentChange = baselineAvg !== 0 ? ((timeframeAvg - baselineAvg) / baselineAvg) * 100 : 0

    return {
      dimension,
      dimensionName,
      context,
      contextName,
      nodeId,
      nodeName,
      correlationWeight,
      weightMin,
      weightMax,
      timeframeAvg,
      timeframeCount,
      baselineAvg,
      baselineCount,
      percentChange,
      correlationStrength: getCorrelationStrength(correlationWeight),
    }
  })

  return items
    .filter(
      item => Math.abs(item.correlationWeight) < threshold && !scopeContexts.includes(item.context)
    )
    .sort((a, b) => Math.abs(a.correlationWeight) - Math.abs(b.correlationWeight))
}

const getCorrelationStrength = weight => {
  const absWeight = Math.abs(weight)
  if (absWeight <= 0.05) return "Strong"
  if (absWeight <= 0.2) return "Moderate"
  if (absWeight <= 0.5) return "Weak"
  return "Very Weak"
}

export const groupByContext = data => {
  const grouped = {}

  data.forEach(item => {
    if (!grouped[item.context]) {
      grouped[item.context] = {
        context: item.context,
        contextName: item.contextName,
        dimensions: [],
        minWeight: 1,
        count: 0,
      }
    }

    grouped[item.context].dimensions.push(item)
    grouped[item.context].minWeight = Math.min(
      grouped[item.context].minWeight,
      Math.abs(item.correlationWeight)
    )
    grouped[item.context].count++
  })

  return Object.values(grouped).sort((a, b) => a.minWeight - b.minWeight)
}
