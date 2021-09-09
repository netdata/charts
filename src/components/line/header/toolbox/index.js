import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
// import filter from "@netdata/netdata-ui/lib/components/icon/assets/filter.svg"
// import share from "@netdata/netdata-ui/lib/components/icon/assets/share.svg"
// import pin from "@netdata/netdata-ui/lib/components/icon/assets/pin.svg"
// import stackedChart from "@netdata/netdata-ui/lib/components/icon/assets/stacked_chart.svg"
import { useAttributeValue } from "@/components/provider"
import Separator from "@/components/line/separator"
import ChartType from "./chartType"
import Fullscreen from "./fullscreen"
import Information from "./information"

const Container = props => (
  <Flex gap={2} justifyContent="end" flex basis="0" data-testid="chartHeaderToolbox" {...props} />
)

const Toolbox = props => {
  const disabled = !useAttributeValue("focused")

  return (
    <Container {...props}>
      <Information disabled={disabled} />
      <Separator disabled={disabled} />
      <ChartType disabled={disabled} />
      <Separator disabled={disabled} />
      <Fullscreen disabled={disabled} />
    </Container>
  )
}

export { Container, Separator, ChartType, Fullscreen, Information }

export default Toolbox
