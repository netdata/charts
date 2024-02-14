import React from "react"
import styled from "styled-components"
import { Button } from "@netdata/netdata-ui"
import { useChart, useAttributeValue } from "@/components/provider/selectors"

const StyledButton = styled(Button).attrs({
  flavour: "borderless",
  label: "Reset",
  width: "initial",
  height: "initial",
  padding: [0, 1],
  title: "Reset Filters",
  small: true,
  neutral: true,
})`
  && {
    height: initial;
    font-weight: normal;
  }
`

const Reset = () => {
  const chart = useChart()
  const pristineValues = useAttributeValue("pristine")

  const isPristine = !Object.keys(pristineValues).length

  return (
    <StyledButton
      disabled={isPristine}
      onClick={chart.resetPristine}
      data-track={chart.track("reset")}
    />
  )
}

export default Reset
