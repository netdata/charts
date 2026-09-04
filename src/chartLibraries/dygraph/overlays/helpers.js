import { getArea as getNeutralArea } from "@/chartLibraries/helpers/overlayArea"

export const getArea = (dygraph, range) =>
  getNeutralArea(
    { getXAxisRange: () => dygraph.xAxisRange(), getXCoord: tsMs => dygraph.toDomXCoord(tsMs) },
    range
  )

export const trigger = (chartUI, id, area) =>
  requestAnimationFrame(() => chartUI.trigger(`overlayedAreaChanged:${id}`, area))
