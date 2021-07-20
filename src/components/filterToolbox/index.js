import React from "react"
import { useInitialLoading, useEmpty } from "@/components/provider"
import FiltersContainer from "./filtersContainer"
import Filters from "./filters"
import Skeleton from "./skeleton"
import Reset from "./reset"

const FilterToolbox = () => (
  <FiltersContainer>
    <Filters />
    <Reset />
  </FiltersContainer>
)

const Container = props => {
  const initialLoading = useInitialLoading()

  return initialLoading ? <Skeleton /> : <FilterToolbox {...props} />
}

export default Container
