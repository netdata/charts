import React from "react"
import styled from "styled-components"
import {
  Button,
  CopyToClipboard,
  Flex,
  TextBigger,
  TextMicro,
  TextSmall,
} from "@netdata/netdata-ui"
import { useChart, useAttributeValue, useUnitSign, useValueWithUnit } from "@/components/provider"
import { numerals } from "@/components/modern/numerals"
import { makeModernColor } from "@/components/modern/groupBoxes/scale"
import SparklineCanvas from "@/components/drawer/correlate/sparklineCanvas"
import { getBoxDetails } from "./details"
import { getDrillFilters, applyDrillFilter } from "./filters"

const ActionButton = styled(Button).attrs(({ label }) => ({
  flavour: "borderless",
  neutral: true,
  textTransform: "none",
  title: label,
}))`
  && {
    max-width: 100%;
    min-width: 0;
    justify-content: flex-start;
  }

  && > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

const ValueNumeral = styled(TextBigger)`
  ${numerals}
`

const LabelGrid = styled(Flex).attrs({ gap: 3, gapY: 1 })`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
`

const ordinal = n => {
  const suffixes = ["th", "st", "nd", "rd"]
  const v = n % 100
  return `${n}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`
}

const LabelValues = ({ values, pinned }) => {
  if (pinned)
    return (
      <TextMicro wordBreak="break-word" data-testid="groupBoxCard-labelValue">
        {values.join(", ") || "-"}
      </TextMicro>
    )

  return (
    <Flex gap={1} alignItems="center" title={values.join(", ")}>
      <TextMicro truncate data-testid="groupBoxCard-labelValue">
        {values[0] || "-"}
      </TextMicro>
      {values.length > 1 && (
        <Flex
          flex={false}
          background="elementBackground"
          padding={[0, 1]}
          round
          data-testid="groupBoxCard-more"
        >
          <TextMicro color="textLite">{`+${values.length - 1}`}</TextMicro>
        </Flex>
      )}
    </Flex>
  )
}

const BoxCard = ({
  id,
  name,
  path,
  groupName,
  rank,
  of,
  rowData,
  pinned,
  focus = [],
  onZoom,
  onClose,
}) => {
  const chart = useChart()
  const min = useAttributeValue("min")
  const max = useAttributeValue("max")
  const grouped = useAttributeValue("viewDimensions")?.grouped
  const nodes = useAttributeValue("nodes")
  const units = useUnitSign()
  const details = getBoxDetails(chart, id, rowData)
  const { convertedValue, convertedUnit } = useValueWithUnit(details.value, {
    dimensionId: id,
    scaleByValue: true,
  })
  const color = makeModernColor(chart)(min, max)(Math.abs(details.value ?? 0))
  const filters = pinned ? getDrillFilters(id, grouped, nodes) : []
  const stats =
    details.min === null
      ? null
      : `min ${chart.getConvertedValue(details.min)} · avg ${chart.getConvertedValue(details.avg)} · max ${chart.getConvertedValue(details.max)} ${units}`

  return (
    <Flex column gap={2} padding={[3]} width={75} data-testid="groupBoxCard">
      <Flex column gap={1}>
        {!!path.length && (
          <TextMicro color="textLite" truncate>
            {path.join(" › ")}
          </TextMicro>
        )}
        <TextSmall strong truncate data-testid="groupBoxCard-name">
          {name}
        </TextSmall>
      </Flex>
      <Flex alignItems="center" gap={3}>
        <ValueNumeral strong whiteSpace="nowrap" data-testid="groupBoxCard-value">
          {convertedUnit ? `${convertedValue} ${convertedUnit}` : `${convertedValue}`}
        </ValueNumeral>
        <Flex flex>
          <SparklineCanvas values={details.series} color={color} height={24} />
        </Flex>
      </Flex>
      {rank > 0 && (
        <TextMicro color="textLite" data-testid="groupBoxCard-rank">
          {`${ordinal(rank)} of ${of} in ${groupName}`}
        </TextMicro>
      )}
      {stats && (
        <TextMicro color="textLite" data-testid="groupBoxCard-stats">
          {stats}
        </TextMicro>
      )}
      {details.contribution > 0 && (
        <TextMicro color="textLite" data-testid="groupBoxCard-share">
          {`${chart.getConvertedValue(details.contribution)}% of the chart total`}
        </TextMicro>
      )}
      {details.anomalyRate > 0 && (
        <TextMicro color="textLite" data-testid="groupBoxCard-anomaly">
          {`Anomalous ${chart.getConvertedValue(details.anomalyRate)}% of the window`}
        </TextMicro>
      )}
      {!!details.labels.length && (
        <LabelGrid
          border={{ side: "top", color: "borderSecondary" }}
          padding={[2, 0, 0]}
          overflow={pinned ? { vertical: "auto" } : "hidden"}
          height={pinned ? { max: 60 } : undefined}
        >
          {details.labels.map(({ key, values }) => (
            <React.Fragment key={key}>
              <TextMicro color="textLite">{key}</TextMicro>
              <LabelValues values={values} pinned={pinned} />
            </React.Fragment>
          ))}
        </LabelGrid>
      )}
      {pinned && (
        <Flex
          column
          gap={1}
          alignItems="start"
          border={{ side: "top", color: "borderSecondary" }}
          padding={[2, 0, 0]}
          data-testid="groupBoxCard-actions"
        >
          <Flex gap={1} width="100%">
            <ActionButton
              label={path.length ? `Zoom into ${groupName}` : "Zoom in"}
              disabled={!path.length || path.join(",") === focus.join(",")}
              onClick={() => onZoom(path)}
            />
            <ActionButton
              label="Zoom out"
              disabled={!focus.length}
              onClick={() => onZoom(focus.slice(0, -1))}
            />
          </Flex>
          {filters.map(filter => (
            <ActionButton
              key={filter.selector}
              label={filter.label}
              onClick={() => {
                applyDrillFilter(chart, filter)
                onClose()
              }}
            />
          ))}
          <CopyToClipboard
            text={details.labels
              .map(({ key, values }) => `${key}: ${values.join(", ")}`)
              .join("\n")}
          >
            <ActionButton label="Copy labels" />
          </CopyToClipboard>
        </Flex>
      )}
    </Flex>
  )
}

export default BoxCard
