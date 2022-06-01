import React, { useRef, useMemo } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import Popover from "@netdata/netdata-ui/lib/components/drops/popover"
import { useChart, useUnitSign } from "@/components/provider"
import GroupBox from "./groupBox"
import { getWidth, makeGetColor } from "./drawBoxes"
import getAlign from "./getAlign"
import Legend from "./legend"

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
  data,
  label,
  groupIndex,
  renderGroupPopover,
  renderBoxPopover,
  getColor,
}) => {
  const ref = useRef()
  const align = ref.current && getAlign(ref.current)

  const style = useMemo(() => ({ maxWidth: `${getWidth(data.data)}px` }), [data])

  const boxPopover =
    renderBoxPopover &&
    ((index, boxAlign) => renderBoxPopover({ group: label, groupIndex, align: boxAlign, index }))

  const groupPopover =
    renderGroupPopover && (() => renderGroupPopover({ group: label, groupIndex, align }))

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
            {data.data.length > 3 && <span>({data.data.length})</span>}
          </Label>
        )}
      </Popover>
      <GroupBox data={data} renderTooltip={boxPopover} getColor={getColor} />
    </Flex>
  )
}

const GroupBoxes = ({ data, labels, renderBoxPopover, renderGroupPopover, context }) => {
  const units = useUnitSign()
  const chart = useChart()
  const index = chart.getUI().getThemeIndex()

  const allValues = useMemo(
    () => data.reduce((h, d) => [...h, ...d.data], []).sort((a, b) => a - b),
    [data]
  )

  const defaultColorRange = [
    ["rgba(198, 227, 246, 0.9)", "rgba(43, 44, 170, 1)"],
    ["rgba(43, 44, 170, 1)", "rgba(198, 227, 246, 0.9)"],
  ]

  const getColor = makeGetColor(allValues, defaultColorRange[index])
  return (
    <>
      <Flex data-testid="groupBoxes" flexWrap overflow={{ vertical: "auto" }} flex>
        {labels.map((label, index) => {
          return data[index].data.length ? (
            <GroupBoxWrapper
              key={label}
              label={label}
              groupIndex={index}
              data={data[index]}
              renderGroupPopover={renderGroupPopover}
              renderBoxPopover={renderBoxPopover}
              getColor={allValues.length ? getColor : undefined}
            />
          ) : null
        })}
      </Flex>
      <Flex data-testid="legend-container" justifyContent="between">
        <Legend
          min={chart.getConvertedValue(allValues[0])}
          max={chart.getConvertedValue(allValues[allValues.length - 1])}
          units={units}
        >
          {context}
        </Legend>
      </Flex>
    </>
  )
}

export default GroupBoxes
