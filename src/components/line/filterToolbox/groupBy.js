import React, { useMemo, memo } from "react"
import { Flex, ProgressBar, Text, TextSmall, AlertMasterCard } from "@netdata/netdata-ui"
import { useChart, useAttributeValue } from "@/components/provider"
import DropdownTable from "./dropdownTable"
import Color from "@/components/line/dimensions/color"
import Label from "./label"

const defaultItems = [
  { label: "dimension", value: "dimension", key: "dimensions" },
  { label: "node", value: "node", key: "nodes" },
  { label: "instance", value: "instance", key: "instances" },
]

const metricsByValue = {
  dimension: "dimensions",
  node: "nodes",
  instance: "instances",
  label: "labels",
}

const tooltipProps = {
  heading: "Grouping by",
  body: (
    <div>
      Select the grouping by:
      <ul>
        <li>Nodes to drill down and see metrics across nodes</li>
        <li>Dimension to have an overview of your War Room</li> Chart to drill down to the
        individual charts.
        <li>
          If a node has more than one software or hardware instance these form different charts
        </li>
      </ul>
    </div>
  ),
}

const columns = [
  {
    id: "label",
    header: () => <TextSmall strong>Name</TextSmall>,
    size: 180,
    minSize: 60,
    cell: ({ getValue, row }) => (
      <Flex justifyContent="between" alignItems="center" padding={[0, 0, 0, row.depth * 3]}>
        <Flex gap={1}>
          <Color id={row.original.value} />
          <TextSmall
            strong={row.getCanExpand()}
            onClick={!row.original.disabled ? row.getToggleSelectedHandler() : undefined}
            cursor={row.original.disabled ? "default" : "pointer"}
          >
            {getValue()}
          </TextSmall>
        </Flex>
        {row.getCanExpand() && (
          <Label
            label={metricsByValue[row.original.value] || metricsByValue.label}
            onClick={row.getToggleExpandedHandler()}
            iconRotate={row.getIsExpanded() ? 2 : null}
            textProps={{ fontSize: "10px", color: "textLite" }}
          />
        )}
      </Flex>
    ),
  },
  {
    id: "instances",
    header: <TextSmall strong>Instances</TextSmall>,
    size: 100,
    minSize: 30,
    cell: ({ row, getValue }) => {
      if (!row.original.info?.is) return <TextSmall color="textLite">{getValue()}</TextSmall>

      const { qr = 0, sl = 0, ex = 0 } = row.original.info.is
      return (
        <>
          <TextSmall color="textLite">
            <TextSmall color={["green", "deyork"]}>{qr}</TextSmall> out of {sl + ex}
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
            <TextSmall color={["green", "deyork"]}>{qr}</TextSmall> out of {sl + ex}
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
    cell: ({ row, getValue }) => {
      if (!row.original.info?.sts) return <TextSmall color="textLite">{getValue()}</TextSmall>

      return (
        <>
          <TextSmall color={["green", "deyork"]}>
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
      cellStyles: {},
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
      const pillLeft = {
        type: "critical",
      }
      const pillRight = {
        type: "critical",
      }
      return (
        <>
          <Text>
            cr: {cr}, wr: {wr}, cl: {cl}
          </Text>
        </>
      )
    },
  },
]

const sortBy = []

const GroupBy = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const groupBy = useAttributeValue("groupBy")
  const groupByLabel = useAttributeValue("groupByLabel")

  let label = "everything"

  const options = useMemo(() => {
    const metadata = chart.getMetadata()

    const defaultOptions = defaultItems.map(item => ({
      ...item,
      "data-track": chart.track(`group-by-${item.value}`),
      instances: metadata.instances.length,
      metrics: metadata.dimensions.length,
      contribution: "-",
      anomalyRate: "-",
      alerts: "-",
      selected: groupBy.includes(item.value),
      children: metadata[item.key].map(dim => ({
        label: dim.nm || dim.id,
        value: dim.id,
        instances: dim.is ? dim.is.qr + dim.is.qr / (dim.is.ex + dim.is.sl) : "-",
        metrics: dim.ds ? dim.ds.qr + dim.ds.qr / (dim.ds.ex + dim.ds.sl) : "-",
        contribution: dim.sts?.con || 0,
        anomalyRate: dim.sts?.arp || 0,
        alerts: dim.al ? dim.al.cr * 3 + dim.al.wr * 2 + dim.al.cl : "-",
        info: dim,
        disabled: "hidden",
      })),
    }))

    return [
      ...defaultOptions,
      ...metadata.labels.map(item => ({
        label: item.id,
        value: item.id,
        "data-track": chart.track(`group-by-label-${item.id}`),
        instances: item.is ? item.is.qr + item.is.qr / (item.is.ex + item.is.sl) : "-",
        metrics: item.ds ? item.ds.qr + item.ds.qr / (item.ds.ex + item.ds.sl) : "-",
        contribution: item.sts?.con || 0,
        anomalyRate: item.sts?.arp || 0,
        alerts: item.al ? item.al.cr * 3 + item.al.wr * 2 + item.al.cl : "-",
        info: item,
        isLabel: true,
        selected: groupByLabel.includes(item.id),
        children: item.vl.map(dim => ({
          label: dim.nm || dim.id,
          value: dim.id,
          instances: dim.is ? dim.is.qr + dim.is.qr / (dim.is.ex + dim.is.sl) : "-",
          metrics: dim.ds ? dim.ds.qr + dim.ds.qr / (dim.ds.ex + dim.ds.sl) : "-",
          contribution: dim.sts?.con || 0,
          anomalyRate: dim.sts?.arp || 0,
          alerts: dim.al ? dim.al.cr * 3 + dim.al.wr * 2 + dim.al.cl : "-",
          info: dim,
          disabled: "hidden",
        })),
      })),
    ]
  }, [groupBy, groupByLabel])

  label = useMemo(() => {
    const withoutNodes = groupBy.filter(v => v !== "node")

    const groups = withoutNodes.map(v => {
      if (v === "label")
        return groupByLabel.length > 1 ? `${groupByLabel.length} labels` : groupByLabel[0]

      return v
    })
    if (withoutNodes.length < groupBy.length) groups.push("node")

    return groups.join(", ")
  }, [groupBy, groupByLabel])

  const value = useMemo(() => [...groupBy, ...groupByLabel], [groupBy, groupByLabel])

  return (
    <DropdownTable
      label={label}
      data-track={chart.track("group-by")}
      labelProps={labelProps}
      onChange={value => chart.updateGroupByAttribute(value)}
      options={options}
      secondaryLabel="Group by"
      tooltipProps={tooltipProps}
      value={value}
      columns={columns}
      enableSubRowSelection={false}
      sortBy={sortBy}
      {...rest}
    />
  )
}

export default memo(GroupBy)
