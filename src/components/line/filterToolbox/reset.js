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
})`
  && {
    height: initial;
    font-weight: normal;
  }
`

const Reset = () => {
  const chart = useChart()
  const pristine = useAttributeValue("pristineComposite")

  const disabled = Object.keys(pristine).length === 0

  return (
    <StyledButton
      disabled={disabled}
      onClick={chart.resetPristineComposite}
      data-track={chart.track("reset")}
    />
  )
}

export default Reset
