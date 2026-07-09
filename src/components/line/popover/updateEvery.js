import React from "react"
import styled from "styled-components"
import { TextMicro } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"

const Container = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  min-width: 0;
`

const Item = styled.div.attrs({
  "data-testid": "chartPopover-collection",
})`
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
`

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
