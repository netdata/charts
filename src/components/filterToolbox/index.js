import React from "react"
import FiltersContainer from "./filtersContainer"
import Filters from "./filters"
import withLoader from "./withLoader"

const FilterToolbox = ({ plain, ...rest }) => (
  <FiltersContainer {...rest} data-testid="chartFilters">
    <Filters plain={plain} />
  </FiltersContainer>
)

export default withLoader(FilterToolbox)
