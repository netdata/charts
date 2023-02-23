import React, { useMemo } from "react"
import { useChart, useAttributeValue, useMetadata } from "@/components/provider"
import DropdownTable from "./dropdownTable"

const tooltipProps = {
  heading: "Dimensions",
  body: "Select one, multiple or all dimensions. A dimension is any value, either raw data or the result of a calculation that Netdata visualizes on a chart.",
}

const columns = [
  {
    id: "label",
    header: "Name",
    size: 100,
    minSize: 60,
    cell: ({ getValue }) => getValue(),
  },
  {
    id: "metrics",
    header: "Metrics",
    size: 100,
    minSize: 30,
    cell: ({ row }) => {
      const { sl, ex } = row.original.dimension.ds
      return `${sl} out of ${sl + ex}`
    },
  },
  {
    id: "contribution",
    header: "Contribution",
    size: 100,
    minSize: 30,
    cell: ({ row }) => {
      return `${row.original.dimension.sts.con}%`
    },
  },
  {
    id: "anomalyRate",
    header: "Anomaly %",
    size: 100,
    minSize: 30,
    cell: ({ row }) => {
      return `${row.original.dimension.sts.arp}%`
    },
  },
]

const Dimensions = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("selectedDimensions")
  const { dimensions } = useMetadata()
  const options = useMemo(
    () =>
      dimensions.map(dimension => ({
        label: dimension.nm || dimension.id,
        value: dimension.id,
        "data-track": chart.track(`dimensions-${dimension.id}`),
        dimension,
      })),
    [dimensions]
  )

  return (
    <DropdownTable
      allName="all dimensions"
      data-track={chart.track("dimensions")}
      labelProps={labelProps}
      onChange={chart.updateDimensionsAttribute}
      options={options}
      tooltipProps={tooltipProps}
      value={value}
      columns={columns}
      {...rest}
    />
  )
}

export default Dimensions
