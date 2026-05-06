import React, { memo } from "react"
import { Menu } from "@netdata/netdata-ui"
import downloadSVG from "@netdata/netdata-ui/dist/components/icon/assets/download.svg"
import Icon, { Button } from "@/components/icon"
import { useChart } from "@/components/provider"
import { useDownloadItems } from "./download/useDownload"

const Download = ({ disabled }) => {
  const chart = useChart()

  const items = useDownloadItems(chart)

  return (
    <Menu
      items={items}
      dropProps={{ align: { top: "bottom", right: "right" }, "data-toolbox": chart.getId() }}
      dropdownProps={{ width: "130px" }}
      data-track={chart.track("download-chart")}
    >
      <Button
        icon={<Icon svg={downloadSVG} size="14px" />}
        title="Download"
        disabled={disabled}
        data-testid="chartHeaderToolbox-download"
      />
    </Menu>
  )
}

export default memo(Download)
