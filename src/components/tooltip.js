import React, { useEffect, useState, useRef, forwardRef } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Color from "./dimensions/color"
import Name from "./dimensions/name"
import Value from "./dimensions/value"

const Dimension = ({ chart, id, strong }) => {
  return (
    <Flex gap={1} data-testid="chartTooltip-dimension">
      <Color chart={chart} id={id} height="12px" />
      <Flex as={Name} flex chart={chart} id={id} margin={[0, "auto"]} strong={strong} />
      <Value chart={chart} id={id} strong={strong} />
    </Flex>
  )
}

const DimensionsContainer = styled(Flex).attrs({
  round: true,
  border: { side: "all", color: "elementBackground" },
  width: "196px",
  background: ["white", "pure"],
  column: true,
  gap: 1,
  padding: [4],
})`
  box-shadow: 0px 8px 12px rgba(9, 30, 66, 0.15), 0px 0px 1px rgba(9, 30, 66, 0.31);
`

const Dimensions = ({ chart }) => {
  const dimensionIds = chart.getDimensionIds()
  const [hoveredId, setHoveredId] = useState(null)

  useEffect(
    () =>
      chart.onAttributeChange("hoverX", () => {
        const hover = chart.getAttribute("hoverX")
        setHoveredId(hover && hover[1])
      }),
    []
  )

  return (
    <DimensionsContainer data-testid="chartTooltip-dimensions">
      {dimensionIds.map(id => (
        <Dimension key={id} chart={chart} id={id} strong={hoveredId === id} />
      ))}
    </DimensionsContainer>
  )
}

const Tooltip = forwardRef(({ chart }, ref) => {
  return (
    <Flex position="absolute" data-testid="chartTooltip" ref={ref}>
      <Dimensions chart={chart} />
    </Flex>
  )
})

const Container = ({ chart }) => {
  const ref = useRef()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const events = [
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
    ]
    return () => events.forEach(event => event())
  }, [])

  if (!open) return null

  return <Tooltip ref={ref} chart={chart} />
}

export default Container
