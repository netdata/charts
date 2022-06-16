import React, { Fragment } from "react"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useAttribute, useChart } from "@/components/provider"

const UpdateEvery = () => {
  const chart = useChart()

  const value = useAttribute("groupingMethod")
  const { updateEvery = 0 } = chart.getMetadata()
  const { viewUpdateEvery = 0 } = chart.getPayload()

  return (
    <Fragment>
      <Flex gap={1} data-testid="chartPopover-collection">
        <TextMicro color="textLite">Granularity:</TextMicro>
        <TextMicro color="textDescription">{updateEvery}s</TextMicro>
      </Flex>
      {viewUpdateEvery !== updateEvery && (
        <Flex gap={1} data-testid="chartPopover-collection">
          <TextMicro color="textLite">View point:</TextMicro>
          <TextMicro color="textDescription">
            {value} {viewUpdateEvery}s
          </TextMicro>
        </Flex>
      )}
    </Fragment>
  )
}

export default UpdateEvery
