import { useCallback, useState } from "react"
import { Flex, Button as UIButton, Tabs, Tab } from "@netdata/netdata-ui"
import { useAttributeValue, useChart } from "@/components/provider"
import { resetSettings, useIsPristine } from "./reset"

const tabsHasFooter = id => id === "display" || id === "data"

const ResetFooter = ({ resetKeys, onReset }) => {
  const disabled = useIsPristine(resetKeys)

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

const SettingsContent = ({ onClose, initialTab, initialIndex = 0 }) => {
  const chart = useChart()
  const settingsTabs = useAttributeValue("settingsTabs") || []
  const [activeIndex, setActiveIndex] = useState(() =>
    initialTab
      ? Math.max(
          0,
          settingsTabs.findIndex(tab => tab.id === initialTab)
        )
      : initialIndex
  )

  const activeTab = settingsTabs[activeIndex] || settingsTabs[0]
  const resetKeys = activeTab?.resetKeys || []

  const handleReset = useCallback(() => {
    resetSettings(chart, resetKeys)
    onClose()
  }, [chart, resetKeys, onClose])

  if (!settingsTabs.length) return null

  const showFooter = tabsHasFooter(activeTab.id)

  return (
    <Flex column width={{ min: "320px", max: "420px" }} height="400px" data-testid="chartSettings">
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
      {showFooter && <ResetFooter key={activeTab.id} resetKeys={resetKeys} onReset={handleReset} />}
    </Flex>
  )
}

export default SettingsContent
