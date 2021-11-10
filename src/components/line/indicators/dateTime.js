import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import {
  useAttributeValue,
  usePayload,
  useFormatTime,
  useFormatDate,
  useChart,
} from "@/components/provider"
import { TextNano } from "@netdata/netdata-ui/lib/components/typography"
import { Fragment } from "react"

const Latest = () => {
  const chart = useChart()

  usePayload()

  const [, before] = chart.getUI().getXAxisRange()

  const time = useFormatTime(before)
  const date = useFormatDate(before)

  return (
    <Flex gap={1}>
      <TextNano color="textLite">Latest:</TextNano>
      <TextNano color="textDescription">
        {date} • {time}
      </TextNano>
    </Flex>
  )
}

const day1 = 24 * 60 * 60
const hour1 = 60 * 60
const minute1 = 60

const padZero = v => (v > 9 ? v : `0${v}`)

const getDateDiff = (after, before) => {
  const initialDiff = (diff = before - after)

  const days = Math.floor(initialDiff / day1)

  let diff = initialDiff - days * day1

  const hours = Math.floor(diff / hour1)

  diff = diff - hours * hour1

  const minutes = Math.floor(diff / 60)

  diff = diff - minutes * minute1

  return [
    initialDiff >= day1 && `${days}d`,
    initialDiff >= hour1 && `${hours}h`,
    `${padZero(minutes)}m`,
    initialDiff < hour1 && `${padZero(diff)}s`,
  ].filter(Boolean)
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

const DateTime = props => {
  const { highlight } = useAttributeValue("overlays")
  const range = highlight?.range

  return (
    <Flex gap={1} {...props}>
      {range && (
        <Fragment>
          <TextNano color="textLite">Selection:</TextNano>
          <Range after={range[0]} before={range[1]} />
          <TextNano color="textDescription">•</TextNano>
        </Fragment>
      )}
      <Latest />
    </Flex>
  )
}

export default DateTime
