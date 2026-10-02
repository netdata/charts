import React, { useRef, useState } from "react"
import styled, { css } from "styled-components"
import { Box, Drop, Flex, getColor } from "@netdata/netdata-ui"
import {
  useAttributeValue,
  useChart,
  useOnResize,
  useTitle,
  useUnitSign,
} from "@/components/provider"
import useHover from "@/components/useHover"
import FilterToolbox from "@/components/filterToolbox"
import ScopeLine from "@/components/modern/header/scopeLine"
import { radius } from "@/components/modern/tokens"
import { TileContext } from "./context"
import AlertDot, { useTileAlert } from "./alertDot"
import TileActions from "./actions"
import TileReadout from "./readout"
import AnomalyIndicator from "./anomaly"
import { useLeftElements } from "@/components/modern/leftElements"

const selfSignallingLibraries = new Set(["gauge", "number"])
const bodyUnitLibraries = new Set(["number", "gauge", "easypiechart", "bars", "d3pie"])

export const useTileLeftElements = useLeftElements

export const getLatestValueOverlay = (overlays = {}) =>
  Object.values(overlays || {}).find(overlay => overlay?.type === "latestValue") || null

const getFontSize = width => {
  const size = Math.min(Math.max(width || 0, 20), 50)
  const fontSize = parseInt(size / 3, 10)
  return fontSize > 11 ? 11 : fontSize < 8 ? 8 : fontSize
}

const focusRevealed = css`
  &:focus-within [data-tile-actions] {
    opacity: 1;
    pointer-events: auto;
  }

  &:focus-within [data-tile-scope] {
    visibility: visible;
  }

  &:focus-within [data-tile-alert] {
    display: none;
  }
`

const Root = styled(Flex).attrs({ column: true, position: "relative", gap: 1 })`
  box-sizing: border-box;
  padding: 8px 12px 10px;
  border-radius: ${radius.card};
  border: 1px solid
    ${({ isRevealed, theme }) =>
      isRevealed ? getColor("borderSecondary")({ theme }) : "transparent"};
  background: ${getColor("panelBg")};
  font-size: ${({ rootFontSize }) => rootFontSize}px;
  ${focusRevealed};
`

const Header = styled(Flex).attrs({ alignItems: "center", gap: 1.5, position: "relative" })`
  min-height: 22px;
  flex-shrink: 0;
`

const TitleText = styled(Box).attrs({ as: "span", overflow: "hidden", cursor: "pointer" })`
  flex: 1;
  min-width: 0;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 16px;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: ${getColor("textLite")};
`

const Units = styled(Box).attrs({ as: "span", opacity: 0.8 })`
  color: ${getColor("textLite")};
`

const Reveal = styled(Flex).attrs({ alignItems: "center", gap: 0.5 })`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  padding-left: 8px;
  background: ${getColor("panelBg")};
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  pointer-events: ${({ isVisible }) => (isVisible ? "auto" : "none")};
  transition: opacity 120ms ease-in-out;

  &:focus-within {
    opacity: 1;
    pointer-events: auto;
  }
`

const HeadArea = styled(Box).attrs({ position: "relative" })`
  flex-shrink: 0;
  min-width: 0;
`

const ScopeRow = styled(Box).attrs({
  position: "absolute",
  zIndex: 2,
  height: { min: 4 },
  background: "panelBg",
})`
  top: 100%;
  left: 0;
  right: 0;
  min-width: 0;
  padding-bottom: 2px;
  visibility: ${({ isVisible }) => (isVisible ? "visible" : "hidden")};

  ${HeadArea}:hover > &,
  &:focus-within {
    visibility: visible;
  }
`

const Body = styled(Flex).attrs({ column: true, position: "relative", flex: true })`
  min-height: 0;
  overflow: hidden;
  ${({ hasBleed }) =>
    hasBleed &&
    css`
      margin: 2px -12px -10px;
      border-radius: 0 0 ${radius.card} ${radius.card};
    `}
`

const TileTitle = () => {
  const chart = useChart()
  const title = useTitle()
  const units = useUnitSign({ withoutConversion: true, long: true })
  const hideUnits = useAttributeValue("hideUnits") ?? true
  const chartLibrary = useAttributeValue("chartLibrary")
  const showUnits = !!units && !hideUnits && !bodyUnitLibraries.has(chartLibrary)

  const onClick = event => {
    event.preventDefault()
    chart.sdk.trigger("goToLink", chart)
  }

  return (
    <TitleText title={title} onClick={onClick} data-testid="modernTile-title">
      <span>{title}</span>
      {showUnits && <Units>{` • [${units}]`}</Units>}
    </TitleText>
  )
}

const ModernTile = ({ children, customChildren, hasFilters = true, height, width }) => {
  const chart = useChart()
  const { width: chartWidth } = useOnResize()
  const focused = useAttributeValue("focused")
  const hasToolbox = useAttributeValue("hasToolbox")
  const overlays = useAttributeValue("overlays")
  const error = useAttributeValue("error")
  const leftElements = useTileLeftElements(hasToolbox)
  const chartLibrary = useAttributeValue("chartLibrary")
  const ownStatus = selfSignallingLibraries.has(chartLibrary)
  const tileAlert = useTileAlert()
  const alert = ownStatus ? null : tileAlert
  const scopeRef = useRef()
  const [menuActive, setMenuActive] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const hoverRef = useHover(
    {
      onHover: chart.focus,
      onBlur: chart.blur,
      isOut: node =>
        !node ||
        (!node.closest(`[data-toolbox="${chart.getId()}"]`) &&
          !node.closest(`[data-chartid="${chart.getId()}"]`)),
    },
    [chart]
  )

  const revealed = !!focused || menuActive || filtersOpen
  const readout = getLatestValueOverlay(overlays)
  const closeFilters = () => setFiltersOpen(false)

  return (
    <Root
      ref={hoverRef}
      height={height}
      width={width}
      isRevealed={revealed}
      rootFontSize={getFontSize(chartWidth)}
      data-testid="modernTile"
      data-flavour="modern"
      data-revealed={revealed}
    >
      <HeadArea>
        <Header>
          <TileTitle />
          {alert && !revealed && (
            <span data-tile-alert>
              <AlertDot alert={alert} />
            </span>
          )}
          {(hasToolbox || leftElements.length > 0) && (
            <Reveal data-tile-actions isVisible={revealed} data-testid="modernTile-reveal">
              {leftElements.map((Element, index) => (
                <Element key={index} plain />
              ))}
              {hasToolbox && <TileActions hasFilters={hasFilters} onOpenChange={setMenuActive} />}
            </Reveal>
          )}
        </Header>
        <ScopeRow
          ref={scopeRef}
          data-tile-scope
          isVisible={menuActive || filtersOpen || !!error}
          data-testid="modernTile-scope"
        >
          <ScopeLine
            hasFilters={hasFilters}
            open={filtersOpen}
            onToggle={() => setFiltersOpen(prev => !prev)}
          />
        </ScopeRow>
      </HeadArea>
      {hasFilters && filtersOpen && scopeRef.current && (
        <Drop
          target={scopeRef.current}
          align={{ top: "bottom", left: "left" }}
          onEsc={closeFilters}
          onClickOutside={closeFilters}
          data-toolbox={chart.getId()}
          background="dropdown"
          margin={[1, 0, 0]}
          round
          stretch={false}
          width={{ max: "560px" }}
        >
          <FilterToolbox border="none" padding={[1]} />
        </Drop>
      )}
      {!!readout && <TileReadout dimensionId={readout.dimensionId} />}
      <TileContext.Provider value>
        <Body hasBleed={!!readout}>{children}</Body>
      </TileContext.Provider>
      <AnomalyIndicator revealed={revealed} />
      {customChildren}
    </Root>
  )
}

export default ModernTile
