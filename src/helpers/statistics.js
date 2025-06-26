/**
 * Statistical calculation utilities for dimension data
 */

export const calculateStdDev = (values, avg = null) => {
  if (!values?.length) return null
  const mean = avg ?? values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  return Math.sqrt(variance)
}

export const calculateMedian = (values) => {
  if (!values?.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export const calculatePercentile = (values, percentile) => {
  if (!values?.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const index = (percentile / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  return lower === upper ? sorted[lower] : 
    sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower)
}

export const calculateAdvancedStats = (values, basicStats = {}) => {
  if (!values?.length) return {}
  
  const { avg } = basicStats
  const stddev = calculateStdDev(values, avg)
  
  return {
    median: calculateMedian(values),
    stddev,
    p25: calculatePercentile(values, 25),
    p75: calculatePercentile(values, 75), 
    p95: calculatePercentile(values, 95),
    range: Math.max(...values) - Math.min(...values),
    count: values.length,
    volume: values.reduce((sum, val) => sum + Math.abs(val), 0),
    cv: avg && stddev ? (stddev / Math.abs(avg)) * 100 : null
  }
}

export const calculateAllStats = (values) => {
  if (!values?.length) return {}
  
  const sum = values.reduce((a, b) => a + b, 0)
  const basicStats = {
    min: Math.min(...values),
    avg: sum / values.length,
    max: Math.max(...values),
    value: values[values.length - 1],
    arp: 0
  }
  
  const advancedStats = calculateAdvancedStats(values, basicStats)
  
  return { ...basicStats, ...advancedStats }
}