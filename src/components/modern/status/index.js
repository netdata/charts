import React from "react"
import styled from "styled-components"
import { Flex, TextSmall, getColor } from "@netdata/netdata-ui"
import Tooltip, { tooltipStyleProps } from "@/components/tooltip"
import { radius } from "@/components/modern/tokens"
import { capNames, getClearDescription, getStatusLabel } from "./summary"

export * from "./summary"

const dotColors = { clear: "success", warning: "warning", critical: "bright" }

export const statusInk = { warning: "text", critical: "bright" }

const Dot = styled.span`
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: ${radius.pill};
  background: ${({ $color, theme }) => getColor($color)({ theme })};
`

const Holder = styled(Flex)`
  border-radius: ${radius.pill};
  cursor: default;
  outline: none;

  &:focus-visible {
    box-shadow: 0 0 0 2px ${getColor("primary")};
  }
`

const Label = styled.span`
  font-size: 11px;
  line-height: 16px;
  font-weight: ${({ $strong }) => ($strong ? 700 : 600)};
  white-space: nowrap;
  color: ${({ $color, theme }) => getColor($color)({ theme })};
`

const TooltipBox = ({ children }) => (
  <Flex {...tooltipStyleProps} column gap={0.5}>
    {children}
  </Flex>
)

const toLines = description =>
  (Array.isArray(description) ? description : [description]).filter(Boolean)

export const StatusDetails = ({ description, names = [] }) => {
  const { shown, more } = capNames(names)

  return (
    <>
      {toLines(description).map(line => (
        <TextSmall key={line} color="tooltipText">
          {line}
        </TextSmall>
      ))}
      {shown.map(name => (
        <TextSmall key={name} color="tooltipText" strong data-testid="modernStatus-name">
          {name}
        </TextSmall>
      ))}
      {more > 0 && (
        <TextSmall color="tooltipText" data-testid="modernStatus-more">
          {`${more} more`}
        </TextSmall>
      )}
    </>
  )
}

const describe = ({ status, count, description, names }) => {
  if (status === "clear") return toLines(description).join(". ")
  const lines = [getStatusLabel({ status, count }), ...toLines(description), ...names]
  return lines.join(", ")
}

const StatusIndicator = ({
  status,
  count,
  names = [],
  description: givenDescription,
  "data-testid": testId = "modernStatus",
  ...rest
}) => {
  if (status !== "clear" && status !== "warning" && status !== "critical") return null

  const description =
    status === "clear" && !toLines(givenDescription).length
      ? getClearDescription(0)
      : givenDescription
  const isCritical = status === "critical"
  const label = status === "clear" ? null : getStatusLabel({ status, count })

  return (
    <Tooltip
      content={<StatusDetails description={description} names={names} />}
      Content={TooltipBox}
      align="bottom"
    >
      <Holder
        alignItems="center"
        flex={false}
        tabIndex={0}
        role="status"
        aria-label={describe({ status, count, description, names })}
        gap={1.5}
        padding={isCritical ? [0.5, 2] : [0.5, 0]}
        background={isCritical ? "error" : undefined}
        data-testid={testId}
        data-status={status}
        {...rest}
      >
        <Dot $color={dotColors[status]} data-testid="modernStatus-dot" />
        {!!label && (
          <Label $color={statusInk[status]} $strong={isCritical} data-testid="modernStatus-label">
            {label}
          </Label>
        )}
      </Holder>
    </Tooltip>
  )
}

export default StatusIndicator
