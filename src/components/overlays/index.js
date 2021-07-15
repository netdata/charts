import React, { memo } from "react"
import { useAttributeValue } from "@/components/provider"
import { Fragment } from "react"
import types from "./types"

const Overlays = () => {
  const overlays = useAttributeValue("overlays")

  return (
    <Fragment>
      {Object.keys(overlays).map(id => {
        const { type } = overlays[id]
        const Overlay = types[type]
        return <Overlay key={id} id={id} />
      })}
    </Fragment>
  )
}

export default memo(Overlays)
