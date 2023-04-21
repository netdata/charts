import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
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

const FilterToolbox = props => (
  <Container {...props}>
    <ContextScope />
    <GroupBy labelProps={{ secondaryLabel: "Group by" }} />
    <Aggregate />
    <Nodes />
    <Instances />
    <Dimensions />
    <Labels />
    <TimeAggregation />
    <Reset />
  </Container>
)

export default FilterToolbox
