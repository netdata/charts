import { useAttributeValue, useDimensionIds, useVisibleDimensionIds } from "@/components/provider"

export const useHiddenDimensionsCount = () => {
  const dimensionIds = useDimensionIds() || []
  const visibleIds = useVisibleDimensionIds() || []
  const selectedLegendDimensions = useAttributeValue("selectedLegendDimensions")

  if (!selectedLegendDimensions?.length) return 0
  return Math.max(0, dimensionIds.length - visibleIds.length)
}

export const showAllDimensions = chart => chart.updateAttribute("selectedLegendDimensions", [])
