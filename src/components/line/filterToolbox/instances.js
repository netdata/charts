import React, { memo, useMemo } from "react"
import { Flex, ProgressBar, Text, TextSmall } from "@netdata/netdata-ui"
import { useChart, useAttribute, useAttributeValue, useMetadata } from "@/components/provider"
import Color from "@/components/line/dimensions/color"
import DropdownTable from "./dropdownTable"

const tooltipProps = {
  heading: "Instances",
  body: "The instances contributing to the chart.",
}

const columns = [
  {
    id: "label",
    header: <TextSmall strong>Name</TextSmall>,
    size: 160,
    minSize: 60,
    cell: ({ row, getValue }) => (
      <Flex gap={1}>
        <Color id={row.original.value} />
        <TextSmall>{getValue()}</TextSmall>
      </Flex>
    ),
  },
  {
    id: "metrics",
    header: <TextSmall strong>Metrics</TextSmall>,
    size: 100,
    minSize: 30,
    cell: ({ row, getValue }) => {
      if (!row.original.info?.ds) return <TextSmall color="textLite">{getValue()}</TextSmall>

      const { qr = 0, sl = 0, ex = 0 } = row.original.info.ds
      return (
        <>
          <TextSmall color="textLite">
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
      return <TextSmall>{Math.round((getValue() + Number.EPSILON) * 100) / 100}%</TextSmall>
    },
    meta: row => ({
      cellStyles: {
        ...(row.original?.info?.sts?.arp > 0 && {
          backgroundColor: `rgba(222, 189, 255, ${row.original.info.sts.arp / 100})`,
        }),
      },
    }),
  },
  {
    id: "alerts",
    header: <TextSmall strong>Chart alerts</TextSmall>,
    size: 100,
    minSize: 30,
    cell: ({ row, getValue }) => {
      if (!row.original.info?.al) return <TextSmall color="textLite">{getValue()}</TextSmall>

      const { cl = 0, cr = 0, wr = 0 } = row.original.info.al
      return `cr: ${cr}, wr: ${wr}, cl: ${cl}`
    },
  },
]

const Instances = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("selectedInstances")
  const { nodes, instances } = useMetadata()

  let label = `${instances.length} instances`

  const options = useMemo(
    () =>
      instances.map(instance => {
        const id = `${instance.id}@${nodeId}`
        const selected = value.includes(id)

        if (selected && value.length === 1) label = instance.nm || instance.id

        const { nm: nodeName, mg: nodeId } = nodes[instance.ni]

        return {
          label: `${instance.nm || instance.id}@${nodeName}`,
          value: id,
          "data-track": chart.track(`instances-${instance.id}`),
          metrics: instance.ds ? instance.ds.qr + instance.ds.qr / (instance.ds.ex + instance.ds.sl) : "-",
          contribution: instance.sts?.con || 0,
          anomalyRate: instance.sts?.arp || 0,
          alerts: instance.al ? instance.al.cr * 3 + instance.al.wr * 2 + instance.al.cl : "-",
          info: instance,
          selected,
        }
      }),
    [instances, value]
  )

  const [sortBy, onSortByChange] = useAttribute("instancesSortBy")
  debugger
  if (value.length > 1) label = `${value.length} instances`

  return (
    <DropdownTable
      label={label}
      data-track={chart.track("instances")}
      labelProps={labelProps}
      onChange={chart.updateInstancesAttribute}
      options={options}
      tooltipProps={tooltipProps}
      value={value}
      columns={columns}
      sortBy={sortBy}
      onSortByChange={onSortByChange}
      {...rest}
    />
  )
}

export default memo(Instances)
