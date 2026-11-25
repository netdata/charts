import styled from "styled-components"
import { Box, TextSmall, getColor } from "@netdata/netdata-ui"
import { useAttributeValue, useEmpty, useInitialLoading } from "@/components/provider"
import ScopeSentence from "./scopeSentenceLine"

const ScopeButton = styled(Box).attrs(({ disabled }) => ({
  as: "button",
  width: { min: "0px", max: "100%" },
  padding: [0],
  overflow: "hidden",
  cursor: disabled ? "default" : "pointer",
}))`
  display: block;
  border: 0;
  background: transparent;
  text-align: left;
  font-family: inherit;
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: ${({ tone, theme }) => getColor(tone || "textLite")({ theme })};

  &:hover:not(:disabled) {
    color: ${({ tone, theme }) => getColor(tone || "text")({ theme })};
  }
`

const Status = ({ status, color, hasFilters, open, onToggle, children }) => {
  if (!hasFilters)
    return (
      <TextSmall color={color} data-testid={`chartScope-${status}`} truncate>
        {children}
      </TextSmall>
    )

  return (
    <ScopeButton
      type="button"
      onClick={onToggle}
      tone={color}
      title={`${children} (click to ${open ? "hide" : "edit"} filters)`}
      aria-expanded={open}
      data-testid={`chartScope-${status}`}
    >
      {children}
    </ScopeButton>
  )
}

const ScopeLine = ({ hasFilters = true, open = false, onToggle, quietError = false }) => {
  const initialLoading = useInitialLoading()
  const empty = useEmpty()
  const error = useAttributeValue("error")
  const CustomScopeLine = useAttributeValue("scopeLine")
  const statusProps = { hasFilters, open, onToggle }

  if (error)
    return (
      <Status status="error" color={quietError && !empty ? "textLite" : "error"} {...statusProps}>
        {`Error: ${error}`}
      </Status>
    )

  if (initialLoading)
    return (
      <Status status="loading" color="textLite" {...statusProps}>
        Loading…
      </Status>
    )

  if (empty)
    return (
      <Status status="empty" color="textLite" {...statusProps}>
        No data
      </Status>
    )

  if (CustomScopeLine) return <CustomScopeLine />

  return <ScopeSentence hasFilters={hasFilters} open={open} onToggle={onToggle} />
}

export default ScopeLine
