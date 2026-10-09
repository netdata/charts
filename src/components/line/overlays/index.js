import React, { memo } from "react"
import { useAttributeValue } from "@/components/provider"
import { Fragment } from "react"
import types from "./types"

const Overlays = ({ uiName }) => {
  const overlays = useAttributeValue("overlays")
  const draftAnnotation = useAttributeValue("draftAnnotation")
  const annotationsEnabled = useAttributeValue("annotationsEnabled") !== false

  return (
    <Fragment>
      {annotationsEnabled && draftAnnotation && (
        <types.draftAnnotation id="draftAnnotation" uiName={uiName} />
      )}

      {Object.keys(overlays).map(id => {
        const { type, ...rest } = overlays[id]
        if (type === "annotation" && !annotationsEnabled) return null
        const Overlay = types[type]

        if (!Overlay) return null

        return <Overlay key={id} id={id} uiName={uiName} {...rest} />
      })}
    </Fragment>
  )
}

export default memo(Overlays)
