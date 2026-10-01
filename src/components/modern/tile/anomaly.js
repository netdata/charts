import React from "react"
import styled from "styled-components"
import { Flex, getColor } from "@netdata/netdata-ui"
import { useAttributeValue, useDimensionIds, useLatestValue } from "@/components/provider"
import { ColorBar } from "@/components/line/dimensions/color"
import Tooltip from "@/components/tooltip"

const Track = styled(Flex).attrs({
  column: true,
  justifyContent: "end",
  position: "absolute",
  width: "8px",
  "data-testid": "modernTile-anomaly",
})`
  top: 12px;
  bottom: 12px;
  right: 2px;
  align-items: center;
`

const Rail = styled(Flex).attrs({ column: true, height: "100%", width: "2px", round: 0.5 })`
  justify-content: flex-end;
  background: ${({ $visible, theme }) =>
    $visible ? getColor("neutralHighlight")({ theme }) : "transparent"};
`

const AnomalyIndicator = ({ revealed }) => {
  const showAnomalies = useAttributeValue("showAnomalies")
  const firstDim = useDimensionIds()?.[0]
  const value = useLatestValue("selected", { valueKey: "arp" }) || 0

  if (!showAnomalies || firstDim !== "selected") return null
  if (!revealed && !(value > 0)) return null

  return (
    <Tooltip content="Anomaly rate for this metric" align="left">
      <Track data-value={value}>
        <Rail $visible={revealed}>
          <ColorBar id="selected" valueKey="arp" width="2px" styleDimension="height" round={0.5} />
        </Rail>
      </Track>
    </Tooltip>
  )
}

export default AnomalyIndicator
