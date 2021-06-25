import React, { useEffect, useState, forwardRef, useRef } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import panIcon from "@netdata/netdata-ui/lib/components/icon/assets/pan.svg"
import selectedArea from "@netdata/netdata-ui/lib/components/icon/assets/selected_area.svg"
import selectIcon from "@netdata/netdata-ui/lib/components/icon/assets/select.svg"
import zoomInIcon from "@netdata/netdata-ui/lib/components/icon/assets/zoom_in.svg"
import zoomOutIcon from "@netdata/netdata-ui/lib/components/icon/assets/zoom_out.svg"
import Icon, { Button } from "@/components/icon"

const Container = styled(Flex).attrs({
  padding: [3],
  gap: 3,
  background: "elementBackground",
  round: true,
})`
  position: absolute;
  top: 8px;
  right: 8px;
`

const Toolbox = forwardRef(({ chart }, ref) => {
  const [navigation, setNavigation] = useState(chart.getAttribute("navigation"))

  useEffect(() => chart.onAttributeChange("navigation", setNavigation), [])

  const pan = () => {
    chart.updateAttribute("navigation", "pan")
  }

  const select = () => {
    chart.updateAttribute("navigation", "select")
  }

  const highlight = () => {
    chart.updateAttribute("navigation", "highlight")
  }

  return (
    <Container data-testid="chartToolbox" ref={ref}>
      <Button
        icon={<Icon svg={panIcon} />}
        title="Pan"
        onClick={pan}
        active={navigation === "pan"}
        data-testid="chartToolbox-pan"
      />
      <Button
        icon={<Icon svg={selectedArea} />}
        title="Select"
        onClick={select}
        active={navigation === "select"}
        data-testid="chartToolbox-select"
      />
      <Button
        icon={<Icon svg={selectIcon} />}
        title="Select Area"
        onClick={highlight}
        active={navigation === "highlight"}
        data-testid="chartToolbox-highlight"
      />
      <Button
        icon={<Icon svg={zoomInIcon} />}
        title="Zoom in"
        onClick={chart.zoomIn}
        data-testid="chartToolbox-zoomIn"
      />
      <Button
        icon={<Icon svg={zoomOutIcon} />}
        title="Zoom out"
        onClick={chart.zoomOut}
        data-testid="chartToolbox-zoomOut"
      />
    </Container>
  )
})

const ToolboxContainer = ({ chart }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const hover = chart.on("hoverChart", () => setOpen(true))
    const blur = chart.on("blurChart", ({ relatedTarget }) => {
      if (relatedTarget !== ref.current) setOpen(false)
    })

    return () => {
      hover()
      blur()
    }
  }, [])

  return open ? <Toolbox chart={chart} ref={ref} /> : null
}

export default ToolboxContainer
