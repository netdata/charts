import { useCallback, useLayoutEffect, useContext, useMemo, useReducer, useState } from "react"
import { scaleLinear } from "d3-scale"
import { unregister } from "@/helpers/makeListeners"
import { enums, parts, check, colors } from "@/helpers/annotations"
import chartTitleByContextMap from "../helpers/chartTitleByContextMap"
import context from "./context"

export const useChart = () => useContext(context)

const dispatch = s => s + 1

export const useForceUpdate = () => {
  const [, forceUpdate] = useReducer(dispatch, 0)
  return forceUpdate
}

export const useImmediateListener = (func, deps) => {
  const off = useMemo(func, deps)
  useLayoutEffect(() => off, [off])
}

export const useAttributeValue = name => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.onAttributeChange(name, forceUpdate), [chart])

  return chart.getAttribute(name)
}

export const useInitialLoading = () => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.onAttributeChange("loaded", forceUpdate), [chart])

  return !chart.getAttribute("loaded")
}

export const useLoadingColor = (defaultColor = "themeNeutralBackground") => {
  const chart = useChart()
  const [color, setColor] = useState(defaultColor)
  const fetchStartedAt = useAttributeValue("fetchStartedAt")
  const loading = useAttributeValue("loading")

  useLayoutEffect(() => {
    if (!loading) {
      setColor(defaultColor)
      return
    }

    const getColor = scaleLinear()
      .domain([0, 500, 2000, 5000, 100000])
      .range([
        chart.getUI().getThemeAttribute(defaultColor),
        chart.getUI().getThemeAttribute(defaultColor),
        chart.getUI().getThemeAttribute("themeWarningBackground"),
        chart.getUI().getThemeAttribute("themeErrorBackground"),
        chart.getUI().getThemeAttribute("themeErrorBackground"),
      ])

    const id = setInterval(() => {
      setColor(getColor(Date.now() - fetchStartedAt))
    }, 500)

    return () => clearInterval(id)
  }, [loading, fetchStartedAt, chart])

  return color
}

export const useIsFetching = () => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.onAttributeChange("loading", forceUpdate), [chart])

  return chart.getAttribute("loading")
}

export const useEmpty = () => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.on("finishFetch", forceUpdate), [chart])

  const { data } = chart.getPayload()

  return data.length === 0
}

export const useAttribute = name => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  const getValue = () => chart.getAttribute(name)

  useImmediateListener(() => chart.onAttributeChange(name, forceUpdate), [chart])

  const updateValue = useCallback(
    nextValue =>
      chart.updateAttribute(
        name,
        typeof nextValue === "function" ? nextValue(getValue()) : nextValue
      ),
    [chart]
  )

  return [getValue(), updateValue]
}

export const useTitle = () => {
  const title = useAttributeValue("title")
  const contextScope = useAttributeValue("contextScope")

  const titleByContext = contextScope.length === 1 && chartTitleByContextMap[contextScope[0]]

  if (titleByContext) return titleByContext

  return title
}

export const useName = () => {
  const name = useAttributeValue("name")
  const contextScope = useAttributeValue("contextScope")

  return name || contextScope.join(", ")
}

export const useVisibleDimensionId = id => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.onAttributeChange("selectedDimensions", forceUpdate), [chart])

  return chart.isDimensionVisible(id)
}

export const usePayload = () => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.on("payloadChanged", forceUpdate), [chart])

  return chart.getPayload()
}

export const useChartError = () => {
  const [error, setError] = useState(null)
  const chart = useChart()
  const forceUpdate = useForceUpdate()

  useImmediateListener(() => {
    const handleFetch = errorMessage => {
      setError(errorMessage)
      forceUpdate()
    }

    return chart
      .on("successFetch", () => handleFetch(chart.getAttribute("error")))
      .on("failFetch", () => handleFetch(chart.getAttribute("error")))
  }, [chart])

  return error
}

export const useFormatTime = value => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.onAttributeChange("timezone", forceUpdate), [chart])

  return useMemo(() => chart.formatTime(value), [value, chart.getAttribute("timezone")])
}

export const useFormatDate = value => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.onAttributeChange("timezone", forceUpdate), [chart])

  return useMemo(() => chart.formatDate(value), [value, chart.getAttribute("timezone")])
}

export const useOnResize = () => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.getUI().on("resize", forceUpdate), [chart])

  return {
    width: chart.getUI().getChartWidth(),
    height: chart.getUI().getChartHeight(),
    parentWidth: chart.getAttribute("width"),
  }
}

export const useDimensionIds = () => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.on("dimensionChanged", forceUpdate), [chart])

  return chart.getDimensionIds()
}

export const useUnitSign = long => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.onAttributeChange("unitsConversion", forceUpdate), [chart])

  return chart.getUnitSign(long)
}

export const useUnits = () => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.onAttributeChange("unitsConversion", forceUpdate), [chart])

  return chart.getUnits()
}

export const useConverted = (value, valueKey) => {
  const chart = useChart()
  const unitsConversion = useAttributeValue("unitsConversion")

  return useMemo(() => {
    if (value === null || value === "-") return "-"

    if (valueKey === "arp" || valueKey === "percent")
      return value === 0 ? "-" : (Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2)

    if (valueKey === "pa")
      return parts.reduce((h, a) => (check(value, enums[a]) ? { ...h, [a]: colors[a] } : h), {})

    return chart.getConvertedValue(value)
  }, [chart, value, valueKey, unitsConversion])
}

export const useLatestRowValue = (valueKey = "value", objKey) => {
  const chart = useChart()

  const [value, setState] = useState(null)

  useLayoutEffect(() => {
    const getValue = () => {
      const hover = chart.getAttribute("hoverX")
      const { all } = chart.getPayload()

      if (all.length === 0) return ""

      let index = hover ? chart.getClosestRow(hover[0]) : -1
      index = index === -1 ? all.length - 1 : index

      const dimensionIds = chart.getVisibleDimensionIds()

      return dimensionIds.map(id => ({
        label: id,
        value: chart.getDimensionValue(id, index, valueKey, objKey),
        color: chart.selectDimensionColor(id),
      }))
    }

    return unregister(
      chart.onAttributeChange("hoverX", () => setState(getValue())),
      chart.on("dimensionChanged", () => setState(getValue())),
      chart.getUI().on("rendered", () => setState(getValue()))
    )
  }, [chart])

  return value
}

const getValueByPeriod = {
  latest: ({ chart, id, valueKey, objKey }) => {
    const hover = chart.getAttribute("hoverX")
    const { all } = chart.getPayload()

    if (!all.length) return null

    let index = hover ? chart.getClosestRow(hover[0]) : -1
    index = index === -1 ? all.length - 1 : index

    const dimensionIds = chart.getPayloadDimensionIds()

    id = id || dimensionIds[0]
    const dimValue = chart.getDimensionValue(id, index, valueKey, objKey)

    return dimValue
  },
  window: ({ chart, id, valueKey, objKey }) => {
    let viewDimensions = chart.getAttribute("viewDimensions")

    let values = null
    if (objKey) {
      viewDimensions = viewDimensions[objKey]
    }

    values = viewDimensions[valueKey]

    if (!values?.length) return null

    const dimensionIds = chart.getPayloadDimensionIds()

    id = id || dimensionIds[0]
    return values[chart.getDimensionIndex(id)]
  },
  highlight: ({ chart, id, valueKey, objKey }) => {
    const { highlight } = chart.getAttribute("overlays")
    debugger
    if (!highlight?.range) return null

    const range = highlight?.range

    const { after, before } = highlight?.moveX ?? {}
  },
}

export const useValue = (id, period = "latest", valueKey = "value", objKey) => {
  const chart = useChart()

  const [value, setState] = useState(null)

  useLayoutEffect(() => {
    const getValue = () =>
      (getValueByPeriod[period] || getValueByPeriod.latest)({ chart, id, valueKey, objKey })

    setState(getValue())

    return unregister(
      chart.onAttributeChange("hoverX", () => setState(getValue())),
      chart.on("dimensionChanged", () => setState(getValue())),
      chart.onAttributeChange("unitsConversion", () => setState(getValue())),
      chart.getUI().on("rendered", () => setState(getValue()))
    )
  }, [chart, id, valueKey, period, objKey])

  return value
}

export const useLatestValue = (id, valueKey = "value") => useValue(id, "latest", valueKey)

export const useConvertedValue = (id, period = "latest", valueKey = "value", objKey) => {
  const value = useValue(id, period, valueKey, objKey)

  return useConverted(value, valueKey)
}

export const useLatestConvertedValue = (id, valueKey = "value", objKey) =>
  useConvertedValue(id, "latest", valueKey, objKey)
