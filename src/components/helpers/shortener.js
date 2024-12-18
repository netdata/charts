import React, { useState, useEffect } from "react"
import { mergeRefs } from "@netdata/netdata-ui"
import shorten from "@/helpers/shorten"
import Tooltip from "@/components/tooltip"

const Shortener = ({ text, Component = "div", noTooltip, ref: forwardedRef, ...rest }) => {
  const [shortenText, setShortenText] = useState("")

  const [ref, setRef] = useState()

  useEffect(() => {
    if (!ref) return

    const containerWidth = ref.offsetWidth
    let round = 0

    while (ref.scrollWidth > containerWidth) {
      ref.textContent = shorten(ref.textContent, round)
      round = round + 1
    }

    if (ref.textContent !== text) {
      setShortenText(text)
    }
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
