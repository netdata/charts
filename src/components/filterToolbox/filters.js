import React from "react"
import { Flex, TextSmall } from "@netdata/netdata-ui"
import { useIsHeatmap } from "@/helpers/heatmap"
import { useAttributeValue, useIsMinimal } from "@/components/provider"
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
import GroupBySVG from "@netdata/netdata-ui/dist/components/icon/assets/group_by.svg"
import gear from "@netdata/netdata-ui/dist/components/icon/assets/gear.svg"
import chevronRightEnd from "@netdata/netdata-ui/dist/components/icon/assets/chevron_right_end.svg"
import Icon from "@/components/icon"

const uppercasedAggrLabel = { secondaryLabel: "The" }
const emptyObject = {}

const plainLabelProps = {
  groupBy: { icon: <Icon svg={GroupBySVG} color="textLite" size="12px" />, padding: [0] },
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
  const isMinimal = useIsMinimal()

  if (filterElements)
    return filterElements.map((Element, index) => (
      <Element key={index} showPostAggregations={showPostAggregations} />
    ))

  if (plain)
    return (
      <>
        <GroupBy labelProps={plainLabelProps.groupBy} />
        <Aggregate labelProps={isHeatmap ? emptyObject : emptyObject} defaultMinimal />
        <Nodes labelProps={plainLabelProps.nodes} />
        <Instances labelProps={plainLabelProps.instances} />
        <Dimensions labelProps={plainLabelProps.dimensions} />
        <Labels labelProps={plainLabelProps.labels} />
      </>
    )

  if (showPostAggregations) {
    return (
      <>
        <Flex padding={isMinimal ? [2, 0.5] : [0.5]} flexWrap gap={2}>
          <Flex alignItems="center">
            <ShowPostAggregations labelProps={plainLabelProps.showPostAggregations} />
            {!isHeatmap && <ContextScope />}
            {!isHeatmap && (
              <PostGroupBy
                labelProps={isMinimal ? plainLabelProps.groupBy : { secondaryLabel: "Group by" }}
              />
            )}
            <PostAggregate
              labelProps={{
                ...(isHeatmap ? (isMinimal ? emptyObject : uppercasedAggrLabel) : emptyObject),
              }}
            />
            {!isMinimal ? (
              <TextSmall color="textLite" whiteSpace="nowrap">
                of the:{" "}
              </TextSmall>
            ) : (
              <TextSmall color="textNoFocus">&lt;</TextSmall>
            )}
          </Flex>
          <Flex
            round
            border={{ side: "all", size: "2px", type: "dashed", color: "border" }}
            alignItems="center"
          >
            {!isHeatmap && (
              <GroupBy
                labelProps={isMinimal ? plainLabelProps.groupBy : { secondaryLabel: "Group by" }}
              />
            )}
            <Aggregate
              labelProps={isHeatmap ? (isMinimal ? emptyObject : uppercasedAggrLabel) : emptyObject}
            />
            <Nodes labelProps={isMinimal ? plainLabelProps.nodes : emptyObject} />
            <Instances labelProps={isMinimal ? plainLabelProps.instances : emptyObject} />
            <Dimensions labelProps={isMinimal ? plainLabelProps.dimensions : emptyObject} />
            <Labels labelProps={isMinimal ? plainLabelProps.labels : emptyObject} />
          </Flex>
          {!isMinimal && <TimeAggregation />}
        </Flex>
        <Reset />
      </>
    )
  }

  return (
    <>
      <Flex flexWrap padding={isMinimal ? [2, 0.5] : [0.5]}>
        <ShowPostAggregations labelProps={plainLabelProps.showPostAggregations} />
        {!isHeatmap && <ContextScope />}
        {!isHeatmap && (
          <GroupBy
            labelProps={isMinimal ? plainLabelProps.groupBy : { secondaryLabel: "Group by" }}
          />
        )}
        <Aggregate
          labelProps={isHeatmap ? (isMinimal ? emptyObject : uppercasedAggrLabel) : emptyObject}
        />
        <Nodes labelProps={isMinimal ? plainLabelProps.nodes : emptyObject} />
        <Instances labelProps={isMinimal ? plainLabelProps.instances : emptyObject} />
        <Dimensions labelProps={isMinimal ? plainLabelProps.dimensions : emptyObject} />
        <Labels labelProps={isMinimal ? plainLabelProps.labels : emptyObject} />
        {!isMinimal && <TimeAggregation />}
      </Flex>
      <Reset />
    </>
  )
}

export default FilterToolbox
