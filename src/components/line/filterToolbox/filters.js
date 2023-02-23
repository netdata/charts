import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Aggregate from "./aggregate"
import Dimensions from "./dimensions"
import Instances from "./instances"
import Nodes from "./nodes"
import GroupBy from "./groupBy"
import TimeAggregation from "./timeAggregation"
import ChartLabels from "./chartLabels"
import useFiltersToolbox from "./useFiltersToolbox"
import Reset from "./reset"

export const Container = ({ children, ...rest }) => <Flex {...rest}>{children}</Flex>

const FilterToolbox = props => {
  const { aggregate, prefixedDimensions } = useFiltersToolbox()

  return (
    <Container {...props}>
      <GroupBy labelProps={{ secondaryLabel: "Group by" }} />
      {aggregate && <Aggregate />}
      <Nodes />
      <Instances />
      <Dimensions labelProps={!prefixedDimensions && { secondaryLabel: "" }} />
      <TimeAggregation />
      {/*<ChartLabels />*/}
      <Reset />
    </Container>
  )
}

export default FilterToolbox
