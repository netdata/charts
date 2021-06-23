import React, { useEffect, useState, useRef, forwardRef, useMemo } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import LegendColor from "./legendColor"
import LegendName from "./legendName"
import DimensionValue from "./dimensionValue"

const Dimension = ({ chart, index }) => {
  return (
    <Flex gap={1}>
      <LegendColor chart={chart} index={index} width="2px" height="12px" color="bright" />
      <Flex as={LegendName} flex chart={chart} index={index} color="bright" margin={[0, "auto"]} />
      <DimensionValue chart={chart} index={index} color="bright" />
    </Flex>
  )
}

const Dimensions = ({ chart }) => {
  const { dimensionIds } = chart.getPayload()
  const list = useMemo(() => [...Array(Math.min(10, dimensionIds.length))], [dimensionIds.length])

  return (
    <Flex background={["gray", "cod"]} width="196px" column gap={1} padding={[1, 2]}>
      {list.map((v, index) => (
        <Dimension key={dimensionIds[index]} chart={chart} index={index} />
      ))}
    </Flex>
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
      chart.on("blur", () => setOpen(false)),
    ]
    return () => events.forEach(event => event())
  }, [])

  if (!open) return null

  return <Tooltip ref={ref} chart={chart} />
}

export default Container
