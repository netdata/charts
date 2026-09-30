import React from "react"
import { Flex, TextMicro } from "@netdata/netdata-ui"
import GroupBox from "@/components/groupBoxes/groupBox"

const GroupLabel = ({ label, count, strong }) => (
  <Flex
    data-testid="groupBoxWrapper-title"
    alignItems="baseline"
    gap={1}
    width={strong ? "auto" : { base: "96px", min: "96px", max: "96px" }}
    overflow="hidden"
    title={label}
  >
    <TextMicro color={strong ? "text" : "textLite"} strong={strong} whiteSpace="nowrap" truncate>
      {label}
    </TextMicro>
    {count !== undefined && (
      <TextMicro color="textDescription" whiteSpace="nowrap">
        {`(${count})`}
      </TextMicro>
    )}
  </Flex>
)

// Groups read as rows (label left, boxes right) so group names line up like the heat grid mockup.
const ModernGroupBoxWrapper = ({ uiName, subTree, data, label, groupedBy }) => {
  const dimensions = subTree === "OTHERS" ? [subTree] : Object.values(subTree)
  const [first, ...rest] = groupedBy
  const count = data.length > 3 ? dimensions.length : undefined

  if (rest.length && subTree !== "OTHERS") {
    return (
      <Flex data-testid="groupBoxWrapper" column gap={2} width="100%">
        <GroupLabel label={label} count={count} strong />
        <Flex column gap={2} padding={[0, 0, 0, 3]}>
          {Object.keys(subTree).map(key => (
            <ModernGroupBoxWrapper
              key={key}
              label={key}
              subTree={subTree[key]}
              data={data}
              uiName={uiName}
              groupedBy={rest}
            />
          ))}
        </Flex>
      </Flex>
    )
  }

  return (
    <Flex data-testid="groupBoxWrapper" alignItems="start" gap={3} width="100%">
      <GroupLabel label={label} count={count} />
      <GroupBox dimensions={dimensions} groupLabel={label} uiName={uiName} groupKey={first} />
    </Flex>
  )
}

export default ModernGroupBoxWrapper
