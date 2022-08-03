import { Checkbox, TextSmall } from "@netdata/netdata-ui"
import { ItemContainer } from "@netdata/netdata-ui/lib/components/drops/menu/dropdownItem"
import React, { memo } from "react"
import styled from "styled-components"

const StyledItemContainer = styled(ItemContainer).attrs({
  padding: [1, 2],
})``

const ChartLabelValues = ({ labelValues = [], selectedLabels, label, iconProps, onChange }) => {
  return labelValues.map((value, i) => {
    const isValueChecked = selectedLabels[label]?.includes?.(value)
    return (
      <StyledItemContainer
        gap={1}
        column
        alignItems="start"
        padding={[1, 2]}
        key={`${value}_${i}_chartLabelValue`}
      >
        <Checkbox
          iconProps={iconProps}
          checked={!!isValueChecked}
          onChange={() => onChange({ label, value })}
          label={<TextSmall wordBreak="break-word">{value}</TextSmall>}
        />
      </StyledItemContainer>
    )
  })
}

export default memo(
  ChartLabelValues,
  (prev, next) =>
    prev.labelValues === next.labelValues &&
    prev.selectedLabels[prev.label]?.length === next.selectedLabels[next.label]?.length
)
