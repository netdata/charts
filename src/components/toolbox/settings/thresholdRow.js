import React, { useEffect, useState } from "react"
import { Flex, TextInput, Button } from "@netdata/netdata-ui"
import { useAttributeValue, useChart, useUnitSign } from "@/components/provider"

export const PALETTE = [
  ["#00AB44", "#00AB44"],
  ["#FFCC26", "#FFCC26"],
  ["#F95251", "#F95251"],
]

const Swatch = ({ pair, selected, themeIndex, onClick }) => (
  <Flex
    width="16px"
    height="16px"
    round
    background={pair[themeIndex]}
    onClick={onClick}
    data-testid="gaugeThreshold-swatch"
    border={selected ? { side: "all", size: "2px", color: "textLite" } : undefined}
  />
)

const ThresholdRow = ({ row, onChange, onRemove }) => {
  const chart = useChart()
  const theme = useAttributeValue("theme")
  const units = useUnitSign({ withoutConversion: true })
  const [value, setValue] = useState(String(row.from))

  useEffect(() => {
    setValue(String(row.from))
  }, [row.from])

  const themeIndex = chart.getThemeIndex()

  const commitValue = raw => {
    setValue(raw)
    if (raw !== "" && !Number.isNaN(Number(raw))) onChange({ from: Number(raw) })
  }

  return (
    <Flex gap={2} alignItems="center" data-testid="gaugeThreshold-row" data-theme={theme}>
      <TextInput
        label={`From (${units || "units"})`}
        type="number"
        value={value}
        onChange={e => commitValue(e.target.value)}
      />
      <Flex gap={1} alignItems="center">
        {PALETTE.map(pair => (
          <Swatch
            key={pair[0]}
            pair={pair}
            themeIndex={themeIndex}
            selected={row.color[0] === pair[0]}
            onClick={() => onChange({ color: pair })}
          />
        ))}
      </Flex>
      <Button
        icon="trashcan"
        flavour="borderless"
        small
        title="Remove threshold"
        aria-label="Remove threshold"
        onClick={onRemove}
      />
    </Flex>
  )
}

export default ThresholdRow
