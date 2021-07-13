import React, { forwardRef } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import panTool from "@netdata/netdata-ui/lib/components/icon/assets/pan_tool.svg"
import selectedArea from "@netdata/netdata-ui/lib/components/icon/assets/selected_area.svg"
import selectIcon from "@netdata/netdata-ui/lib/components/icon/assets/select.svg"
import zoomInIcon from "@netdata/netdata-ui/lib/components/icon/assets/zoom_in.svg"
import zoomOutIcon from "@netdata/netdata-ui/lib/components/icon/assets/zoom_out.svg"
import Icon, { Button } from "@/components/icon"
import { useAttributeValue, useChart } from "@/components/provider"

const Container = styled(Flex).attrs({
  padding: [1, 3],
  gap: 3,
  background: "elementBackground",
  round: true,
})`
  position: absolute;
  top: 8px;
  right: 8px;
`

const Toolbox = forwardRef((props, ref) => {
  const chart = useChart()
  const navigation = useAttributeValue("navigation")

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
    <Container data-testid="chartToolbox" {...props} ref={ref}>
      <Button
        icon={<Icon svg={panTool} />}
        title="Pan"
        onClick={pan}
        active={navigation === "pan"}
        data-testid="chartToolbox-pan"
        stroked
      />
      <Button
        icon={<Icon svg={selectedArea} />}
        title="Highlight"
        onClick={highlight}
        active={navigation === "highlight"}
        data-testid="chartToolbox-highlight"
      />
      <Button
        icon={<Icon svg={selectIcon} />}
        title="Select and Zoom "
        onClick={select}
        active={navigation === "select"}
        data-testid="chartToolbox-select"
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

export default Toolbox
