import React from "react"
import styled from "styled-components"
import { Flex, TextMicro } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"

const Container = styled(Flex).attrs({
  alignItems: "center",
  flexWrap: true,
  gap: 3,
  width: { min: "0px" },
})``

const Item = styled(Flex).attrs({
  alignItems: "center",
  gap: 1,
  width: { min: "0px" },
  "data-testid": "chartPopover-collection",
})``

const UpdateEvery = () => {
  const viewUpdateEvery = useAttributeValue("viewUpdateEvery")
  const updateEvery = useAttributeValue("updateEvery")

  const groupingMethod = useAttributeValue("groupingMethod")

  return (
    <Container>
      <Item>
        <TextMicro color="textLite">Granularity:</TextMicro>
        <TextMicro color="text">{updateEvery}s</TextMicro>
      </Item>
      {viewUpdateEvery !== updateEvery && (
        <Item>
          <TextMicro color="textLite">View point:</TextMicro>
          <TextMicro color="text">
            {groupingMethod} {viewUpdateEvery}s
          </TextMicro>
        </Item>
      )}
    </Container>
  )
}

export default UpdateEvery
