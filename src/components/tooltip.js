import React, { useEffect, useState, useRef, forwardRef } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import LegendColor from "./legendColor"
import LegendName from "./legendName"
import DimensionValue from "./dimensionValue"

const Dimension = ({ chart, id, strong }) => {
  return (
    <Flex gap={1}>
      <LegendColor chart={chart} id={id} height="12px" />
      <Flex as={LegendName} flex chart={chart} id={id} margin={[0, "auto"]} strong={strong} />
      <DimensionValue chart={chart} id={id} strong={strong} />
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
    <DimensionsContainer>
      {dimensionIds.map(id => (
        <Dimension key={id} chart={chart} id={id} strong={hoveredId === id} />
      ))}
    </DimensionsContainer>
  )
}

const Tooltip = forwardRef(({ chart }, ref) => {
  return (
    <div ref={ref} style={{ position: "fixed" }}>
      <Dimensions chart={chart} />
    </div>
  )
})

const Container = ({ chart }) => {
  const ref = useRef()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const events = [
      chart.getUI().on("mousemove", event => {
        const { x, y } = event
        setOpen(true)
        if (!ref.current) return
        ref.current.style.left = `${x + 25}px`
        ref.current.style.top = `${y + 20}px`
      }),
      chart.on("blurChart", () => setOpen(false)),
    ]
    return () => events.forEach(event => event())
  }, [])

  if (!open) return null

  return <Tooltip ref={ref} chart={chart} />
}

export default Container
