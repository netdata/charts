import { getArea as getNeutralArea } from "@/chartLibraries/helpers/overlayArea"

export const getArea = (chartUI, range) => getNeutralArea(chartUI, range)

export const trigger = (chartUI, id, area) =>
  requestAnimationFrame(() => chartUI.trigger(`overlayedAreaChanged:${id}`, area))
