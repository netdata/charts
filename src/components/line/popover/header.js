import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import styled from "styled-components"
import { Flex, TextMicro } from "@netdata/netdata-ui"
import { useAttributeValue, useUnitSign } from "@/components/provider"
import { measureTextWidth } from "@/helpers/canvas"
import Timestamp from "./timestamp"
import UpdateEvery from "./updateEvery"

const contextMaxFontSize = 12
const contextMinFontSize = 9

const HeaderContainer = styled(Flex).attrs({
  "data-testid": "chartPopover-header",
  column: true,
  gap: 1,
  width: { min: "0px", base: "100%" },
})``

const ContextText = styled(TextMicro).attrs({
  "data-testid": "chartPopover-context",
  strong: true,
  truncate: true,
})`
  display: block;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  font-size: ${({ $fontSize }) => $fontSize}px;
`

const MetaRow = styled(Flex).attrs({
  alignItems: "center",
  justifyContent: "between",
  gap: 3,
  width: { min: "0px", base: "100%" },
})``

const TimestampCell = styled(Flex).attrs({
  overflow: "hidden",
  width: { min: "0px" },
})``

const SourceUnits = styled(TextMicro).attrs({
  color: "textLite",
  "data-testid": "chartPopover-sourceUnits",
  whiteSpace: "nowrap",
})`
  flex: 0 0 auto;
`

const getMeasuredFont = (element, fontSize) => {
  const style = window.getComputedStyle(element)

  return `${style.fontStyle} ${style.fontVariant} ${style.fontWeight} ${fontSize}px ${style.fontFamily}`
}

const getContextFontSize = (element, text) => {
  if (!element || !text) return contextMaxFontSize

  const width = element.getBoundingClientRect().width
  if (!width) return contextMaxFontSize

  const textWidth = measureTextWidth(text, getMeasuredFont(element, contextMaxFontSize))
  if (!textWidth || textWidth <= width) return contextMaxFontSize

  const next = Math.floor((width / textWidth) * contextMaxFontSize * 10) / 10

  return Math.max(contextMinFontSize, Math.min(contextMaxFontSize, next))
}

const useContextFontSize = text => {
  const ref = useRef()
  const [fontSize, setFontSize] = useState(contextMaxFontSize)

  const update = useCallback(() => {
    const next = getContextFontSize(ref.current, text)
    setFontSize(prev => (prev === next ? prev : next))
  }, [text])

  useLayoutEffect(update, [update])

  useEffect(() => {
    if (!ref.current) return

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update)
      return () => window.removeEventListener("resize", update)
    }

    const observer = new ResizeObserver(update)
    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [update])

  return [ref, fontSize]
}

const Context = () => {
  const contextScope = useAttributeValue("contextScope")
  const name = useAttributeValue("name")
  const context = useMemo(
    () => (contextScope && contextScope.length ? contextScope.join(", ") : name || ""),
    [contextScope, name]
  )
  const [ref, fontSize] = useContextFontSize(context)

  if (!context) return null

  return (
    <ContextText ref={ref} title={context} $fontSize={fontSize}>
      {context}
    </ContextText>
  )
}

const Header = ({ timestamp }) => {
  const sourceUnits = useUnitSign({ withoutConversion: true, long: true })

  return (
    <HeaderContainer>
      <Context />
      <MetaRow>
        <TimestampCell>{timestamp && <Timestamp value={timestamp} />}</TimestampCell>
        {!!sourceUnits && <SourceUnits>[{sourceUnits}]</SourceUnits>}
      </MetaRow>
      <UpdateEvery />
    </HeaderContainer>
  )
}

export default Header
