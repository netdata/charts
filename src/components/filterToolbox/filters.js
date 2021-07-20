import React, { Fragment } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Separator from "@/components/separator"
import Aggregate from "./aggregate"
import Dimensions from "./dimensions"
import GroupBy from "./groupBy"
import DimensionsAggregation from "./dimensionsAggregation"
import useFiltersToolbox from "./useFiltersToolbox"

const FilterToolbox = () => {
  const { aggregate, dimensionAggregation } = useFiltersToolbox()

  return (
    <Flex gap={1}>
      {aggregate && <Aggregate />}
      {dimensionAggregation && (
        <Fragment>
          <Separator />
          <DimensionsAggregation />
        </Fragment>
      )}
      <Separator />
      <Dimensions />
      <Separator />
      <GroupBy />
    </Flex>
  )
}

export default FilterToolbox
