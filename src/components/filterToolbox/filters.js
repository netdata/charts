import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Separator from "@/components/separator"
import Aggregate from "./aggregate"
import Dimensions from "./dimensions"
import GroupBy from "./groupBy"
import DimensionsAggregation from "./dimensionsAggregation"
import useFiltersToolbox from "./useFiltersToolbox"

export const Container = ({ children, ...rest }) => {
  const elements = children.reduce((acc, element) => {
    if (!element) return acc

    acc.push(element)
    acc.push(<Separator />)
    return acc
  }, [])

  return (
    <Flex gap={1} {...rest}>
      {elements}
    </Flex>
  )
}

const FilterToolbox = props => {
  const { aggregate, dimensionAggregation } = useFiltersToolbox()

  return (
    <Container {...props}>
      {aggregate && <Aggregate />}
      {dimensionAggregation && <DimensionsAggregation />}
      <Dimensions />
      <GroupBy />
    </Container>
  )
}

export default FilterToolbox
