import React, { useEffect, useState, useRef, forwardRef } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { unregister } from "@/helpers/makeListeners"
import { useChart, useAttributeValue } from "@/components/provider"
import UpdateEvery from "./updateEvery"
import Timestamp from "./timestamp"
import Dimension from "./dimension"

const DimensionsContainer = styled(Flex).attrs({
  round: true,
  border: { side: "all", color: "elementBackground" },
  width: "196px",
  background: "dropdown",
  column: true,
  gap: 2,
  padding: [4],
})`
  box-shadow: 0px 8px 12px rgba(9, 30, 66, 0.15), 0px 0px 1px rgba(9, 30, 66, 0.31);
`

const emptyArray = [null, null]

const Dimensions = () => {
  const chart = useChart()
  const [x, row] = useAttributeValue("hoverX") || emptyArray
  const dimensionIds = chart.getDimensionIds()

  return (
    <DimensionsContainer data-testid="chartTooltip-dimensions">
      <Flex column>
        {x && <Timestamp value={x} />}
        <UpdateEvery />
      </Flex>
      <Flex gap={1} column>
        {dimensionIds.map(id => (
          <Dimension key={id} id={id} strong={row === id} />
        ))}
      </Flex>
    </DimensionsContainer>
  )
}

const Tooltip = forwardRef((props, ref) => (
  <Flex position="absolute" data-testid="chartTooltip" ref={ref}>
    <Dimensions />
  </Flex>
))

const Container = () => {
  const chart = useChart()
  const ref = useRef()
  const [open, setOpen] = useState(false)

  useEffect(
    () =>
      unregister(
        chart.getUI().on("mousemove", event => {
          if (chart.getAttribute("panning") || chart.getAttribute("highlighting")) return

          let { offsetX, offsetY } = event
          setOpen(true)
          if (!ref.current) return

          const tooltipWidth = ref.current.offsetWidth
          const chartWidth = chart.getUI().getChartWidth()
          if (offsetX + tooltipWidth > chartWidth) {
            ref.current.style.left = `${offsetX - tooltipWidth - 25}px`
          } else {
            ref.current.style.left = `${offsetX + 25}px`
          }

          const tooltipHeight = ref.current.offsetHeight
          const chartHeight = chart.getUI().getChartHeight()

          if (offsetY + tooltipHeight > chartHeight) {
            ref.current.style.top = `${offsetY - tooltipHeight - 20}px`
          } else {
            ref.current.style.top = `${offsetY + 20}px`
          }
        }),
        chart.on("blurChart", () => setOpen(false)),
        chart.onAttributeChange("panning", panning => {
          if (panning) setOpen(false)
        }),
        chart.onAttributeChange("highlighting", panning => {
          if (panning) setOpen(false)
        })
      ),
    []
  )

  if (!open) return null

  return <Tooltip ref={ref} />
}

export default Container
