import React, { useRef, useMemo } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import Popover from "@netdata/netdata-ui/lib/components/drops/popover"
import { useChart, useAttributeValue } from "@/components/provider"
import GroupBox from "./groupBox"
import { getWidth, makeGetColor } from "./drawBoxes"
import getAlign from "./getAlign"
import Legend from "./legend"
import useGroupBox from "./useGroupBox"

const Title = styled.span`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow-x: hidden;
`

const Label = styled(Flex).attrs({
  as: TextMicro,
  gap: 1,
})`
  cursor: default;
  &:hover {
    font-weight: bold;
  }
`

const GroupBoxWrapper = ({
  subTree,
  data,
  label,
  groupIndex,
  renderGroupPopover,
  renderBoxPopover,
  getColor,
}) => {
  const dimensions = Object.values(subTree)

  const ref = useRef()
  const align = ref.current && getAlign(ref.current)

  const style = useMemo(() => ({ maxWidth: `${getWidth(data)}px` }), [subTree])

  const boxPopover = useMemo(
    () =>
      renderBoxPopover &&
      ((index, boxAlign) => renderBoxPopover({ group: label, groupIndex, align: boxAlign, index })),
    [label, renderBoxPopover]
  )

  const groupPopover = useMemo(
    () => renderGroupPopover && (() => renderGroupPopover({ group: label, groupIndex, align })),
    [label, renderGroupPopover]
  )

  const chart = useChart()

  const mouseout = event => {
    chart.getUI().sdk.trigger("blurChart", chart, event)
    chart.getUI().chart.trigger("blurChart", event)
  }

  const mouseover = event => {
    chart.getUI().sdk.trigger("hoverChart", chart, event)
    chart.getUI().chart.trigger("hoverChart", event)
  }

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
      <Popover content={groupPopover} align={align} plain>
        {({ isOpen, ref: popoverRef, ...rest }) => (
          <Label
            data-testid="groupBoxWrapper-title"
            ref={el => {
              ref.current = el
              popoverRef(el)
            }}
            strong={isOpen}
            style={style}
            {...rest}
          >
            <Title>{label}</Title>
            {data.length > 3 && <span>({dimensions.length})</span>}
          </Label>
        )}
      </Popover>
      {dimensions[0] && typeof dimensions[0] === "object" ? (
        Object.keys(subTree).map(key => (
          <GroupBoxWrapper
            key={key}
            label={key}
            group={key}
            subTree={subTree[key]}
            data={data}
            renderGroupPopover={renderGroupPopover}
            renderBoxPopover={renderBoxPopover}
            getColor={getColor}
          />
        ))
      ) : (
        <GroupBox dimensions={dimensions} renderTooltip={boxPopover} getColor={getColor} />
      )}
    </Flex>
  )
}

const GroupBoxes = ({ renderBoxPopover, renderGroupPopover }) => {
  const { data, tree } = useGroupBox()
  const min = useAttributeValue("min")
  const max = useAttributeValue("max")

  const getColor = makeGetColor(min, max)

  return (
    <>
      <Flex data-testid="groupBoxes" flexWrap overflow={{ vertical: "auto" }} flex>
        {Object.keys(tree).map(key => (
          <GroupBoxWrapper
            key={key}
            label={key}
            group={key}
            subTree={tree[key]}
            data={data}
            renderGroupPopover={renderGroupPopover}
            renderBoxPopover={renderBoxPopover}
            getColor={getColor}
          />
        ))}
      </Flex>
      <Flex data-testid="legend-container" justifyContent="between">
        <Legend />
      </Flex>
    </>
  )
}

export default React.memo(GroupBoxes)
