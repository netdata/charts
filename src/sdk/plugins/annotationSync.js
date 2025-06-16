import makeLog from "@/sdk/makeLog"

export default sdk => {
  return sdk
    .on("syncAnnotation", (sourceChart, annotationId, annotation) => {
      const allCharts = sourceChart.getApplicableNodes({})

      allCharts.forEach(targetChart => {
        if (targetChart.getId() === sourceChart.getId()) return

        const targetOverlays = targetChart.getAttribute("overlays")
        const syncedAnnotationId = `synced_${annotationId}_from_${sourceChart.getId()}`

        targetChart.updateAttribute("overlays", {
          ...targetOverlays,
          [syncedAnnotationId]: {
            ...annotation,
            type: "annotation",
            originallyFrom: sourceChart.getId(),
            originalId: annotationId,
          },
        })
      })

      makeLog(sourceChart)({
        event: "annotation_synced",
        annotationId,
      })
    })
    .on("clearSyncedAnnotations", sourceChart => {
      const allCharts = sourceChart.getApplicableNodes({})
      const sourceId = sourceChart.getId()

      let clearedCount = 0
      allCharts.forEach(targetChart => {
        if (targetChart.getId() === sourceId) return

        const targetOverlays = targetChart.getAttribute("overlays")
        const filteredOverlays = {}
        let removedFromThisChart = 0

        Object.entries(targetOverlays).forEach(([id, overlay]) => {
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

      if (clearedCount > 0) {
        makeLog(sourceChart)({
          event: "annotation_sync_cleared",
        })
      }
    })
    .on("clearAnnotationFromOtherCharts", (sourceChart, annotationId) => {
      const allCharts = sourceChart.getApplicableNodes({})
      const sourceId = sourceChart.getId()

      let clearedCount = 0
      allCharts.forEach(targetChart => {
        if (targetChart.getId() === sourceId) return

        const targetOverlays = targetChart.getAttribute("overlays")
        if (targetOverlays[annotationId]) {
          // eslint-disable-next-line no-unused-vars
          const { [annotationId]: removed, ...remainingOverlays } = targetOverlays
          targetChart.updateAttribute("overlays", remainingOverlays)
          clearedCount++
        }
      })

      if (clearedCount > 0) {
        makeLog(sourceChart)({
          event: "annotation_cleared_from_other_charts",
        })
      }
    })
}
