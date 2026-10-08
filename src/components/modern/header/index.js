import React from "react"
import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import rearrange from "@netdata/netdata-ui/dist/components/icon/assets/rearrange.svg"
import Icon from "@/components/icon"
import { useAttribute, useAttributeValue } from "@/components/provider"
import FilterToolbox from "@/components/filterToolbox"
import ModernTitle from "./title"
import ScopeLine from "./scopeLine"
import Actions from "./actions"
import Attention from "./attention"
import AnomalyPill from "./anomalyPill"
import ZoomChip from "./zoomChip"
import { useLeftElements } from "@/components/modern/leftElements"
import reducedMotion from "@/components/helpers/reducedMotion"

const Grip = styled(Icon).attrs({
  svg: rearrange,
  size: "12px",
  color: "textLite",
  "aria-hidden": true,
  "data-testid": "chartHeaderDrag-grip",
})`
  flex: none;
  opacity: 0;
  transition: opacity 120ms ease-in-out;
`

const DragRow = styled(Flex).attrs({
  alignItems: "center",
  gap: 2,
  flex: "shrink",
  overflow: "hidden",
  width: { min: "0px" },
  "data-testid": "chartHeaderToolbox-drag",
})`
  touch-action: none;

  &:hover ${Grip}, &:focus-visible ${Grip} {
    opacity: 1;
  }

  ${reducedMotion("transition: none;")}
`

const TitleRow = ({ children }) => {
  const toolboxProps = useAttributeValue("toolboxProps")
  const drag = toolboxProps?.drag

  if (!drag)
    return (
      <Flex alignItems="center" gap={2} flex="shrink" overflow="hidden" width={{ min: "0px" }}>
        {children}
      </Flex>
    )

  const { dragging, ...handleProps } = drag

  return (
    <DragRow cursor={dragging ? "grabbing" : "grab"} {...handleProps}>
      <Grip />
      {children}
    </DragRow>
  )
}

const ModernHeader = ({ hasFilters = false }) => {
  const hasToolbox = useAttributeValue("hasToolbox")
  const leftElements = useLeftElements(hasToolbox)
  const hideTitle = useAttributeValue("hideTitle")
  const sparkline = useAttributeValue("sparkline")
  const [filtersOpen, setFiltersOpen] = useAttribute("filtersOpen")

  const open = hasFilters && !!filtersOpen
  const toggleFilters = () => setFiltersOpen(prev => !prev)

  if (sparkline) return null

  return (
    <Flex column gap={1} padding={[2, 3, 1]} data-testid="chartHeader" data-flavour="modern">
      <Flex justifyContent="between" alignItems="center" gap={3}>
        <Flex
          alignItems="center"
          gap={2}
          height={{ min: "24px" }}
          position="relative"
          flex="shrink"
          overflow="hidden"
          width={{ min: "0px" }}
        >
          <TitleRow>
            {leftElements.map((Element, index) => (
              <Element key={index} />
            ))}
            {!hideTitle && <ModernTitle />}
          </TitleRow>
          {hasToolbox && (
            <Actions hasFilters={hasFilters} filtersOpen={open} onToggleFilters={toggleFilters} />
          )}
        </Flex>
        <Flex alignItems="center" gap={2} flex={false}>
          {hasToolbox && <ZoomChip inline />}
          <AnomalyPill />
          <Attention />
        </Flex>
      </Flex>
      <ScopeLine hasFilters={hasFilters} open={open} onToggle={toggleFilters} />
      {open && <FilterToolbox />}
    </Flex>
  )
}

export default ModernHeader
