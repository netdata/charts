import React from "react"
import FiltersContainer from "./filtersContainer"
import Filters from "./filters"
import Reset from "./reset"
import withLoader from "./withLoader"

const FilterToolbox = props => (
  <FiltersContainer {...props}>
    <Filters />
    <Reset />
  </FiltersContainer>
)

export default withLoader(FilterToolbox)
