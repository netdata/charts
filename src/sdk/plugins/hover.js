const requestFrame = callback => {
  if (
    typeof globalThis.requestAnimationFrame === "function" &&
    typeof globalThis.cancelAnimationFrame === "function"
  ) {
    const id = globalThis.requestAnimationFrame(callback)
    return () => globalThis.cancelAnimationFrame(id)
  }

  const id = globalThis.setTimeout(callback, 16)
  return () => globalThis.clearTimeout(id)
}

export default sdk => {
  const pendingByGroup = new Map()
  const getGroup = chart => chart.getAncestor({ syncHover: true }) || chart
  const cancelAllPending = () => {
    pendingByGroup.forEach(({ cancel }) => cancel())
    pendingByGroup.clear()
  }
  const cancelPending = chart => {
    const group = getGroup(chart)
    pendingByGroup.get(group)?.cancel()
    pendingByGroup.delete(group)
  }
  const clearHover = chart => {
    cancelPending(chart)
    chart
      .getApplicableNodes({ syncHover: true })
      .forEach(node => node.updateAttribute("hoverX", null))
  }
  const publishHover = ({ chart, dimensionX, dimensionY }) => {
    chart.getApplicableNodes({ syncHover: true }).forEach(node => {
      const hover = node.getAttribute("hoverX")
      if (hover?.[0] === dimensionX && hover?.[1] === dimensionY) return

      node.updateAttribute("hoverX", [dimensionX, dimensionY])
    })
  }
  const scheduleHover = (chart, dimensionX, dimensionY) => {
    const group = getGroup(chart)
    const pending = pendingByGroup.get(group)

    if (pending) {
      pending.chart = chart
      pending.dimensionX = dimensionX
      pending.dimensionY = dimensionY
      return
    }

    const next = { chart, dimensionX, dimensionY }
    next.cancel = requestFrame(() => {
      pendingByGroup.delete(group)
      publishHover(next)
    })
    pendingByGroup.set(group, next)
  }

  const unregister = sdk
    .on("highlightHover", (chart, dimensionX, dimensionY) => {
      scheduleHover(chart, dimensionX, dimensionY)
    })
    .on("highlightBlur", chart => {
      clearHover(chart)
    })
    .on("reconcilePlaybackState", options => {
      if (options?.clearHover) cancelAllPending()
    })
    .on("hoverChart", chart => {
      chart.getApplicableNodes({ syncHover: true }).forEach(node => {
        if (
          sdk.getRoot().getAttribute("autofetchOnHovering") ||
          node.getAttribute("hovering") ||
          chart.getRoot().getAttribute("paused")
        )
          return

        node.updateAttributes({
          hovering: true,
          renderedAt:
            chart.getAttribute("after") < 0
              ? chart.getUI().getRenderedAt()
              : chart.getAttribute("before") * 1000,
        })
      })
      sdk.trigger("play:hoverChart", chart)
    })
    .on("blurChart", chart => {
      cancelPending(chart)
      chart.getApplicableNodes({ syncHover: true }).forEach(node => {
        node.updateAttributes({ hovering: false, hoverX: null, renderedAt: null })
      })
      sdk.trigger("play:blurChart", chart)
    })

  return () => {
    cancelAllPending()
    unregister()
  }
}
