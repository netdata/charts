import { Checkbox, TextSmall } from "@netdata/netdata-ui"
import { ItemContainer } from "@netdata/netdata-ui/lib/components/drops/menu/dropdownItem"
import React, { memo } from "react"
import styled from "styled-components"
import { checkIfValueIsSelected } from "./chartLabels"

const StyledItemContainer = styled(ItemContainer).attrs({
  padding: [1, 2],
})``

const ChartLabelValues = ({ labelValues = [], selectedLabels, label, iconProps, onChange }) => {
  return labelValues.map((value, i) => {
    const isValueSelected = checkIfValueIsSelected({ label, value, selectedLabels })

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
          checked={isValueSelected}
          onChange={() => onChange({ label, value })}
          label={<TextSmall wordBreak="break-word">{value}</TextSmall>}
        />
      </StyledItemContainer>
    )
  })
}

export default memo(ChartLabelValues)
