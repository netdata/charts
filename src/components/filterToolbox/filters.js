import React, { Fragment } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Separator from "@/components/separator"
import Aggregate from "./aggregate"
import Dimensions from "./dimensions"
import GroupBy from "./groupBy"
import DimensionsAggregation from "./dimensionsAggregation"
import useFiltersToolbox from "./useFiltersToolbox"

export const Container = props => <Flex gap={1} {...props} />

const FilterToolbox = props => {
  const { aggregate, dimensionAggregation } = useFiltersToolbox()

  return (
    <Container {...props}>
      {aggregate && <Aggregate />}
      {dimensionAggregation && (
        <Fragment>
          {aggregate && <Separator />}
          <DimensionsAggregation />
        </Fragment>
      )}
      {(aggregate || dimensionAggregation) && <Separator />}
      <Dimensions />
      <Separator />
      <GroupBy />
    </Container>
  )
}

export default FilterToolbox
