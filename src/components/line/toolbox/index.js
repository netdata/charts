import React, { forwardRef } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import panTool from "@netdata/netdata-ui/lib/components/icon/assets/pan_tool.svg"
import selectedArea from "@netdata/netdata-ui/lib/components/icon/assets/selected_area.svg"
import zoomInIcon from "@netdata/netdata-ui/lib/components/icon/assets/zoom_in.svg"
import zoomOutIcon from "@netdata/netdata-ui/lib/components/icon/assets/zoom_out.svg"
import Icon, { Button } from "@/components/icon"
import { useAttribute, useChart } from "@/components/provider"
import Select from "./select"

const Container = styled(Flex).attrs({
  padding: [1],
  gap: 2,
  background: "dropdown",
  round: true,
  border: { side: "all", color: "borderSecondary" },
})`
  position: absolute;
  top: 8px;
  right: 8px;
`

const Toolbox = forwardRef((props, ref) => {
  const chart = useChart()
  const [navigation, setNavigation] = useAttribute("navigation")

  return (
    <Container data-testid="chartToolbox" {...props} ref={ref} data-track="toolbox">
      <Button
        icon={<Icon svg={panTool} />}
        title="Pan"
        onClick={() => setNavigation("pan")}
        active={navigation === "pan"}
        data-testid="chartToolbox-pan"
        stroked
        data-track="pan"
      />
      <Button
        icon={<Icon svg={selectedArea} />}
        title="Highlight"
        onClick={() => setNavigation("highlight")}
        active={navigation === "highlight"}
        data-testid="chartToolbox-highlight"
        data-track="highlight"
      />
      <Select />
      <Button
        icon={<Icon svg={zoomInIcon} />}
        title="Zoom in"
        onClick={chart.zoomIn}
        data-testid="chartToolbox-zoomIn"
        data-track="zoomIn"
      />
      <Button
        icon={<Icon svg={zoomOutIcon} />}
        title="Zoom out"
        onClick={chart.zoomOut}
        data-testid="chartToolbox-zoomOut"
        data-track="zoomOut"
      />
    </Container>
  )
})

export default Toolbox
