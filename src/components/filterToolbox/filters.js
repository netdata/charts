import React from "react"
import { Flex, TextSmall } from "@netdata/netdata-ui"
import { useIsHeatmap } from "@/helpers/heatmap"
import { useAttributeValue } from "@/components/provider"
import Aggregate from "./aggregate"
import PostAggregate from "./postAggregate"
import Dimensions from "./dimensions"
import Instances from "./instances"
import Nodes from "./nodes"
import ContextScope from "./contextScope"
import GroupBy from "./groupBy"
import PostGroupBy from "./postGroupBy"
import TimeAggregation from "./timeAggregation"
import Labels from "./labels"
import Reset from "./reset"
import ShowPostAggregations from "./showPostAggregations"
// import Config from "./config" // TODO use it for dropdown form
import N from "@netdata/netdata-ui/dist/components/icon/assets/N.svg"
import I from "@netdata/netdata-ui/dist/components/icon/assets/I.svg"
import D from "@netdata/netdata-ui/dist/components/icon/assets/D.svg"
import L from "@netdata/netdata-ui/dist/components/icon/assets/L.svg"
import gear from "@netdata/netdata-ui/dist/components/icon/assets/gear.svg"
import chevronRightEnd from "@netdata/netdata-ui/dist/components/icon/assets/chevron_right_end.svg"
import Icon from "@/components/icon"

const uppercasedAggrLabel = { secondaryLabel: "The" }
const emptyObject = {}

const plainLabelProps = {
  nodes: { icon: <Icon svg={N} color="textLite" size="16px" />, padding: [0] },
  instances: { icon: <Icon svg={I} color="textLite" size="16px" />, padding: [0] },
  dimensions: { icon: <Icon svg={D} color="textLite" size="16px" />, padding: [0] },
  labels: { icon: <Icon svg={L} color="textLite" size="16px" />, padding: [0] },
  config: { icon: <Icon svg={gear} color="textLite" size="12px" />, padding: [0.5] },
  showPostAggregations: {
    icon: <Icon svg={chevronRightEnd} color="textLite" size="10px" />,
    padding: [0],
  },
}

const FilterToolbox = ({ plain }) => {
  const isHeatmap = useIsHeatmap()

  const filterElements = useAttributeValue("filterElements")
  const showPostAggregations = useAttributeValue("showPostAggregations")

  if (filterElements)
    return filterElements.map((Element, index) => (
      <Element key={index} showPostAggregations={showPostAggregations} />
    ))

  if (plain)
    return (
      <>
        {/*<Config labelProps={plainLabelProps.config} />*/}
        <Nodes labelProps={plainLabelProps.nodes} />
        <Instances labelProps={plainLabelProps.instances} />
        <Dimensions labelProps={plainLabelProps.dimensions} />
        <Labels labelProps={plainLabelProps.labels} />
      </>
    )

  if (showPostAggregations) {
    return (
      <>
        <Flex padding={[0.5]} flexWrap gap={2}>
          <Flex alignItems="center">
            <ShowPostAggregations labelProps={plainLabelProps.showPostAggregations} />
            {!isHeatmap && <ContextScope />}
            {!isHeatmap && <PostGroupBy labelProps={{ secondaryLabel: "Group by" }} />}
            <PostAggregate
              labelProps={{
                ...(isHeatmap ? uppercasedAggrLabel : emptyObject),
              }}
            />
            <TextSmall color="textLite" whiteSpace="nowrap">
              of the:{" "}
            </TextSmall>
          </Flex>
          <Flex
            round
            border={{ side: "all", size: "2px", type: "dashed", color: "border" }}
            alignItems="center"
          >
            {!isHeatmap && <GroupBy labelProps={{ secondaryLabel: "Group by" }} />}
            <Aggregate labelProps={isHeatmap ? uppercasedAggrLabel : emptyObject} />
            <Nodes />
            <Instances />
            <Dimensions />
            <Labels />
          </Flex>
          <TimeAggregation />
        </Flex>
        <Reset />
      </>
    )
  }

  return (
    <>
      <Flex flexWrap>
        <ShowPostAggregations labelProps={plainLabelProps.showPostAggregations} />
        {!isHeatmap && <ContextScope />}
        {!isHeatmap && <GroupBy labelProps={{ secondaryLabel: "Group by" }} />}
        <Aggregate labelProps={isHeatmap ? uppercasedAggrLabel : emptyObject} />
        <Nodes />
        <Instances />
        <Dimensions />
        <Labels />
        <TimeAggregation />
      </Flex>
      <Reset />
    </>
  )
}

export default FilterToolbox
