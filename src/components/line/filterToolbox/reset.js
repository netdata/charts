import React from "react"
import styled from "styled-components"
import { Button } from "@netdata/netdata-ui/lib/components/button"
import { useChart, useAttributeValue } from "@/components/provider/selectors"

const StyledButton = styled(Button).attrs({
  flavour: "borderless",
  label: "Reset",
  width: "initial",
  height: "initial",
  padding: [0, 1],
  title: "Reset Filters",
  size: "small",
})`
  && {
    height: initial;
    font-weight: normal;
  }
`

const Reset = ({ attribute = "pristineComposite", resetFunction }) => {
  const chart = useChart()
  const attributeValue = useAttributeValue(attribute)

  const disabled = Object.keys(attributeValue)?.length === 0

  return (
    <StyledButton
      disabled={disabled}
      onClick={resetFunction ?? chart.resetPristineComposite}
      data-track={chart.track("reset")}
    />
  )
}

export default Reset
