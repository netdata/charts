import React, { useEffect, useRef } from "react"
import styled, { keyframes } from "styled-components"
import { Animation, Box, Flex } from "@netdata/netdata-ui"
import xIcon from "@netdata/netdata-ui/dist/components/icon/assets/x.svg"
import Icon, { Button } from "@/components/icon"
import { useChart } from "@/components/provider"
import FilterToolbox from "@/components/filterToolbox"
import usePrefersReducedMotion from "@/components/helpers/usePrefersReducedMotion"
import ScopeLine from "./scopeLine"

const speed = 120

const Stack = styled(Box).attrs({ width: { min: "0px" }, "data-testid": "chartScopeSwap" })`
  display: grid;

  & > * {
    grid-area: 1 / 1;
    min-width: 0;
  }
`

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
`

const fadeOut = keyframes`
  to {
    opacity: 0;
  }
`

const LayerContainer = styled(Flex)`
  &[data-transition="entering"] {
    animation: ${fadeIn} ${speed}ms ease-in-out forwards;
  }

  &[data-transition="exiting"] {
    animation: ${fadeOut} ${speed}ms ease-in-out forwards;
  }

  @media (prefers-reduced-motion: reduce) {
    &[data-transition] {
      animation: none;
    }
  }
`

const Layer = ({ isIn, reduced, children, ...rest }) => (
  <Animation in={isIn} speed={reduced ? 0 : speed}>
    {({ transition, ref }) => (
      <LayerContainer ref={ref} data-transition={transition} {...rest}>
        {children}
      </LayerContainer>
    )}
  </Animation>
)

const focusTargetByLayer = {
  scope: "[aria-expanded]",
  chips: "button:not([disabled])",
}

const FiltersSwap = ({
  hasFilters = false,
  open = false,
  onToggle,
  onClose,
  closeOnClickOutside = false,
}) => {
  const chart = useChart()
  const reduced = usePrefersReducedMotion()
  const ref = useRef()
  const isOpen = hasFilters && !!open
  const previous = useRef(isOpen)

  useEffect(() => {
    if (previous.current === isOpen) return
    previous.current = isOpen

    const layer = isOpen ? "chips" : "scope"
    ref.current
      ?.querySelector(`[data-filters-layer="${layer}"]`)
      ?.querySelector(focusTargetByLayer[layer])
      ?.focus()
  }, [isOpen])

  useEffect(() => {
    if (!closeOnClickOutside || !isOpen) return

    const id = chart.getId()
    const handleMouseDown = event => {
      const node = event.target
      if (ref.current?.contains(node) || node.closest?.(`[data-toolbox="${id}"]`)) return
      onClose()
    }

    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [closeOnClickOutside, isOpen, onClose, chart])

  const onKeyDown = event => {
    if (event.key !== "Escape" || !event.currentTarget.contains(event.target)) return
    onClose()
  }

  return (
    <Stack ref={ref}>
      <Layer isIn={!isOpen} reduced={reduced} column data-filters-layer="scope">
        <ScopeLine hasFilters={hasFilters} open={isOpen} onToggle={onToggle} />
      </Layer>
      {hasFilters && (
        <Layer
          isIn={isOpen}
          reduced={reduced}
          alignItems="center"
          gap={1}
          data-filters-layer="chips"
          data-testid="chartFiltersRow"
          onKeyDown={onKeyDown}
        >
          <FilterToolbox border="none" flex width={{ min: "0px" }} />
          <Button
            icon={<Icon svg={xIcon} size="16px" />}
            title="Hide filters"
            aria-label="Hide filters"
            onClick={onClose}
            data-testid="chartFilters-close"
            data-track={chart.track("hideFilters")}
          />
        </Layer>
      )}
    </Stack>
  )
}

export default FiltersSwap
