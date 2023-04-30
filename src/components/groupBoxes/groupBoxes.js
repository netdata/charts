import React, { memo } from "react"
import styled, { keyframes } from "styled-components"
import { Box, Flex, TextMicro } from "@netdata/netdata-ui"
import { useLoadingColor, useAttributeValue, useColor } from "@/components/provider"
import Details from "@/components/details"
import GroupBox from "./groupBox"
import useGroupBox from "./useGroupBox"

const frames = keyframes`
  from { opacity: 0.2; }
  to { opacity: 0.6; }
`

const Skeleton = styled(Flex).attrs(props => ({
  background: "borderSecondary",
  flex: true,
  height: 50,
  ...props,
}))`
  animation: ${frames} 1.6s ease-in infinite;
`

export const SkeletonIcon = () => {
  const color = useLoadingColor()
  return <Skeleton background={color} />
}

const GroupBoxWrapper = ({ uiName, subTree, data, label, groupedBy, hasMore }) => {
  const dimensions = Object.values(subTree)

  const [first, ...rest] = groupedBy
  const bg = useColor("themeBackground")

  return (
    <Flex
      data-testid="groupBoxWrapper"
      column
      alignItems="start"
      gap={1}
      margin={[0, 3, 3, 0]}
      border={hasMore ? { color: "borderSecondary", side: "all" } : false}
      round={hasMore}
      padding={hasMore ? [2] : [0]}
      position="relative"
    >
      <Box
        {...(hasMore && {
          position: "absolute",
          top: "-12px",
          left: 1,
          background: bg,
          padding: [0, 1],
        })}
      >
        <TextMicro strong={hasMore} data-testid="groupBoxWrapper-title" whiteSpace="nowrap">
          {label}
          {data.length > 3 && <span>({dimensions.length})</span>}
        </TextMicro>
      </Box>
      {rest.length ? (
        Object.keys(subTree).map(key => (
          <GroupBoxWrapper
            key={key}
            label={key}
            subTree={subTree[key]}
            data={data}
            uiName={uiName}
            groupedBy={rest}
            hasMore={rest.length > 1}
          />
        ))
      ) : (
        <GroupBox dimensions={dimensions} groupLabel={label} uiName={uiName} groupKey={first} />
      )}
    </Flex>
  )
}

const GroupBoxes = ({ uiName }) => {
  const { data, tree } = useGroupBox(uiName)

  const loaded = useAttributeValue("loaded")
  const showingInfo = useAttributeValue("showingInfo")

  const viewDimensions = useAttributeValue("viewDimensions")
  const [first, ...rest] = viewDimensions.grouped_by || []

  if (!loaded) return <SkeletonIcon />

  return (
    <Flex data-testid="groupBoxes" flexWrap flex position="relative" height={{ min: "150px" }}>
      {showingInfo ? (
        <Details />
      ) : rest.length ? (
        Object.keys(tree).map(key => (
          <GroupBoxWrapper
            key={key}
            label={key}
            subTree={tree[key]}
            data={data}
            uiName={uiName}
            groupedBy={rest}
            hasMore={rest.length > 1}
          />
        ))
      ) : (
        <GroupBoxWrapper
          key={first}
          label={first}
          subTree={tree}
          data={data}
          uiName={uiName}
          groupedBy={rest}
        />
      )}
    </Flex>
  )
}

export default memo(GroupBoxes)
