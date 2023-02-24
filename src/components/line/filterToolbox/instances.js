import React, { useMemo } from "react"
import { useChart, useAttributeValue, useMetadata } from "@/components/provider"
import DropdownTable from "./dropdownTable"
import { ProgressBar, Text, TextSmall } from "@netdata/netdata-ui"

const tooltipProps = {
  heading: "Instances",
  body: "The instances contributing to the chart.",
}

const columns = [
  {
    id: "label",
    header: <TextSmall strong>Instances</TextSmall>,
    size: 160,
    minSize: 60,
    cell: ({ getValue }) => getValue(),
  },
  {
    id: "metrics",
    header: <TextSmall strong>Metrics</TextSmall>,
    size: 100,
    minSize: 30,
    cell: ({ row }) => {
      const { sl, ex } = row.original.instance.ds
      return (
        <>
          <TextSmall color="textLite">
            <TextSmall color={["green", "deyork"]}>{sl}</TextSmall> out of {sl + ex}
          </TextSmall>
          <ProgressBar
            background="borderSecondary"
            color={["green", "deyork"]}
            height={2}
            width={`${(sl / (sl + ex)) * 100}%`}
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
          <TextSmall color={["green", "deyork"]}>
            {Math.round((row.original.instance.sts.con + Number.EPSILON) * 100) / 100}%
          </TextSmall>
          <ProgressBar
            background="borderSecondary"
            color={["green", "deyork"]}
            height={2}
            width={`${row.original.instance.sts.con}%`}
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
        <Text>{Math.round((row.original.instance.sts.arp + Number.EPSILON) * 100) / 100}%</Text>
      )
    },
  },
  {
    id: "alerts",
    header: <TextSmall strong>Chart alerts</TextSmall>,
    size: 100,
    minSize: 30,
    cell: ({ row }) => {
      const { cl, cr, wr } = row.original.instance.al
      return `cr: ${cr}, wr: ${wr}, cl: ${cl}`
    },
  },
]

const Instances = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("selectedInstances")
  const { instances } = useMetadata()
  const options = useMemo(
    () =>
      instances.map(instance => ({
        label: instance.nm || instance.id,
        value: instance.id,
        "data-track": chart.track(`instances-${instance.id}`),
        metrics: instance.ds.sl + instance.ds.sl / (instance.ds.ex + instance.ds.sl),
        contribution: instance.sts.con,
        anomalyRate: instance.sts.arp,
        alerts: instance.al.cr * 3 + instance.al.wr * 2 + instance.al.cl,
        instance,
      })),
    [instances]
  )

  return (
    <DropdownTable
      allName="all instances"
      data-track={chart.track("instances")}
      labelProps={labelProps}
      onChange={chart.updateInstancesAttribute}
      options={options}
      tooltipProps={tooltipProps}
      value={value}
      columns={columns}
      {...rest}
    />
  )
}

export default Instances
