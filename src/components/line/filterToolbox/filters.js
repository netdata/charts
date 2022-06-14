import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Aggregate from "./aggregate"
import Dimensions from "./dimensions"
import GroupBy from "./groupBy"
import DimensionsAggregation from "./dimensionsAggregation"
import useFiltersToolbox from "./useFiltersToolbox"
import Reset from "./reset"

export const Container = ({ children, ...rest }) => <Flex {...rest}>{children}</Flex>

const FilterToolbox = props => {
  const { aggregate, dimensionAggregation, prefixedDimensions } = useFiltersToolbox()

  return (
    <Container {...props}>
      {aggregate && <Aggregate />}
      {dimensionAggregation && <DimensionsAggregation isAggregate={aggregate} />}
      <Dimensions labelProps={!prefixedDimensions && { secondaryLabel: "" }} />
      <GroupBy />
      <Reset />
    </Container>
  )
}

export default FilterToolbox
