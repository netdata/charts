import React from "react"
import { Flex, TextNano } from "@netdata/netdata-ui"
import {
  useAttributeValue,
  usePayload,
  useFormatTime,
  useFormatDate,
  useChart,
} from "@/components/provider"

const Timestamp = ({ timestamp }) => {
  const time = useFormatTime(timestamp)
  const date = useFormatDate(timestamp)

  return (
    <TextNano color="textDescription" data-testid="chartIndicator-dateTime-latest-value">
      {date} • {time}
    </TextNano>
  )
}

const Latest = () => {
  const chart = useChart()

  const [x] = useAttributeValue("hoverX") || []

  const { data } = usePayload()

  if (!data.length) return null

  const index = x ? chart.getClosestRow(x) : data.length - 1
  const timestamp = data[index]?.[0]

  return (
    <Flex gap={1}>
      <TextNano color="textLite">{x ? "Hovering" : "Latest"}:</TextNano>
      {!!timestamp && <Timestamp timestamp={timestamp} />}
    </Flex>
  )
}

const day1 = 24 * 60 * 60
const hour1 = 60 * 60
const minute1 = 60

const padZero = v => (v > 9 ? v : `0${v}`)

const buildDatetimePart = ({ value, unit, check, hasPrev }) => {
  if (check?.()) return `${hasPrev ? padZero(value) : value}${unit}`
}

export const getDateDiff = (after, before) => {
  const initialDiff = (diff = before - after)

  const days = Math.floor(initialDiff / day1)

  let diff = initialDiff - days * day1

  const hours = Math.floor(diff / hour1)

  diff = diff - hours * hour1

  const minutes = Math.floor(diff / 60)

  diff = diff - minutes * minute1

  return [
    {
      value: days,
      unit: "d",
      check: () => initialDiff >= day1 && !!days,
    },
    {
      value: hours,
      unit: "h",
      check: () => initialDiff >= hour1 && !!hours,
    },
    {
      value: minutes,
      unit: "m",
      check: () => !!minutes,
    },
    {
      value: diff,
      unit: "s",
      check: () => initialDiff < hour1 && !!diff,
    },
  ].reduce((acc, part) => {
    const datetimePart = buildDatetimePart({ ...part, hasPrev: !!acc[acc.length - 1] })
    if (datetimePart) acc.push(datetimePart)
    return acc
  }, [])
}

const DayRange = ({ date, after, before }) => {
  const afterTime = useFormatTime(after * 1000)
  const beforeTime = useFormatTime(before * 1000)

  const dateDiff = getDateDiff(after, before)

  return (
    <Flex gap={1}>
      <TextNano color="textDescription">{date} •</TextNano>
      <TextNano color="textLite">
        {afterTime} → {beforeTime}
      </TextNano>
      <TextNano color="textDescription">• {dateDiff}</TextNano>
    </Flex>
  )
}

const DaysRange = ({ afterDate, beforeDate, after, before }) => {
  const afterTime = useFormatTime(after * 1000)
  const beforeTime = useFormatTime(before * 1000)

  const dateDiff = getDateDiff(after, before)

  return (
    <Flex gap={1}>
      <TextNano color="textDescription">{afterDate} •</TextNano>
      <TextNano color="textLite">{afterTime} →</TextNano>
      <TextNano color="textDescription">{beforeDate} •</TextNano>
      <TextNano color="textLite">{beforeTime}</TextNano>
      <TextNano color="textDescription">• {dateDiff}</TextNano>
    </Flex>
  )
}

const Range = ({ after, before }) => {
  const beforeDate = useFormatDate(before * 1000)
  const afterDate = useFormatDate(after * 1000)

  return beforeDate === afterDate ? (
    <DayRange date={afterDate} after={after} before={before} />
  ) : (
    <DaysRange afterDate={afterDate} beforeDate={beforeDate} after={after} before={before} />
  )
}

const Indicators = props => {
  const chart = useChart()
  const { highlight } = useAttributeValue("overlays")
  const range = highlight?.range
  const { after, before } = highlight?.moveX ?? {}

  const onClick = () => {
    if (before && after) chart.moveX(after, before)
  }

  return (
    <Flex padding={[1]} gap={1} justifyContent="between" flex {...props}>
      {range ? (
        <Flex onClick={onClick} cursor="pointer" gap={1} padding={[0, 11, 0]}>
          <TextNano color="textLite">Highlight:</TextNano>
          <Range after={range[0]} before={range[1]} />
        </Flex>
      ) : (
        <div />
      )}
      <Latest />
    </Flex>
  )
}

export default Indicators
