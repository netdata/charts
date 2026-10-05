import React from "react"
import { Flex, TextSmall, Select } from "@netdata/netdata-ui"
import Tooltip from "@/components/tooltip"
import { useAttribute, useAttributeValue, useIsModern } from "@/components/provider"
import { legendModes } from "@/components/modern/legend/mode"

const options = [
  { value: "auto", label: "Automatic" },
  { value: "below", label: "Below the chart" },
  { value: "table", label: "Beside the chart" },
  { value: "live", label: "Live edge" },
]

const LegendLayout = () => {
  const isModern = useIsModern()
  const legendLayout = useAttributeValue("legendLayout")
  const [chartLegendLayout, setChartLegendLayout] = useAttribute("chartLegendLayout")

  if (!isModern) return null

  const locked = legendModes.includes(legendLayout)
  const selected = locked ? legendLayout : chartLegendLayout || "auto"
  const value = options.find(option => option.value === selected) || {
    value: selected,
    label: selected,
  }

  const select = (
    <Select
      value={value}
      options={options}
      isDisabled={locked}
      onChange={option =>
        option && setChartLegendLayout(option.value === "auto" ? null : option.value)
      }
      data-testid="chartSettings-legendLayout"
    />
  )

  return (
    <Flex column gap={2}>
      <TextSmall color="textNoFocus" strong>
        Legend
      </TextSmall>
      {locked ? (
        <Tooltip
          content={`Your personal settings show every legend as "${value.label}". Choose Automatic there to pick a layout per chart.`}
        >
          <Flex column data-testid="chartSettings-legendLayout-locked">
            {select}
          </Flex>
        </Tooltip>
      ) : (
        select
      )}
    </Flex>
  )
}

export default LegendLayout
