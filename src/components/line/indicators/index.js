import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import DateTime from "./dateTime"
import { useAttributeValue } from "@/components/provider/selectors"
import { TextNano } from "@netdata/netdata-ui/lib/components/typography"

const Indicators = () => {
  const loaded = useAttributeValue("loaded")

  return (
    <Flex justifyContent="end" padding={[1, 2, 1]}>
      {loaded && <DateTime />}
      {!loaded && <TextNano color="textLite">-</TextNano>}
    </Flex>
  )
}

export default Indicators
