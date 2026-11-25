import { useCallback, useMemo } from "react"
import styled from "styled-components"
import { Box, Flex, TextSmall, getColor } from "@netdata/netdata-ui"
import padlockIcon from "@netdata/netdata-ui/dist/components/icon/assets/padlock.svg"
import xIcon from "@netdata/netdata-ui/dist/components/icon/assets/x.svg"
import Icon, { Button } from "@/components/icon"
import Tooltip from "@/components/tooltip"
import { useAttributeValue, useChart } from "@/components/provider"
import { radius } from "@/components/modern/tokens"
import { showAllDimensions, useHiddenDimensionsCount } from "./hiddenDimensions"
import { belowZeroOf, combinedOf, dimensionPartsOf, labelPartsOf, linesOf } from "./scopeSentence"

const noValues = []
const noSummary = {}

const LinesButton = styled(Box).attrs({ as: "button", type: "button", padding: [0] })`
  border: 0;
  background: transparent;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: inherit;

  &:focus-visible {
    outline: 2px solid ${getColor("primary")};
    outline-offset: 1px;
    border-radius: ${radius.control};
  }
`

const ChipSurface = styled(Flex).attrs({
  flex: false,
  alignItems: "center",
  gap: 0.5,
  round: radius.pill,
})`
  background-color: color-mix(in srgb, ${getColor("primary")} 14%, transparent);
  border: 1px solid color-mix(in srgb, ${getColor("primary")} 45%, transparent);
`

const HiddenText = styled(Box).attrs({ as: "span" })`
  flex-shrink: 0;
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
  color: ${getColor("warning")};
`

const ShowAllButton = styled(Box).attrs({
  as: "button",
  margin: [0, 0, 0, 1],
  padding: [0],
  cursor: "pointer",
})`
  flex-shrink: 0;
  border: 0;
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
  text-decoration: underline;
  color: ${getColor("warning")};
`

const Piece = ({ color = "textLite", children, ...rest }) => (
  <TextSmall color={color} whiteSpace="pre" {...rest}>
    {children}
  </TextSmall>
)

const WithMore = ({ more, children }) =>
  more.length ? (
    <Tooltip content={more.join(", ")} align="bottom">
      {children}
    </Tooltip>
  ) : (
    children
  )

const ListPiece = ({ text, more, testId, color = "text" }) => (
  <WithMore more={more}>
    <Piece color={color} tabIndex={more.length ? 0 : undefined} data-testid={testId}>
      {text}
    </Piece>
  </WithMore>
)

const Lock = ({ label }) => (
  <Flex
    flex={false}
    alignItems="center"
    gap={0.75}
    border={{ side: "bottom", type: "dashed", color: "textNoFocus" }}
    data-testid="chartScopeLine-lock"
  >
    <Icon svg={padlockIcon} size="10px" color="textLite" />
    <Piece color="text">{label}</Piece>
  </Flex>
)

const OnLock = ({ lock }) =>
  lock ? (
    <>
      <Piece>{" on "}</Piece>
      <Lock label={lock} />
    </>
  ) : null

const FilterChip = ({ chip, filters, testId, onRemove }) => {
  const chart = useChart()

  return (
    <ChipSurface padding={[0, 0.5, 0, 1.5]} data-testid={testId}>
      <ListPiece text={chip.text} more={chip.more} testId={`${testId}-text`} color="primary" />
      <Button
        icon={<Icon svg={xIcon} size="9px" />}
        hoverIndicator={false}
        aria-label={`Remove filter ${chip.label || chip.text}`}
        onClick={event => {
          event.stopPropagation()
          onRemove(filters)
        }}
        data-track={chart.track("scopeFilterRemove")}
      />
    </ChipSurface>
  )
}

const Combined = ({ combined, inlineParts, lock, onRemove }) => (
  <>
    {combined.grouped ? (
      <Piece>{` · each ${combined.verb} `}</Piece>
    ) : (
      <Piece>{combined.count ? " of " : " of all "}</Piece>
    )}
    {combined.quantity ? <Piece>{`${combined.quantity} `}</Piece> : null}
    {combined.count ? <Piece color="text">{`${combined.count}`}</Piece> : null}
    {inlineParts.map(({ key, inline, filters }) => (
      <Flex key={key} flex={false} alignItems="center">
        <Piece> </Piece>
        <FilterChip
          chip={inline}
          filters={filters}
          testId={`chartScopeLine-${key}`}
          onRemove={onRemove}
        />
      </Flex>
    ))}
    {combined.count ? <Piece> </Piece> : null}
    <Piece>{combined.noun}</Piece>
    <OnLock lock={lock} />
    {combined.grouped ? null : (
      <>
        <Piece>{", "}</Piece>
        <Piece>{combined.verb}</Piece>
      </>
    )}
  </>
)

const FilterPart = ({ partKey, chip, hides, filters, onRemove }) => (
  <Flex flex={false} alignItems="center">
    <Piece>{" · "}</Piece>
    <FilterChip
      chip={chip}
      filters={filters}
      testId={`chartScopeLine-${partKey}`}
      onRemove={onRemove}
    />
    {hides ? (
      <Flex flex={false} alignItems="center" data-testid={`chartScopeLine-${partKey}-hides`}>
        <Piece>{" hides "}</Piece>
        <ListPiece
          text={hides.text}
          more={hides.more}
          color="textLite"
          testId={`chartScopeLine-${partKey}-hidden`}
        />
      </Flex>
    ) : null}
  </Flex>
)

const Hidden = ({ count, leading }) => {
  const chart = useChart()

  return (
    <>
      <HiddenText data-testid="chartScope-hidden">
        {leading ? `, ${count} hidden,` : `${count} hidden,`}
      </HiddenText>
      <ShowAllButton
        type="button"
        onClick={event => {
          event.stopPropagation()
          showAllDimensions(chart)
        }}
        data-testid="chartScope-showAll"
        data-track={chart.track("showAllDimensions")}
      >
        Show all
      </ShowAllButton>
    </>
  )
}

const keptSelections = (values, matchType, removed) =>
  values
    .filter(
      value => !removed.some(filter => filter.matchType === matchType && filter.value === value)
    )
    .map(value => ({ value }))

const useRemoveFilters = () => {
  const chart = useChart()
  const consumerOwnsFilters = !!useAttributeValue("scopeFilterRemove")

  return useCallback(
    removed => {
      if (consumerOwnsFilters) {
        chart.trigger("scopeFilterRemove", removed)
        chart.sdk.trigger("scopeFilterRemove", chart, removed)
        return
      }

      const removes = matchType => removed.some(filter => filter.matchType === matchType)
      if (removes("dimensions"))
        chart.updateDimensionsAttribute(
          keptSelections(chart.getAttribute("selectedDimensions"), "dimensions", removed)
        )
      if (removes("labels"))
        chart.updateLabelsAttribute(
          keptSelections(chart.getAttribute("selectedLabels"), "labels", removed)
        )
    },
    [chart, consumerOwnsFilters]
  )
}

const LinesPiece = ({ lines, hasFilters, open }) => (
  <WithMore more={lines.more}>
    <LinesButton
      disabled={!hasFilters}
      aria-expanded={hasFilters ? open : undefined}
      data-testid="chartScope"
    >
      <Piece color="text">{lines.text}</Piece>
    </LinesButton>
  </WithMore>
)

const ScopeSentence = ({ hasFilters, open, onToggle }) => {
  const viewDimensions = useAttributeValue("viewDimensions") || noSummary
  const dimensions = useAttributeValue("dimensions")
  const labels = useAttributeValue("labels")
  const selectedDimensions = useAttributeValue("selectedDimensions") || noValues
  const selectedLabels = useAttributeValue("selectedLabels") || noValues
  const instancesTotals = useAttributeValue("instancesTotals")
  const nodesTotals = useAttributeValue("nodesTotals")
  const groupBy = useAttributeValue("groupBy")
  const groupByLabel = useAttributeValue("groupByLabel")
  const aggregationMethod = useAttributeValue("aggregationMethod")
  const scopeCombines = useAttributeValue("scopeCombines")
  const lock = useAttributeValue("scopeLock")?.label
  const hidden = useHiddenDimensionsCount()
  const onRemove = useRemoveFilters()
  const names = viewDimensions.names || noValues

  const combined = useMemo(
    () =>
      combinedOf({
        names,
        groupBy,
        aggregationMethod,
        instancesTotals,
        nodesTotals,
        scopeCombines,
      }),
    [names, groupBy, aggregationMethod, instancesTotals, nodesTotals, scopeCombines]
  )
  const { dimensionParts, labelParts } = useMemo(
    () => ({
      dimensionParts: dimensionPartsOf({ dimensions, selectedDimensions }),
      labelParts: labelPartsOf({ labels, selectedLabels }),
    }),
    [dimensions, selectedDimensions, labels, selectedLabels]
  )

  if (!names.length) return hidden > 0 ? <Hidden count={hidden} /> : null

  const lines = linesOf({ names, groupBy, groupByLabel, scopeCombines })
  const belowZero = belowZeroOf({ names, sts: viewDimensions.sts })
  const inlineParts = combined?.count ? labelParts : noValues
  const trailingParts = combined?.count ? dimensionParts : [...dimensionParts, ...labelParts]

  return (
    <Flex
      alignItems="center"
      flexWrap
      width={{ min: "0px" }}
      cursor={hasFilters ? "pointer" : "default"}
      onClick={hasFilters ? onToggle : undefined}
      data-testid="chartScopeLine"
    >
      <LinesPiece lines={lines} hasFilters={hasFilters} open={open} />
      {combined ? (
        <Combined combined={combined} inlineParts={inlineParts} lock={lock} onRemove={onRemove} />
      ) : (
        <OnLock lock={lock} />
      )}
      {belowZero ? (
        <>
          <Piece>{" · "}</Piece>
          <Piece color="text">{belowZero}</Piece>
          <Piece>{" below zero"}</Piece>
        </>
      ) : null}
      {trailingParts.map(({ key, chip, hides, filters }) => (
        <FilterPart
          key={key}
          partKey={key}
          chip={chip}
          hides={hides}
          filters={filters}
          onRemove={onRemove}
        />
      ))}
      {hidden > 0 && <Hidden count={hidden} leading />}
    </Flex>
  )
}

export default ScopeSentence
