import React from "react"
// import { useDateTime } from "utils/date-time"
import Item from "./item"
import Section from "./section"

const DateItem = ({ date, title }) => {
  // todo:
  return null
  // const { localeDateString, localeTimeString } = useDateTime()

  // return (
  //   <Item
  //     icon="around_clock"
  //     title={title}
  //     secondary={`${localeDateString(date)} | ${localeTimeString(date)}`}
  //   />
  // )
}

const DateSection = ({ before, after }) => (
  <Section title="Time">
    <DateItem title="From" date={after} />
    <DateItem title="To" date={before} />
  </Section>
)

export default DateSection
