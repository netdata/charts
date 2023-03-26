import React, { memo, useMemo } from "react"
import styled, { keyframes } from "styled-components"
import { Flex, TextMicro } from "@netdata/netdata-ui"
import { useLoadingColor, useAttributeValue } from "@/components/provider"
import Details from "@/components/details"
import GroupBox from "./groupBox"
import { getWidth, makeGetColor } from "./drawBoxes"
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

const GroupBoxWrapper = ({ subTree, data, label, groupIndex, getColor }) => {
  const dimensions = Object.values(subTree)

  const style = useMemo(() => ({ maxWidth: `${getWidth(data)}px` }), [subTree])

  return (
    <Flex data-testid="groupBoxWrapper" column alignItems="start" gap={1} margin={[0, 4, 0, 0]}>
      <TextMicro data-testid="groupBoxWrapper-title" style={style}>
        {label}
        {data.length > 3 && <span>({dimensions.length})</span>}
      </TextMicro>
      {dimensions[0] && typeof dimensions[0] === "object" ? (
        Object.keys(subTree).map(key => (
          <GroupBoxWrapper
            key={key}
            label={key}
            group={key}
            subTree={subTree[key]}
            data={data}
            getColor={getColor}
          />
        ))
      ) : (
        <GroupBox
          dimensions={dimensions}
          getColor={getColor}
          groupIndex={groupIndex}
          groupLabel={label}
        />
      )}
    </Flex>
  )
}

const GroupBoxes = () => {
  const { data, tree } = useGroupBox()
  const min = useAttributeValue("min")
  const max = useAttributeValue("max")

  const getColor = makeGetColor(min, max)

  const loaded = useAttributeValue("loaded")
  const showingInfo = useAttributeValue("showingInfo")

  if (!loaded) return <SkeletonIcon />

  return (
    <Flex
      data-testid="groupBoxes"
      flexWrap
      overflow={{ vertical: "auto" }}
      flex
      position="relative"
      height={{ min: "150px" }}
    >
      {showingInfo ? (
        <Details />
      ) : (
        Object.keys(tree).map(key => (
          <GroupBoxWrapper
            key={key}
            label={key}
            group={key}
            subTree={tree[key]}
            data={data}
            getColor={getColor}
          />
        ))
      )}
    </Flex>
  )
}

export default memo(GroupBoxes)
