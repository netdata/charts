import { useCallback, useEffect, useMemo } from "react"
import styled from "styled-components"
import { Flex, TextSmall, getColor } from "@netdata/netdata-ui"
import padlockIcon from "@netdata/netdata-ui/dist/components/icon/assets/padlock.svg"
import xIcon from "@netdata/netdata-ui/dist/components/icon/assets/x.svg"
import Icon, { Button } from "@/components/icon"
import Tooltip from "@/components/tooltip"
import { useAttributeValue, useChart } from "@/components/provider"
import { radius } from "@/components/modern/tokens"
import { getNodeDisplayName } from "@/helpers/nodeDisplayName"
import useInstanceLabels from "@/components/instanceIdentity/useInstanceLabels"
import { showAllDimensions, useHiddenDimensionsCount } from "./hiddenDimensions"
import {
  combinedOf,
  dimensionPartsOf,
  identityOf,
  isGrouped,
  labelPartsOf,
  linesOf,
  placeOf,
  singleInstanceOf,
  timeOf,
} from "./scopeSentence"

const noValues = []
const noSummary = {}
const shrinksFirst = 100
const shrinksLast = 1

const LinesButton = styled(Flex).attrs({
  as: "button",
  type: "button",
  padding: [0],
  alignItems: "center",
  flex: { grow: 0, shrink: shrinksFirst },
  width: { min: "0px" },
  overflow: "hidden",
})`
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

const ShowAllButton = styled(TextSmall).attrs({
  as: "button",
  type: "button",
  color: "warning",
  textDecoration: "underline",
  cursor: "pointer",
  whiteSpace: "nowrap",
  margin: [0, 0, 0, 1],
})`
  border: 0;
  background: transparent;
  padding: 0;
`

const Piece = styled(TextSmall).attrs(({ color = "textLite" }) => ({
  color,
  whiteSpace: "pre-wrap",
}))`
  flex-shrink: 0;
`

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

const textSegment = (key, text, color = "textLite") => ({ key, text, color })

const placeSegments = ({ lock, place }) => {
  if (lock) return [textSegment("on", " on "), { key: "lock", lock, text: lock }]
  return place ? [textSegment("on", " on "), textSegment("place", place, "text")] : noValues
}

const combinedSegments = ({ combined, inlineParts, where }) => [
  textSegment(
    "verb",
    combined.grouped ? ` · each ${combined.verb} ` : `, ${combined.verb} across `
  ),
  ...(combined.quantity ? [textSegment("quantity", `${combined.quantity} `)] : noValues),
  ...(combined.count ? [textSegment("count", `${combined.count}`, "text")] : noValues),
  ...inlineParts.flatMap(part => [
    textSegment(`${part.key}-space`, " "),
    { key: part.key, part, text: part.inline.text },
  ]),
  ...(combined.count ? [textSegment("noun-space", " ")] : noValues),
  textSegment("noun", combined.noun),
  ...where,
]

const segmentsOf = ({ combined, inlineParts, lock, place, identity }) => {
  if (combined)
    return combinedSegments({ combined, inlineParts, where: placeSegments({ lock, place }) })

  const where = placeSegments({ lock, place })
  if (lock || !identity) return where
  return [
    ...where,
    textSegment("identity-separator", " · "),
    { key: "identity", identity, text: identity },
  ]
}

const Shrinking = ({ shrink, text, color = "text", testId }) => (
  <Flex flex={{ grow: 0, shrink }} width={{ min: "0px" }} overflow="hidden">
    <TextSmall color={color} truncate data-testid={testId}>
      {text}
    </TextSmall>
  </Flex>
)

const Segment = ({ segment, onRemove }) => {
  if (segment.lock) return <Lock label={segment.lock} />
  if (segment.identity)
    return <Shrinking shrink={shrinksFirst} text={segment.identity} testId="chartScope-identity" />
  if (segment.part)
    return (
      <FilterChip
        chip={segment.part.inline}
        filters={segment.part.filters}
        testId={`chartScopeLine-${segment.part.key}`}
        onRemove={onRemove}
      />
    )
  return <Piece color={segment.color}>{segment.text}</Piece>
}

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
    <Flex flex={false} alignItems="center">
      <TextSmall color="warning" whiteSpace="nowrap" data-testid="chartScope-hidden">
        {leading ? `, ${count} hidden,` : `${count} hidden,`}
      </TextSmall>
      <ShowAllButton
        onClick={event => {
          event.stopPropagation()
          showAllDimensions(chart)
        }}
        data-testid="chartScope-showAll"
        data-track={chart.track("showAllDimensions")}
      >
        Show all
      </ShowAllButton>
    </Flex>
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

const LinesPiece = ({ lines, sentence, hasFilters, open }) => (
  <Tooltip content={sentence} align="bottom">
    <LinesButton
      disabled={!hasFilters}
      aria-expanded={hasFilters ? open : undefined}
      data-testid="chartScope"
    >
      {lines.heading ? (
        <Piece color="text" data-testid="chartScope-heading">
          {lines.heading}
        </Piece>
      ) : null}
      <TextSmall color="text" truncate data-testid="chartScope-members">
        {lines.members}
      </TextSmall>
    </LinesButton>
  </Tooltip>
)

const sentenceOf = (lines, segments, time) => {
  const sentence = `${lines.full}${segments.map(({ text }) => text).join("")}`
  return time ? `${sentence} · ${time}` : sentence
}

const ScopeSentence = ({ hasFilters, open, onToggle }) => {
  const viewDimensions = useAttributeValue("viewDimensions") || noSummary
  const dimensions = useAttributeValue("dimensions")
  const labels = useAttributeValue("labels")
  const selectedDimensions = useAttributeValue("selectedDimensions") || noValues
  const selectedLabels = useAttributeValue("selectedLabels") || noValues
  const instancesTotals = useAttributeValue("instancesTotals")
  const nodesTotals = useAttributeValue("nodesTotals")
  const nodes = useAttributeValue("nodes")
  const aggregationMethod = useAttributeValue("aggregationMethod")
  const scopeCombines = useAttributeValue("scopeCombines")
  const lock = useAttributeValue("scopeLock")?.label
  const nodesById = useAttributeValue("nodesById")
  const instances = useAttributeValue("instances")
  const instanceLabels = useAttributeValue("instanceLabels")
  const groupingMethod = useAttributeValue("groupingMethod")
  const viewUpdateEvery = useAttributeValue("viewUpdateEvery")
  const loadInstanceLabels = useInstanceLabels()
  const hidden = useHiddenDimensionsCount()
  const onRemove = useRemoveFilters()
  const chart = useChart()
  const nodeNameOf = useCallback(
    (nodeId, fallback) => (nodesById ? getNodeDisplayName(chart, nodeId, fallback) : fallback),
    [chart, nodesById]
  )
  const names = viewDimensions.names || noValues
  const grouped = viewDimensions.grouped

  const combined = useMemo(
    () =>
      combinedOf({
        names,
        grouped,
        aggregationMethod,
        instancesTotals,
        nodesTotals,
        scopeCombines,
        aggregated: viewDimensions.aggregated,
        dimensions,
        nodes,
      }),
    [
      names,
      grouped,
      aggregationMethod,
      instancesTotals,
      nodesTotals,
      scopeCombines,
      viewDimensions.aggregated,
      dimensions,
      nodes,
    ]
  )
  const { dimensionParts, labelParts } = useMemo(
    () => ({
      dimensionParts: dimensionPartsOf({ dimensions, selectedDimensions }),
      labelParts: labelPartsOf({ labels, selectedLabels }),
    }),
    [dimensions, selectedDimensions, labels, selectedLabels]
  )

  const lines = useMemo(
    () =>
      names.length
        ? linesOf({
            ids: viewDimensions.ids,
            names,
            grouped,
            dimensions,
            scopeCombines,
            nodeNameOf,
            totals: { nodesTotals, instancesTotals },
          })
        : null,
    [
      viewDimensions.ids,
      names,
      grouped,
      dimensions,
      scopeCombines,
      nodeNameOf,
      nodesTotals,
      instancesTotals,
    ]
  )

  const single = useMemo(
    () =>
      combined || isGrouped(grouped) ? null : singleInstanceOf({ instances, instancesTotals }),
    [combined, grouped, instances, instancesTotals]
  )
  const singleKey = single?.siblings ? single.key : null

  useEffect(() => {
    if (singleKey) loadInstanceLabels()
  }, [singleKey, loadInstanceLabels])

  const place = useMemo(
    () =>
      isGrouped(grouped) || combined?.noun === "nodes"
        ? null
        : placeOf({ nodesTotals, nodes, nodeNameOf }),
    [grouped, combined, nodesTotals, nodes, nodeNameOf]
  )
  const identity = useMemo(
    () => (singleKey ? identityOf({ key: singleKey, instances, instanceLabels }) : null),
    [singleKey, instances, instanceLabels]
  )

  if (!names.length) return hidden > 0 ? <Hidden count={hidden} /> : null

  const inlineParts = combined?.count ? labelParts : noValues
  const trailingParts = combined?.count ? dimensionParts : [...dimensionParts, ...labelParts]
  const segments = segmentsOf({ combined, inlineParts, lock, place, identity })
  const time = timeOf({ groupingMethod, viewUpdateEvery })

  return (
    <Flex
      alignItems="center"
      width={{ min: "0px" }}
      cursor={hasFilters ? "pointer" : "default"}
      onClick={hasFilters ? onToggle : undefined}
      data-testid="chartScopeLine"
    >
      <LinesPiece
        lines={lines}
        sentence={sentenceOf(lines, segments, time)}
        hasFilters={hasFilters}
        open={open}
      />
      {segments.map(segment => (
        <Segment key={segment.key} segment={segment} onRemove={onRemove} />
      ))}
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
      {time ? (
        <>
          <Piece>{" · "}</Piece>
          <Shrinking shrink={shrinksLast} text={time} color="textLite" testId="chartScope-time" />
        </>
      ) : null}
      {hidden > 0 && <Hidden count={hidden} leading />}
    </Flex>
  )
}

export default ScopeSentence
