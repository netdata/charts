import React, { useState, useEffect } from "react"
import { mergeRefs, Tooltip } from "@netdata/netdata-ui"
import { shortenToWidth } from "@/helpers/shorten"
import makeResizeObserver from "@/helpers/makeResizeObserver"
import { DefaultContent } from "@/components/tooltip"

const Shortener = ({ text, Component = "div", noTooltip, ref: forwardedRef, ...rest }) => {
  const [shortenText, setShortenText] = useState("")

  const [ref, setRef] = useState()

  useEffect(() => {
    if (!ref) return

    const shorten = () => {
      ref.textContent = text

      const next = shortenToWidth(text, ref.scrollWidth, ref.offsetWidth)

      ref.textContent = next
      setShortenText(next === text ? "" : text)
    }

    shorten()

    return makeResizeObserver(ref, shorten)
  }, [text, ref])

  return (
    <Tooltip
      plain
      content={
        !noTooltip && shortenText ? (
          <DefaultContent align="bottom" isBasic>
            {text}
          </DefaultContent>
        ) : (
          ""
        )
      }
      align="bottom"
      isBasic
      dropProps={{ "data-toolbox": undefined }}
      zIndex={100}
    >
      <Component truncate ref={mergeRefs(forwardedRef, setRef)} {...rest}>
        {text}
      </Component>
    </Tooltip>
  )
}

export default Shortener
