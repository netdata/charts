import { measureTextWidth } from "@/helpers/canvas"

export const popoverGridColumns = {
  dimensionMin: "120px",
  value: "156px",
  unit: "44px",
  anomaly: "44px",
  info: "36px",
  annotationsInfo: "70px",
}

const popoverLayout = {
  maxWidthRatio: 0.6,
  paddingX: 32,
  dimensionNamePaddingX: 16,
  dimensionNameFont:
    'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Ubuntu, "Helvetica Neue", sans-serif',
  fallbackCharacterWidth: 6.25,
  fallbackViewportWidth: 1024,
}

const toPixels = value => Number.parseFloat(value) || 0

const getViewportWidth = () =>
  typeof window === "undefined" ? popoverLayout.fallbackViewportWidth : window.innerWidth

const measureDimensionName = text => {
  const value = text || ""
  const width = measureTextWidth(value, popoverLayout.dimensionNameFont)

  return width === null ? Array.from(value).length * popoverLayout.fallbackCharacterWidth : width
}

export const getPopoverFixedWidth = infoColumn =>
  popoverLayout.paddingX +
  toPixels(popoverGridColumns.value) +
  toPixels(popoverGridColumns.unit) +
  toPixels(popoverGridColumns.anomaly) +
  toPixels(infoColumn)

export const getPopoverDimensionColumnWidth = (names, { infoColumn, viewportWidth } = {}) => {
  const minWidth = toPixels(popoverGridColumns.dimensionMin)
  const fixedWidth = getPopoverFixedWidth(infoColumn || popoverGridColumns.info)
  const maxWidth = Math.max(
    minWidth,
    Math.floor((viewportWidth || getViewportWidth()) * popoverLayout.maxWidthRatio - fixedWidth)
  )
  const contentWidth =
    Math.ceil(Math.max(0, ...names.map(measureDimensionName))) +
    popoverLayout.dimensionNamePaddingX

  return Math.min(Math.max(minWidth, contentWidth), maxWidth)
}

export const getPopoverWidth = (dimensionColumnWidth, infoColumn) =>
  dimensionColumnWidth + getPopoverFixedWidth(infoColumn || popoverGridColumns.info)
