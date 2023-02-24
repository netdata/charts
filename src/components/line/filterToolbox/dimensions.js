import React, { useMemo } from "react"
import { useChart, useAttributeValue, useMetadata } from "@/components/provider"
import DropdownTable from "./dropdownTable"
import { ProgressBar, Text, TextSmall } from "@netdata/netdata-ui"

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
    header: <TextSmall strong>Metrics</TextSmall>,
    size: 100,
    minSize: 30,
    cell: ({ row }) => {
      const { qr, sl, ex } = row.original.dimension.ds
      return (
        <>
          <TextSmall>
            <TextSmall color="primary">{qr}</TextSmall> out of {sl + ex}
          </TextSmall>
          <ProgressBar
            background="borderSecondary"
            color={["green", "deyork"]}
            height={2}
            width={`${(qr / (sl + ex)) * 100}%`}
            containerWidth="100%"
            border="none"
          />
        </>
      )
    },
  },
  {
    id: "contribution",
    header: <TextSmall strong>Contribution %</TextSmall>,
    size: 100,
    minSize: 30,
    cell: ({ row }) => {
      return (
        <>
          <TextSmall color="primary">
            {Math.round((row.original.dimension.sts.con + Number.EPSILON) * 100) / 100}%
          </TextSmall>
          <ProgressBar
            background="borderSecondary"
            color={["green", "deyork"]}
            height={2}
            width={`${row.original.dimension.sts.con}%`}
            containerWidth="100%"
            border="none"
          />
        </>
      )
    },
  },
  {
    id: "anomalyRate",
    header: <TextSmall strong>Anomaly %</TextSmall>,
    size: 100,
    minSize: 30,
    cell: ({ row }) => {
      return (
        <Text>{Math.round((row.original.dimension.sts.arp + Number.EPSILON) * 100) / 100}%</Text>
      )
    },
    meta: row => ({
      cellStyles: {
        ...(row.original.dimension.sts.arp > 0 && {
          backgroundColor: `rgba(222, 189, 255, ${row.original.dimension.sts.arp / 100})`,
        }),
      },
    }),
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
        metrics: dimension.ds.qr + dimension.ds.qr / (dimension.ds.ex + dimension.ds.sl),
        contribution: dimension.sts.con,
        anomalyRate: dimension.sts.arp,
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
