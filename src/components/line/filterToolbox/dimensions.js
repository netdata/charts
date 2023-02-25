import React, { memo, useMemo } from "react"
import { Flex, ProgressBar, Text, TextSmall } from "@netdata/netdata-ui"
import { useChart, useAttributeValue, useMetadata } from "@/components/provider"
import Color from "@/components/line/dimensions/color"
import DropdownTable from "./dropdownTable"

const tooltipProps = {
  heading: "Dimensions",
  body: "Select one, multiple or all dimensions. A dimension is any value, either raw data or the result of a calculation that Netdata visualizes on a chart.",
}

const columns = [
  {
    id: "label",
    header: <TextSmall strong>Name</TextSmall>,
    size: 100,
    minSize: 60,
    cell: ({ getValue }) => (
      <Flex gap={1}>
        <Color id={getValue()} />
        <TextSmall>{getValue()}</TextSmall>
      </Flex>
    ),
  },
  {
    id: "metrics",
    header: <TextSmall strong>Metrics</TextSmall>,
    size: 100,
    minSize: 30,
    cell: ({ row }) => {
      const { qr = 0, sl = 0, ex = 0 } = row.original.info.ds
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
    cell: ({ getValue }) => {
      return (
        <>
          <TextSmall color="primary">
            {Math.round((getValue() + Number.EPSILON) * 100) / 100}%
          </TextSmall>
          <ProgressBar
            background="borderSecondary"
            color={["green", "deyork"]}
            height={2}
            width={`${getValue()}%`}
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
    cell: ({ getValue }) => {
      return <Text>{Math.round((getValue() + Number.EPSILON) * 100) / 100}%</Text>
    },
    meta: row => ({
      cellStyles: {
        ...(row.original.info.sts.arp > 0 && {
          backgroundColor: `rgba(222, 189, 255, ${row.original.info.sts.arp / 100})`,
        }),
      },
    }),
  },
]

const Dimensions = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("selectedDimensions")
  const { dimensions } = useMetadata()

  let label = "all dimensions"

  const options = useMemo(
    () =>
      dimensions.map(dimension => {
        const selected = value.includes(dimension.id)

        if (selected && value.length === 1) label = dimension.nm || dimension.id

        return {
          label: dimension.nm || dimension.id,
          value: dimension.id,
          "data-track": chart.track(`dimensions-${dimension.id}`),
          metrics: dimension.ds.qr + dimension.ds.qr / (dimension.ds.ex + dimension.ds.sl),
          contribution: dimension.sts?.con || 0,
          anomalyRate: dimension.sts?.arp || 0,
          info: dimension,
          selected,
        }
      }),
    [dimensions, value]
  )

  if (value.length > 1) label = `${value.length} dimensions`

  return (
    <DropdownTable
      label={label}
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

export default memo(Dimensions)
