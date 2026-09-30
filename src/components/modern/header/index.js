import React from "react"
import { Flex } from "@netdata/netdata-ui"
import { useAttribute, useAttributeValue } from "@/components/provider"
import FilterToolbox from "@/components/filterToolbox"
import Status from "@/components/status"
import ModernTitle from "./title"
import ScopeLine from "./scopeLine"
import Actions from "./actions"
import Attention from "./attention"

// the default Status element moves into the scope line (states) and the More menu (reload);
// consumer elements such as ChartOptions still render in the title row
const useLeftElements = () => {
  const leftHeaderElements = useAttributeValue("leftHeaderElements") || []
  return leftHeaderElements.filter(Element => Element !== Status)
}

const ModernHeader = ({ hasFilters = false }) => {
  const leftElements = useLeftElements()
  const hasToolbox = useAttributeValue("hasToolbox")
  const hideTitle = useAttributeValue("hideTitle")
  const [filtersOpen, setFiltersOpen] = useAttribute("filtersOpen")

  const open = hasFilters && !!filtersOpen
  const toggleFilters = () => setFiltersOpen(prev => !prev)

  return (
    <Flex column gap={1} padding={[2, 3, 1]} data-testid="chartHeader" data-flavour="modern">
      <Flex justifyContent="between" alignItems="start" gap={3}>
        <Flex column gap={0.5} flex="shrink" overflow="hidden" width={{ min: "0px" }}>
          <Flex alignItems="center" gap={2} height={{ min: "24px" }}>
            {leftElements.map((Element, index) => (
              <Element key={index} />
            ))}
            {!hideTitle && <ModernTitle />}
            {hasToolbox && (
              <Actions hasFilters={hasFilters} filtersOpen={open} onToggleFilters={toggleFilters} />
            )}
          </Flex>
          <ScopeLine hasFilters={hasFilters} open={open} onToggle={toggleFilters} />
        </Flex>
        <Attention />
      </Flex>
      {open && <FilterToolbox />}
    </Flex>
  )
}

export default ModernHeader
