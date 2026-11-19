import { useState } from "react"
import styled, { css } from "styled-components"
import { Box, Flex, getColor } from "@netdata/netdata-ui"
import {
  useAttributeValue,
  useChart,
  useEmpty,
  useOnResize,
  useTitle,
  useUnitSign,
} from "@/components/provider"
import useHover from "@/components/useHover"
import ScopeLine from "@/components/modern/header/scopeLine"
import { radius } from "@/components/modern/tokens"
import { TileContext } from "./context"
import { ErrorDot, useTileAlert } from "./alertDot"
import TileStatus from "./status"
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
`

const Root = styled(Flex).attrs({
  column: true,
  position: "relative",
  gap: 1,
  round: radius.card,
  background: "cardBackground",
})`
  box-sizing: border-box;
  padding: 8px 12px 10px;
  border: 0;
  font-size: ${({ rootFontSize }) => rootFontSize}px;
  ${focusRevealed};
`

const Header = styled(Flex).attrs({
  alignItems: "center",
  justifyContent: "end",
  flex: false,
  gap: 1.5,
  position: "relative",
})`
  min-height: 22px;
`

const TitleText = styled(Box).attrs({
  as: "span",
  width: { min: "0px" },
  overflow: "hidden",
  cursor: "pointer",
})`
  flex: 1;
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

const Reveal = styled(Flex).attrs({
  alignItems: "center",
  gap: 0.5,
  position: "absolute",
  top: 0,
  bottom: 0,
  padding: [0, 1, 0, 2],
  background: "cardBackground",
  right: "100%",
})`
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  pointer-events: ${({ isVisible }) => (isVisible ? "auto" : "none")};
  transition: opacity 120ms ease-in-out;

  &:focus-within {
    opacity: 1;
    pointer-events: auto;
  }
`

const HeadArea = styled(Box).attrs({ position: "relative", width: { min: "0px" } })`
  flex-shrink: 0;
`

const scopeRowProps = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  zIndex: 2,
  width: { min: "0px" },
  height: { min: 4 },
  padding: [0, 0, 0.5],
  background: "cardBackground",
}

const bleedProps = { margin: [0.5, -3, -2.5], round: { side: "bottom", size: radius.card } }

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
  const hideTitle = useAttributeValue("hideTitle")
  const hasToolbox = useAttributeValue("hasToolbox")
  const overlays = useAttributeValue("overlays")
  const error = useAttributeValue("error")
  const empty = useEmpty()
  const quietError = !!error && !empty
  const leftElements = useTileLeftElements(hasToolbox)
  const chartLibrary = useAttributeValue("chartLibrary")
  const ownStatus = selfSignallingLibraries.has(chartLibrary)
  const tileAlert = useTileAlert()
  const alert = ownStatus ? null : tileAlert
  const [menuActive, setMenuActive] = useState(false)

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

  const revealed = !!focused || menuActive
  const readout = getLatestValueOverlay(overlays)

  return (
    <Root
      ref={hoverRef}
      height={height}
      width={width}
      rootFontSize={getFontSize(chartWidth)}
      data-testid="modernTile"
      data-flavour="modern"
      data-revealed={revealed}
    >
      <HeadArea>
        <Header>
          {!hideTitle && <TileTitle />}
          <Flex alignItems="center" alignSelf="stretch" flex={false} gap={1.5} position="relative">
            {(hasToolbox || leftElements.length > 0) && (
              <Reveal data-tile-actions isVisible={revealed} data-testid="modernTile-reveal">
                {leftElements.map((Element, index) => (
                  <Element key={index} plain />
                ))}
                {hasToolbox && <TileActions hasFilters={hasFilters} onOpenChange={setMenuActive} />}
              </Reveal>
            )}
            {alert && (
              <span data-tile-alert>
                <TileStatus alert={alert} />
              </span>
            )}
            {quietError && (
              <span data-tile-alert>
                <ErrorDot error={error} />
              </span>
            )}
          </Flex>
        </Header>
        {!!error && empty && (
          <Box {...scopeRowProps} data-tile-scope data-testid="modernTile-scope">
            <ScopeLine hasFilters={false} />
          </Box>
        )}
      </HeadArea>
      {!!readout && <TileReadout dimensionId={readout.dimensionId} />}
      <TileContext.Provider value>
        <Flex
          column
          position="relative"
          flex
          height={{ min: "0px" }}
          overflow="hidden"
          {...(readout && bleedProps)}
        >
          {children}
        </Flex>
      </TileContext.Provider>
      <AnomalyIndicator revealed={revealed} />
      {customChildren}
    </Root>
  )
}

export default ModernTile
