import React, { useState, useEffect } from "react"
import { mergeRefs } from "@netdata/netdata-ui"
import { shortenToWidth } from "@/helpers/shorten"
import makeResizeObserver from "@/helpers/makeResizeObserver"
import Tooltip from "@/components/tooltip"

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
    <Tooltip content={!noTooltip && shortenText ? text : ""} align="bottom" isBasic>
      <Component truncate ref={mergeRefs(forwardedRef, setRef)} {...rest}>
        {text}
      </Component>
    </Tooltip>
  )
}

export default Shortener
