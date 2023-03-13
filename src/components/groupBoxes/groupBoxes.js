import React, { useMemo } from "react"
import { Flex, TextMicro } from "@netdata/netdata-ui"
import { useChart, useAttributeValue } from "@/components/provider"
import GroupBox from "./groupBox"
import { getWidth, makeGetColor } from "./drawBoxes"
import useGroupBox from "./useGroupBox"

const GroupBoxWrapper = ({ subTree, data, label, groupIndex, getColor }) => {
  const dimensions = Object.values(subTree)

  const chart = useChart()

  const mouseout = event => {
    chart.getUI().sdk.trigger("blurChart", chart, event)
    chart.getUI().chart.trigger("blurChart", event)
  }

  const mouseover = event => {
    chart.getUI().sdk.trigger("hoverChart", chart, event)
    chart.getUI().chart.trigger("hoverChart", event)
  }

  const style = useMemo(() => ({ maxWidth: `${getWidth(data)}px` }), [subTree])

  return (
    <Flex
      data-testid="groupBoxWrapper"
      column
      alignItems="start"
      gap={1}
      margin={[0, 4, 0, 0]}
      onMouseOut={mouseout}
      onMouseOver={mouseover}
    >
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

  return (
    <Flex data-testid="groupBoxes" flexWrap overflow={{ vertical: "auto" }} flex>
      {Object.keys(tree).map(key => (
        <GroupBoxWrapper
          key={key}
          label={key}
          group={key}
          subTree={tree[key]}
          data={data}
          getColor={getColor}
        />
      ))}
    </Flex>
  )
}

export default React.memo(GroupBoxes)
