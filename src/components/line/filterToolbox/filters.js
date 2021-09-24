import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Separator from "@/components/line/separator"
import Aggregate from "./aggregate"
import Dimensions from "./dimensions"
import GroupBy from "./groupBy"
import DimensionsAggregation from "./dimensionsAggregation"
import useFiltersToolbox from "./useFiltersToolbox"

export const Container = ({ children, ...rest }) => {
  const elements = children.reduce((acc, element, index) => {
    if (!element) return acc

    acc.push(element)
    if (index < children.length - 1) acc.push(<Separator key={index} />)
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
      {dimensionAggregation && <DimensionsAggregation isAggregate={aggregate} />}
      <Dimensions />
      <GroupBy />
    </Container>
  )
}

export default FilterToolbox
