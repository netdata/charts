import React from "react"
import { useAttributeValue } from "@/components/provider"
import Status from "@/components/status"

const PlainStatus = () => <Status plain />

export const useLeftElements = hasToolbox => {
  const leftHeaderElements = useAttributeValue("leftHeaderElements") || []
  if (hasToolbox) return leftHeaderElements.filter(Element => Element !== Status)
  return leftHeaderElements.map(Element => (Element === Status ? PlainStatus : Element))
}
