export default sdk => {
  return sdk
    .on("syncAnnotation", (sourceChart, annotationId, annotation) => {
      // Get all charts in the SDK
      const allCharts = sourceChart.getApplicableNodes({})

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
      })
    })
    .on("clearSyncedAnnotations", sourceChart => {
      // Clear all synced annotations from a specific source chart
      const allCharts = sourceChart.getApplicableNodes({})
      const sourceId = sourceChart.getId()

      allCharts.forEach(targetChart => {
        if (targetChart.getId() === sourceId) return

        const targetOverlays = targetChart.getAttribute("overlays")
        const filteredOverlays = {}

        Object.entries(targetOverlays).forEach(([id, overlay]) => {
          // Keep annotations that are not synced from this source chart
          if (!id.includes(`_from_${sourceId}`)) {
            filteredOverlays[id] = overlay
          }
        })

        targetChart.updateAttribute("overlays", filteredOverlays)
      })
    })
}
