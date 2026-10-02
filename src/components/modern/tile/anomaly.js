import React from "react"
import styled from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue, useDimensionIds, useLatestValue } from "@/components/provider"
import { ColorBar } from "@/components/line/dimensions/color"
import Tooltip from "@/components/tooltip"

const Track = styled(Flex).attrs({
  column: true,
  justifyContent: "end",
  alignItems: "center",
  position: "absolute",
  width: "8px",
  "data-testid": "modernTile-anomaly",
})`
  top: 12px;
  bottom: 12px;
  right: 2px;
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
        <Flex
          column
          justifyContent="end"
          height="100%"
          width="2px"
          round={0.5}
          background={revealed ? "neutralHighlight" : undefined}
        >
          <ColorBar id="selected" valueKey="arp" width="2px" styleDimension="height" round={0.5} />
        </Flex>
      </Track>
    </Tooltip>
  )
}

export default AnomalyIndicator
