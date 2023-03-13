import React, { Fragment } from "react"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useChart, useAttributeValue } from "@/components/provider"

const UpdateEvery = () => {
  const chart = useChart()

  const { updateEvery } = chart.getMetadata()
  const { viewUpdateEvery = 0, updateEvery: dataUpdateEvery } = chart.getPayload()
  const granularity = dataUpdateEvery || updateEvery || 0

  const groupingMethod = useAttributeValue("groupingMethod")

  return (
    <Fragment>
      <Flex gap={1} data-testid="chartPopover-collection">
        <TextMicro color="textLite">Granularity:</TextMicro>
        <TextMicro color="textDescription">{granularity}s</TextMicro>
      </Flex>
      {viewUpdateEvery !== granularity && (
        <Flex gap={1} data-testid="chartPopover-collection">
          <TextMicro color="textLite">View point:</TextMicro>
          <TextMicro color="textDescription">
            {groupingMethod} {viewUpdateEvery}s
          </TextMicro>
        </Flex>
      )}
    </Fragment>
  )
}

export default UpdateEvery
