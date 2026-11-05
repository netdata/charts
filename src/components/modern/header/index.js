import React from "react"
import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import rearrange from "@netdata/netdata-ui/dist/components/icon/assets/rearrange.svg"
import Icon from "@/components/icon"
import { useAttribute, useAttributeValue } from "@/components/provider"
import ModernTitle from "./title"
import FiltersSwap from "./filtersSwap"
import Actions from "./actions"
import Attention from "./attention"
import AnomalyPill from "./anomalyPill"
import ZoomChip from "./zoomChip"
import { useLeftElements } from "@/components/modern/leftElements"
import reducedMotion from "@/components/helpers/reducedMotion"

const Grip = styled(Icon).attrs({
  svg: rearrange,
  size: "16px",
  color: "textLite",
  "aria-hidden": true,
  "data-testid": "chartHeaderDrag-grip",
})`
  flex: none;
`

const DragHandleBox = styled(Flex).attrs({
  alignItems: "center",
  justifyContent: "center",
  flex: false,
  "data-testid": "chartHeaderToolbox-drag",
})`
  touch-action: none;
  transition: opacity 120ms ease-in-out;

  &:focus-visible {
    opacity: 1;
  }

  ${reducedMotion("transition: none;")}
`

const DragHandle = () => {
  const toolboxProps = useAttributeValue("toolboxProps")
  const focused = useAttributeValue("focused")
  const drag = toolboxProps?.drag

  if (!drag) return null

  const { dragging, ...handleProps } = drag

  return (
    <DragHandleBox
      cursor={dragging ? "grabbing" : "grab"}
      opacity={focused || dragging ? 1 : 0}
      {...handleProps}
    >
      <Grip />
    </DragHandleBox>
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
  const closeFilters = () => setFiltersOpen(false)

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
          <Flex alignItems="center" gap={2} flex="shrink" overflow="hidden" width={{ min: "0px" }}>
            {leftElements.map((Element, index) => (
              <Element key={index} />
            ))}
            {!hideTitle && <ModernTitle />}
          </Flex>
          {hasToolbox && (
            <Actions hasFilters={hasFilters} filtersOpen={open} onToggleFilters={toggleFilters} />
          )}
        </Flex>
        <Flex alignItems="center" gap={2} flex={false}>
          {hasToolbox && <ZoomChip inline />}
          <AnomalyPill />
          <Attention />
          <DragHandle />
        </Flex>
      </Flex>
      <FiltersSwap
        hasFilters={hasFilters}
        open={open}
        onToggle={toggleFilters}
        onClose={closeFilters}
      />
    </Flex>
  )
}

export default ModernHeader
