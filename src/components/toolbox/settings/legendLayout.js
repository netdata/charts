import React from "react"
import { Flex, TextSmall, TextMicro, Select } from "@netdata/netdata-ui"
import Tooltip from "@/components/tooltip"
import { useAttribute, useAttributeValue, useIsModern } from "@/components/provider"
import { canShowLabels, legendModes, placeableLibraries } from "@/components/modern/legend/mode"
import { useDimensionCounts } from "@/components/modern/legend/body"

const options = [
  { value: "auto", label: "Automatic" },
  { value: "below", label: "Below the chart" },
  { value: "table", label: "Beside the chart" },
  { value: "live", label: "Live edge" },
]

const liveReason = "Live edge needs a line or area chart with up to 8 series"

const formatOptionLabel = option =>
  option.isDisabled ? (
    <Flex column>
      <TextSmall color="textLite">{option.label}</TextSmall>
      <TextMicro color="textLite">{liveReason}</TextMicro>
    </Flex>
  ) : (
    option.label
  )

const LegendLayout = () => {
  const isModern = useIsModern()
  const legendLayout = useAttributeValue("legendLayout")
  const [chartLegendLayout, setChartLegendLayout] = useAttribute("chartLegendLayout")
  const chartType = useAttributeValue("chartType") || "line"
  const chartLibrary = useAttributeValue("chartLibrary")
  const { visibleCount } = useDimensionCounts()

  if (!isModern) return null

  const liveAvailable = canShowLabels({
    chartType,
    visibleCount,
    canPlaceDirect: !!placeableLibraries[chartLibrary],
  })
  const chartOptions = options.map(option =>
    option.value === "live" && !liveAvailable ? { ...option, isDisabled: true } : option
  )

  const locked = legendModes.includes(legendLayout)
  const selected = locked ? legendLayout : chartLegendLayout || "auto"
  const value = options.find(option => option.value === selected) || {
    value: selected,
    label: selected,
  }

  const select = (
    <Select
      value={value}
      options={chartOptions}
      isDisabled={locked}
      formatOptionLabel={(option, { context }) =>
        context === "menu" ? formatOptionLabel(option) : option.label
      }
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
      {!locked && selected === "live" && !liveAvailable && (
        <TextMicro color="textLite" data-testid="chartSettings-legendLayout-hint">
          {`${liveReason}, so this chart uses another layout.`}
        </TextMicro>
      )}
    </Flex>
  )
}

export default LegendLayout
