import React, { useCallback, useState, useMemo } from "react"
import { Flex, Button as UIButton, Tabs, Tab } from "@netdata/netdata-ui"
import { useAttributeValue, useChart } from "@/components/provider"

const RESET_DEFAULTS = {
  chartType: "line",
  chartLibrary: "dygraph",
  groupingMethod: "average",
  enabledYAxis: true,
  enabledXAxis: true,
  legend: true,
  staticValueRange: null,
  desiredUnits: ["auto"],
  staticFractionDigits: null,
  points: null,
  nulls2zero: false,
}

const FETCH_KEYS = new Set(["points", "nulls2zero", "groupingMethod"])

const tabsHasFooter = id => id === "display" || id === "data"

const useCurrentValues = keys => {
  const values = {}
  keys.forEach(key => {
    values[key] = useAttributeValue(key)
  })
  return values
}

const ResetFooter = ({ resetKeys, onReset }) => {
  const current = useCurrentValues(resetKeys)
  const pristine = useAttributeValue("pristine") || {}

  const disabled = useMemo(() => {
    return resetKeys.every(key => {
      const target = key in pristine ? pristine[key] : RESET_DEFAULTS[key]
      return JSON.stringify(current[key]) === JSON.stringify(target)
    })
  }, [resetKeys, current, pristine])

  return (
    <Flex
      gap={1}
      justifyContent="end"
      alignItems="center"
      padding={[2, 3]}
      border={{ side: "top" }}
    >
      <UIButton
        label="Reset defaults"
        onClick={onReset}
        flavour="borderless"
        small
        disabled={disabled}
      />
    </Flex>
  )
}

const SettingsContent = ({ onClose }) => {
  const chart = useChart()
  const settingsTabs = useAttributeValue("settingsTabs") || []
  const [activeIndex, setActiveIndex] = useState(0)

  const activeTab = settingsTabs[activeIndex] || settingsTabs[0]
  const resetKeys = activeTab?.resetKeys || []

  const handleReset = useCallback(() => {
    const pristine = chart.getAttribute("pristine") || {}
    const targets = {}
    resetKeys.forEach(key => {
      targets[key] = key in pristine ? pristine[key] : RESET_DEFAULTS[key]
    })

    const hasChartTypeReset = "chartType" in targets || "chartLibrary" in targets
    let triggerFetch = false
    let triggerYAxis = false
    const plainUpdates = {}

    resetKeys.forEach(key => {
      if (key === "chartType" || key === "chartLibrary") return
      plainUpdates[key] = targets[key]
      if (FETCH_KEYS.has(key)) triggerFetch = true
      else triggerYAxis = true
    })

    if (Object.keys(plainUpdates).length) chart.updateAttributes(plainUpdates)
    if (triggerYAxis) chart.trigger("yAxisChange")
    if (triggerFetch) chart.trigger("fetch", { processing: true })

    if (hasChartTypeReset) {
      const library =
        "chartLibrary" in targets ? targets.chartLibrary : chart.getAttribute("chartLibrary")
      const type = "chartType" in targets ? targets.chartType : chart.getAttribute("chartType")
      const selected = library === "dygraph" ? type : library
      chart.updateChartTypeAttribute(selected)
    }

    onClose()
  }, [chart, resetKeys, onClose])

  if (!settingsTabs.length) return null

  const showFooter = tabsHasFooter(activeTab.id)

  return (
    <Flex
      column
      width={{ min: "320px", max: "420px" }}
      height="400px"
      data-testid="chartSettings"
    >
      <Tabs selected={activeIndex} onChange={setActiveIndex} height="100%" overflow="hidden">
        {settingsTabs.map(tab => {
          const TabComponent = tab.Component
          return (
            <Tab key={tab.id} label={tab.label}>
              <Flex column overflow={{ vertical: "auto" }} height="100%">
                <TabComponent chart={chart} onClose={onClose} />
              </Flex>
            </Tab>
          )
        })}
      </Tabs>
      {showFooter && (
        <ResetFooter key={activeTab.id} resetKeys={resetKeys} onReset={handleReset} />
      )}
    </Flex>
  )
}

export default SettingsContent
