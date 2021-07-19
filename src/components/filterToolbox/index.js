import React from "react"
import { useInitialLoading, useEmpty } from "@/components/provider"
import FiltersContainer from "./filtersContainer"
import Filters from "./filters"
import Skeleton from "./skeleton"

const FilterToolbox = () => {
  return (
    <FiltersContainer>
      <Filters />

      {/* <Reset /> */}
    </FiltersContainer>
  )
}

const Container = props => {
  const initialLoading = useInitialLoading()
  // const empty = useEmpty()

  return initialLoading ? <Skeleton /> : <FilterToolbox {...props} />
}

export default Container
