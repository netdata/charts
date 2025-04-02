import React from "react"
import styled from "styled-components"
import { Flex, getColor, getRgbColor } from "@netdata/netdata-ui"
import panTool from "@netdata/netdata-ui/dist/components/icon/assets/pan_tool.svg"
import selectedArea from "@netdata/netdata-ui/dist/components/icon/assets/selected_area.svg"
import zoomInIcon from "@netdata/netdata-ui/dist/components/icon/assets/zoom_in.svg"
import zoomOutIcon from "@netdata/netdata-ui/dist/components/icon/assets/zoom_out.svg"
import zoomResetIcon from "@netdata/netdata-ui/dist/components/icon/assets/zoom_reset.svg"
import Icon, { Button } from "@/components/icon"
import { useAttribute, useAttributeValue, useChart } from "@/components/provider"
import Select from "./select"
import makeLog from "@/sdk/makeLog"

const Container = styled(Flex).attrs({
  padding: [0.5],
  gap: 1,
  round: true,
  border: { side: "all", color: "borderSecondary" },
})`
  position: absolute;
  top: 18px;
  right: 8px;
  background: ${getRgbColor("elementBackground", 0.5)};

  &:hover {
    background: ${getColor("elementBackground")};
  }
`

const ZoomReset = ({ log = () => {} }) => {
  const chart = useChart()
  const after = useAttributeValue("after")

  if (!chart.getAttribute("enabledResetRange")) return null

  const onResetZoom = () => {
    chart.resetNavigation()
    log({
      chartAction: "chart-toolbox-reset-zoom",
    })
  }

  return (
    <Button
      icon={<Icon svg={zoomResetIcon} size="16px" />}
      title="Reset zoom"
      onClick={onResetZoom}
      data-testid="chartToolbox-zoomReset"
      data-track={chart.track("zoomReset")}
      disabled={after === -900}
      padding="2px"
      small
    />
  )
}

const NavigationToolbox = props => {
  const chart = useChart()
  const [navigation, setNavigation] = useAttribute("navigation")

  const highlighting = useAttributeValue("highlighting")
  const panning = useAttributeValue("panning")
  if (highlighting || panning) return null

  const log = makeLog(chart)

  const onPan = () => {
    setNavigation("pan")
    log({
      chartAction: "chart-toolbox-pan",
    })
  }

  const onHighlight = () => {
    setNavigation("highlight")
    log({
      chartAction: "chart-toolbox-highlight",
    })
  }

  const onZoomIn = () => {
    chart.zoomIn()
    log({
      chartAction: "chart-toolbox-zoom-in",
    })
  }

  const onZoomOut = () => {
    chart.zoomOut()
    log({
      chartAction: "chart-toolbox-zoom-out",
    })
  }

  return (
    <Container
      data-testid="chartToolbox"
      data-toolbox={chart.getId()}
      {...props}
      data-track={chart.track("toolbox")}
    >
      <Button
        icon={<Icon svg={panTool} size="16px" />}
        title="Pan"
        onClick={onPan}
        active={navigation === "pan"}
        data-testid="chartToolbox-pan"
        stroked
        data-track={chart.track("pan")}
        padding="2px"
        small
      />
      <Button
        icon={<Icon svg={selectedArea} size="16px" />}
        title="Highlight"
        onClick={onHighlight}
        active={navigation === "highlight"}
        data-testid="chartToolbox-highlight"
        data-track={chart.track("highlight")}
        padding="2px"
        small
      />
      <Select />
      <Button
        icon={<Icon svg={zoomInIcon} size="16px" />}
        title="Zoom in"
        onClick={onZoomIn}
        data-testid="chartToolbox-zoomIn"
        data-track={chart.track("zoomIn")}
        padding="2px"
        small
      />
      <Button
        icon={<Icon svg={zoomOutIcon} size="16px" />}
        title="Zoom out"
        onClick={onZoomOut}
        data-testid="chartToolbox-zoomOut"
        data-track={chart.track("zoomOut")}
        padding="2px"
        small
      />
      <ZoomReset log={log} />
    </Container>
  )
}

export default NavigationToolbox
