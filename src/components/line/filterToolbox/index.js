import React from "react"
import FiltersContainer from "./filtersContainer"
import Filters from "./filters"
import withLoader from "./withLoader"

const FilterToolbox = props => (
  <FiltersContainer {...props}>
    <Filters />
  </FiltersContainer>
)

export default withLoader(FilterToolbox)
