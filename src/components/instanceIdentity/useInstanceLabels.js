import { useCallback, useEffect, useRef } from "react"
import { useChart } from "@/components/provider"
import { fetchInstanceLabels } from "@/sdk/makeChart/api"

const hasLabelsFor = (instanceLabels, instances = {}) =>
  !!instanceLabels && Object.keys(instances).every(id => id in instanceLabels)

export const loadInstanceLabels = (chart, signal) => {
  const { instanceLabels, instanceLabelsLoading, instances } = chart.getAttributes()
  if (instanceLabelsLoading || hasLabelsFor(instanceLabels, instances)) return Promise.resolve()

  chart.updateAttribute("instanceLabelsLoading", true)

  return fetchInstanceLabels(chart, { signal })
    .then(labels => chart.updateAttribute("instanceLabels", labels))
    .catch(() => null)
    .finally(() => chart.updateAttribute("instanceLabelsLoading", false))
}

export default () => {
  const chart = useChart()
  const controllerRef = useRef(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  return useCallback(() => {
    controllerRef.current ??= new AbortController()
    return loadInstanceLabels(chart, controllerRef.current.signal)
  }, [chart])
}
