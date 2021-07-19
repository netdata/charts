import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useInitialLoading, useEmpty } from "@/components/provider"
import Filters from "./filters"

const FilterToolbox = () => {
  const initialLoading = useInitialLoading()
  const empty = useEmpty()

  return (
    <Flex
      justifyContent="between"
      border={{ side: "bottom", color: "borderSecondary" }}
      padding={[0.5]}
    >
      <Filters />
      {/* <Reset /> */}
    </Flex>
  )
}

export default FilterToolbox
