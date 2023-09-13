import React from "react"
import { useIsHeatmap } from "@/helpers/heatmap"
import { useAttributeValue } from "@/components/provider"
import Aggregate from "./aggregate"
import Dimensions from "./dimensions"
import Instances from "./instances"
import Nodes from "./nodes"
import ContextScope from "./contextScope"
import GroupBy from "./groupBy"
import TimeAggregation from "./timeAggregation"
import Labels from "./labels"
import Reset from "./reset"

import N from "@netdata/netdata-ui/lib/components/icon/assets/N.svg"
import I from "@netdata/netdata-ui/lib/components/icon/assets/I.svg"
import D from "@netdata/netdata-ui/lib/components/icon/assets/D.svg"
import L from "@netdata/netdata-ui/lib/components/icon/assets/L.svg"
import Icon from "@/components/icon"

const uppercasedAggrLabel = { secondaryLabel: "The" }
const emptyObject = {}

const plainLabelProps = {
  nodes: { icon: <Icon svg={N} color="textLite" size="16px" />, padding: [0] },
  instances: { icon: <Icon svg={I} color="textLite" size="16px" />, padding: [0] },
  dimensions: { icon: <Icon svg={D} color="textLite" size="16px" />, padding: [0] },
  labels: { icon: <Icon svg={L} color="textLite" size="16px" />, padding: [0] },
}

const FilterToolbox = ({ plain }) => {
  const isHeatmap = useIsHeatmap()

  const filterElements = useAttributeValue("filterElements")

  if (filterElements) return filterElements.map((Element, index) => <Element key={index} />)

  if (plain)
    return (
      <>
        <Nodes labelProps={plainLabelProps.nodes} />
        <Instances labelProps={plainLabelProps.instances} />
        <Dimensions labelProps={plainLabelProps.dimensions} />
        <Labels labelProps={plainLabelProps.labels} />
      </>
    )

  return (
    <>
      {!isHeatmap && <ContextScope />}
      {!isHeatmap && <GroupBy labelProps={{ secondaryLabel: "Group by" }} />}
      <Aggregate labelProps={isHeatmap ? uppercasedAggrLabel : emptyObject} />
      <Nodes />
      <Instances />
      <Dimensions />
      <Labels />
      <TimeAggregation />
      <Reset />
    </>
  )
}

export default FilterToolbox
