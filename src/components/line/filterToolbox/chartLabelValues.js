import { Checkbox, TextSmall } from "@netdata/netdata-ui"
import { ItemContainer } from "@netdata/netdata-ui/lib/components/drops/menu/dropdownItem"
import React, { memo } from "react"
import styled from "styled-components"

const StyledCheckbox = styled(Checkbox)`
  margin-bottom: 6px;
`

const ChartLabelValues = ({ labelValues = [], selectedLabels, label, iconProps, onChange }) => {
  return labelValues.map((value, i) => {
    const isValueChecked = selectedLabels[label]?.includes?.(value)
    return (
      <ItemContainer
        gap={2}
        column
        alignItems="start"
        width="250px"
        key={`${value}_${i}_chartLabelValue`}
      >
        <StyledCheckbox
          iconProps={iconProps}
          checked={!!isValueChecked}
          onChange={() => onChange({ label, value })}
          label={<TextSmall wordBreak="break-word">{value}</TextSmall>}
        />
      </ItemContainer>
    )
  })
}

export default memo(
  ChartLabelValues,
  (prev, next) =>
    prev.labelValues === next.labelValues &&
    prev.selectedLabels[prev.label]?.length === next.selectedLabels[next.label]?.length
)
