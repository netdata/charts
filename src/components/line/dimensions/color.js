import React from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useChart } from "@/components/provider"

export const Color = styled(Flex).attrs(({ bg }) => ({
  width: "4px",
  round: true,
  "data-testid": "chartDimensions-color",
  flex: false,
  style: { backgroundColor: bg },
}))``

const Container = ({ id, ...rest }) => {
  const chart = useChart()
  const bg = chart.selectDimensionColor(id)

  if (!bg) return null

  return <Color bg={bg} {...rest} />
}

export default Container
