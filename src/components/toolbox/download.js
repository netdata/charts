import React, { memo, useMemo } from "react"
import { Menu } from "@netdata/netdata-ui"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import downloadSVG from "@netdata/netdata-ui/dist/components/icon/assets/download.svg"
import Icon, { Button } from "@/components/icon"
import { useChart } from "@/components/provider"

const formatValue = value => {
  if (value === null || value === undefined) return "-"
  if (typeof value === "object") return JSON.stringify(value)
  return value
}

const convertToCSV = data => data.reduce((h, row) => h + row.map(formatValue).join(",") + "\n", "")

const labelTexts = {
  time: "timestamp",
  ANOMALY_RATE: "anomaly%",
  ANNOTATIONS: "annotations",
}

const hideUnits = {
  time: true,
  ANOMALY_RATE: true,
  ANNOTATIONS: true,
}

const useDownloadCsv =
  (chart, type = "raw") =>
  () => {
    const shouldConvert = type === "converted"
    const { data, labels } = chart.getPayload()

    let tableData = [
      labels.map(l =>
        hideUnits[l]
          ? labelTexts[l] || l
          : `${labelTexts[l] || l} (${chart.getUnitSign({ key: "units", dimensionId: l, withoutConversion: !shouldConvert })})`
      ),
    ]
    data.forEach(row => {
      tableData.push(
        labels.map((l, index) =>
          shouldConvert
            ? index === 0
              ? chart.formatTime(row[index])
              : chart.getConvertedValue(row[index], { dimensionId: l })
            : row[index]
        )
      )
    })

    const url = window.URL.createObjectURL(
      new Blob([convertToCSV(tableData)], { type: "text/csv;charset=utf-8;" })
    )
    const link = document.createElement("a")
    link.href = url
    const filename = `${chart.getAttribute("name") || chart.getAttribute("contextScope").join("-").replace(".", "_")}-${type}.csv`
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

const useDownloadImage =
  (chart, { uiName, type = "pdf" } = {}) =>
  async () => {
    let element = chart.getUI(uiName).getElement()
    if (element.closest("[data-type='chart']")) {
      element = element.closest("[data-type='chart']")
    }

    if (!element) return

    // Check if target element has size
    const rect = element.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    // Optional: log any images that might cause CORS problems
    document.querySelectorAll("img").forEach(img => {
      const src = img.currentSrc || img.src
      try {
        const url = new URL(src)
        if (url.origin !== window.location.origin) return
      } catch {
        return
      }
    })

    const filename = `${chart.getAttribute("name") || chart.getAttribute("contextScope").join("-").replace(".", "_")}`

    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        foreignObjectRendering: true,
        width: element.scrollWidth,
        height: element.scrollHeight,
        scale: 2,
        backgroundColor: chart.getThemeAttribute("themeBackground"),
        ignoreElements: el => el.hasAttribute("data-noprint"),
      })

      const imgData = canvas.toDataURL("image/png")

      if (type === "png") {
        const blob = await (await fetch(imgData)).blob()
        const blobUrl = URL.createObjectURL(blob)

        const link = document.createElement("a")
        link.href = blobUrl
        link.download = `${filename || "print"}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        URL.revokeObjectURL(blobUrl)
      } else {
        const isLandscape = element.scrollWidth > element.scrollHeight

        const pdf = new jsPDF({
          orientation: isLandscape ? "landscape" : "portrait",
          unit: "mm",
          format: "a4",
        })

        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()

        const imgWidth = canvas.width
        const imgHeight = canvas.height

        const pxToMm = px => px * 0.2645833333
        const imgWidthMm = pxToMm(imgWidth)
        const imgHeightMm = pxToMm(imgHeight)

        const scale = Math.min(pageWidth / imgWidthMm, pageHeight / imgHeightMm)
        const displayWidth = imgWidthMm * scale
        const displayHeight = imgHeightMm * scale

        pdf.addImage(imgData, "PNG", 0, 0, displayWidth, displayHeight)
        pdf.save(`${filename || "print"}.pdf`)
      }
    } catch {
      return
    }
  }

const useItems = chart => {
  const downloadRawCsv = useDownloadCsv(chart)
  const downloadCsv = useDownloadCsv(chart, "converted")
  const downloadPdf = useDownloadImage(chart)
  const downloadPng = useDownloadImage(chart, { type: "png" })

  return useMemo(
    () => [
      {
        onClick: downloadCsv,
        label: "Download as CSV",
        "data-track": chart.track("download-csv"),
      },
      {
        onClick: downloadRawCsv,
        label: "Download raw data",
        "data-track": chart.track("download-raw-csv"),
      },
      {
        onClick: downloadPdf,
        label: "Download as PDF",
        "data-track": chart.track("download-pdf"),
      },
      {
        onClick: downloadPng,
        label: "Download as PNG",
        "data-track": chart.track("download-png"),
      },
    ],
    [chart, chart.getHeatmapType()]
  )
}

const Download = ({ disabled }) => {
  const chart = useChart()

  const items = useItems(chart)

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
