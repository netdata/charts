import makeLog from "@/sdk/makeLog"

export default sdk => {
  return sdk
    .on("syncAnnotation", (sourceChart, annotationId, annotation) => {
      // Get all charts in the SDK
      const allCharts = sourceChart.getApplicableNodes({})

      let syncedCount = 0
      allCharts.forEach(targetChart => {
        // Skip the source chart
        if (targetChart.getId() === sourceChart.getId()) return

        const targetOverlays = targetChart.getAttribute("overlays")
        const syncedAnnotationId = `synced_${annotationId}_from_${sourceChart.getId()}`

        // Add synced annotation with originallyFrom property
        targetChart.updateAttribute("overlays", {
          ...targetOverlays,
          [syncedAnnotationId]: {
            ...annotation,
            type: "annotation",
            originallyFrom: sourceChart.getId(),
            originalId: annotationId,
          },
        })
        syncedCount++
      })

      // Log annotation sync for debugging
      makeLog(sourceChart)({
        event: "annotation_synced",
        annotationId,
        sourceChartId: sourceChart.getId(),
        targetChartCount: syncedCount,
        timestamp: annotation.timestamp,
      })
    })
    .on("clearSyncedAnnotations", sourceChart => {
      // Clear all synced annotations from a specific source chart
      const allCharts = sourceChart.getApplicableNodes({})
      const sourceId = sourceChart.getId()

      let clearedCount = 0
      allCharts.forEach(targetChart => {
        if (targetChart.getId() === sourceId) return

        const targetOverlays = targetChart.getAttribute("overlays")
        const filteredOverlays = {}
        let removedFromThisChart = 0

        Object.entries(targetOverlays).forEach(([id, overlay]) => {
          // Keep annotations that are not synced from this source chart
          if (!id.includes(`_from_${sourceId}`)) {
            filteredOverlays[id] = overlay
          } else {
            removedFromThisChart++
          }
        })

        if (removedFromThisChart > 0) {
          targetChart.updateAttribute("overlays", filteredOverlays)
          clearedCount += removedFromThisChart
        }
      })

      // Log sync clearing for debugging
      if (clearedCount > 0) {
        makeLog(sourceChart)({
          event: "annotation_sync_cleared",
          sourceChartId: sourceId,
          clearedCount,
        })
      }
    })
}
