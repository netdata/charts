import React from "react"
import styled from "styled-components"
import { Flex, TextSmall, getColor } from "@netdata/netdata-ui"
import downloadSVG from "@netdata/netdata-ui/dist/components/icon/assets/download.svg"
import Icon from "@/components/icon"
import { useDownloadItems } from "@/components/toolbox/download/useDownload"

const subtitles = {
  "Download as CSV": "Values converted to display units",
  "Download raw data": "Raw values straight from the database",
  "Download as PDF": "Rendered chart image, A4 page",
  "Download as PNG": "Rendered chart image, transparent-friendly",
}

const RowButton = styled(Flex).attrs({ as: "button", role: "button" })`
  appearance: none;
  background: transparent;
  border: 0;
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  color: inherit;
  font: inherit;
  transition: background 120ms ease;

  &:hover,
  &:focus-visible {
    background: ${getColor("selected")};
    outline: none;
  }
`

const Row = ({ label, onClick, "data-track": dataTrack }) => (
  <RowButton
    alignItems="center"
    gap={3}
    padding={[2, 3]}
    onClick={onClick}
    data-track={dataTrack}
    data-testid={`chartSettings-download-${label.replace(/\s+/g, "-").toLowerCase()}`}
  >
    <Icon svg={downloadSVG} size="16px" color="textLite" />
    <Flex column gap={0.5} flex>
      <TextSmall strong>{label}</TextSmall>
      <TextSmall color="textNoFocus">{subtitles[label]}</TextSmall>
    </Flex>
  </RowButton>
)

const DownloadBody = ({ chart }) => {
  const items = useDownloadItems(chart)

  return (
    <Flex column padding={[2]} gap={1} width={{ min: "260px" }}>
      {items.map(item => (
        <Row
          key={item.label}
          label={item.label}
          onClick={item.onClick}
          data-track={item["data-track"]}
        />
      ))}
    </Flex>
  )
}

export default { id: "download", label: "Download", Component: DownloadBody }
