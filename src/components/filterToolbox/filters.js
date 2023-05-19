import React from "react"
import { Flex } from "@netdata/netdata-ui"
import { useIsHeatmap } from "@/helpers/heatmap"
import Aggregate from "./aggregate"
import Dimensions from "./dimensions"
import Instances from "./instances"
import Nodes from "./nodes"
import ContextScope from "./contextScope"
import GroupBy from "./groupBy"
import TimeAggregation from "./timeAggregation"
import Labels from "./labels"
import Reset from "./reset"

export const Container = ({ children, ...rest }) => <Flex {...rest}>{children}</Flex>

const uppercasedAggrLabel = { secondaryLabel: "The" }
const emptyObject = {}

const FilterToolbox = props => {
  const isHeatmap = useIsHeatmap()

  return (
    <Container {...props}>
      <ContextScope />
      {!isHeatmap && <GroupBy labelProps={{ secondaryLabel: "Group by" }} />}
      <Aggregate labelProps={isHeatmap ? uppercasedAggrLabel : emptyObject} />
      <Nodes />
      <Instances />
      <Dimensions />
      <Labels />
      <TimeAggregation />
      <Reset />
    </Container>
  )
}

export default FilterToolbox
