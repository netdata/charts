import React, { useCallback, useState, useEffect, useMemo } from "react"
import { Flex, Button as UIButton, Tabs, Tab } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"

const FORM_DEFAULTS = {
  chartType: undefined,
  chartLibrary: undefined,
  groupingMethod: undefined,
  enabledYAxis: true,
  enabledXAxis: true,
  legend: true,
  staticValueRange: null,
  desiredUnits: ["auto"],
  staticFractionDigits: null,
  points: null,
  nulls2zero: false,
}

const FORM_KEYS = Object.keys(FORM_DEFAULTS)

const tabsHasFooter = id => id === "display" || id === "data"

const SettingsContent = ({ chart, onClose }) => {
  const settingsTabs = useAttributeValue("settingsTabs") || []

  const currentChartType = useAttributeValue("chartType")
  const currentChartLibrary = useAttributeValue("chartLibrary")
  const currentGroupingMethod = useAttributeValue("groupingMethod")
  const currentStaticValueRange = useAttributeValue("staticValueRange")
  const currentDesiredUnits = useAttributeValue("desiredUnits") || ["auto"]
  const currentStaticFractionDigits = useAttributeValue("staticFractionDigits")
  const currentEnabledYAxis = useAttributeValue("enabledYAxis")
  const currentEnabledXAxis = useAttributeValue("enabledXAxis")
  const currentLegend = useAttributeValue("legend")
  const currentPoints = useAttributeValue("points")
  const currentNulls2zero = useAttributeValue("nulls2zero")

  const committed = useMemo(
    () => ({
      chartType: currentChartType,
      chartLibrary: currentChartLibrary,
      groupingMethod: currentGroupingMethod,
      staticValueRange: currentStaticValueRange,
      desiredUnits: currentDesiredUnits,
      staticFractionDigits: currentStaticFractionDigits,
      enabledYAxis: currentEnabledYAxis,
      enabledXAxis: currentEnabledXAxis,
      legend: currentLegend,
      points: currentPoints,
      nulls2zero: currentNulls2zero,
    }),
    [
      currentChartType,
      currentChartLibrary,
      currentGroupingMethod,
      currentStaticValueRange,
      currentDesiredUnits,
      currentStaticFractionDigits,
      currentEnabledYAxis,
      currentEnabledXAxis,
      currentLegend,
      currentPoints,
      currentNulls2zero,
    ]
  )

  const [formState, setFormState] = useState(committed)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    setFormState(committed)
  }, [committed])

  const handleChange = useCallback(changes => {
    setFormState(prev => ({ ...prev, ...changes }))
  }, [])

  const draftAttributes = useMemo(() => {
    const draft = {}
    FORM_KEYS.forEach(key => {
      if (formState[key] !== committed[key]) draft[key] = formState[key]
    })
    return draft
  }, [formState, committed])

  const hasPendingChanges = Object.keys(draftAttributes).length > 0

  const commitDraft = useCallback(() => {
    if (!hasPendingChanges) return
    const needsFetch =
      formState.points !== committed.points || formState.nulls2zero !== committed.nulls2zero
    chart.updateAttributes(draftAttributes)
    chart.trigger("yAxisChange")
    if (needsFetch) chart.trigger("fetch", { processing: true })
  }, [
    chart,
    draftAttributes,
    hasPendingChanges,
    formState.points,
    formState.nulls2zero,
    committed.points,
    committed.nulls2zero,
  ])

  const handleApply = useCallback(() => {
    commitDraft()
    onClose()
  }, [commitDraft, onClose])

  const handleReset = useCallback(() => {
    const pristine = chart.getAttribute("pristine") || {}
    const resetState = {}
    Object.entries(FORM_DEFAULTS).forEach(([key, sdkDefault]) => {
      if (key in pristine) resetState[key] = pristine[key]
      else if (sdkDefault !== undefined) resetState[key] = sdkDefault
    })
    setFormState(prev => ({ ...prev, ...resetState }))
    chart.updateAttributes(resetState)
    chart.trigger("yAxisChange")
    onClose()
    chart.trigger("fetch", { processing: true })
  }, [chart, onClose])

  if (!settingsTabs.length) return null

  const activeTab = settingsTabs[activeIndex] || settingsTabs[0]
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
                <TabComponent
                  chart={chart}
                  onClose={onClose}
                  formState={formState}
                  onChange={handleChange}
                  draftAttributes={draftAttributes}
                  hasPendingChanges={hasPendingChanges}
                  commitDraft={commitDraft}
                />
              </Flex>
            </Tab>
          )
        })}
      </Tabs>
      {showFooter && (
        <Flex
          gap={1}
          justifyContent="between"
          alignItems="center"
          padding={[2, 3]}
          border={{ side: "top" }}
        >
          <UIButton label="Reset defaults" onClick={handleReset} flavour="borderless" small />
          <UIButton label="Apply" onClick={handleApply} primary small />
        </Flex>
      )}
    </Flex>
  )
}

export default SettingsContent
