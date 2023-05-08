import React, { Fragment } from "react"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useAttributeValue } from "@/components/provider"

const UpdateEvery = () => {
  const viewUpdateEvery = useAttributeValue("viewUpdateEvery")
  const updateEvery = useAttributeValue("updateEvery")
  const groupingMethod = useAttributeValue("groupingMethod")

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
            {groupingMethod} {viewUpdateEvery}s
          </TextMicro>
        </Flex>
      )}
    </Fragment>
  )
}

export default UpdateEvery
