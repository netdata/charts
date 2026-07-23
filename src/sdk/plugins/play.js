export default sdk => {
  let timeoutId
  const root = sdk.getRoot()

  const isRenderingPaused = chart => {
    return (
      (!root.getAttribute("autofetchOnHovering") && chart?.getAttribute("hovering")) ||
      (!root.getAttribute("autofetchOnWindowBlur") && root.getAttribute("blurred")) ||
      root.getAttribute("paused")
    )
  }

  const getNext = () => {
    if (!root.getAttribute("paused") && root.getAttribute("after") < 0)
      root.setAttribute("fetchAt", Date.now())

    sdk
      .getNodes(
        (node, { loaded, active }) =>
          node.type === "chart" && loaded && active && !root.getAttribute("paused")
      )
      .forEach(node => node.trigger("render"))

    timeoutId = setTimeout(getNext, 1000)
  }

  const toggleRender = enable => {
    clearTimeout(timeoutId)
    timeoutId = null
    if (enable) getNext()
  }

  const autofetchIfActive = (chart, { now = new Date(), force = false } = {}) => {
    const { after, active, loaded, fetchStartedAt } = chart.getAttributes()

    let autofetch = after < 0 && !isRenderingPaused(chart)

    if (chart.type === "container") return chart.updateAttribute("autofetch", autofetch)

    autofetch = autofetch && active

    chart.updateAttribute("autofetch", autofetch)

    const [lastAfter, lastBefore] = chart.lastFetch
    const [fetchAfter, fetchBefore] = chart.getDateWindow()

    if (
      active &&
      (!autofetch || lastAfter - lastBefore !== fetchAfter - fetchBefore) &&
      (force || (loaded && (lastAfter !== fetchAfter || lastBefore !== fetchBefore)))
    ) {
      if (fetchStartedAt && now - chart.getUpdateEvery() <= fetchStartedAt) return

      chart.lastFetch = [fetchAfter, fetchBefore]
      chart.trigger("fetch")
    }
  }

  const refreshPlaybackState = () => {
    toggleRender(root.getAttribute("after") < 0 && !isRenderingPaused())
    sdk.getNodes().forEach(node => autofetchIfActive(node))
  }

  const isDocumentBlurred = () =>
    document.visibilityState === "hidden" ||
    (typeof document.hasFocus === "function" && !document.hasFocus())

  const clearHoverState = () => {
    sdk.getNodes().forEach(node => {
      const attributes = {}
      if (node.getAttribute("focused")) attributes.focused = false
      if (node.getAttribute("hovering")) attributes.hovering = false
      if (node.getAttribute("renderedAt") !== null) attributes.renderedAt = null
      if (Object.keys(attributes).length) node.updateAttributes(attributes)
    })

    root.removePauseReasonsByType("hover")
  }

  const reconcilePlaybackState = (options = {}) => {
    const { blurred = isDocumentBlurred(), clearHover = false } =
      typeof options === "object" && options ? options : {}
    const previousPaused = root.getAttribute("paused")

    if (clearHover) clearHoverState()
    root.updateAttribute("blurred", blurred)

    if (previousPaused === root.getAttribute("paused")) refreshPlaybackState()
  }

  const blur = () => reconcilePlaybackState({ blurred: true })
  const focus = () => reconcilePlaybackState({ blurred: false })
  const visibilityChange = () => reconcilePlaybackState()

  window.addEventListener("blur", blur)
  window.addEventListener("focus", focus)
  document.addEventListener("visibilitychange", visibilityChange)

  const offs = sdk
    .on("active", chart => {
      toggleRender(chart.getAttribute("after") < 0 && !isRenderingPaused(chart))

      autofetchIfActive(chart, { force: true })
    })
    .on("play:hoverChart", chart => {
      toggleRender(sdk.getRoot().getAttribute("autofetchOnHovering"))

      if (sdk.getRoot().getAttribute("paused")) return

      chart
        .getApplicableNodes({ syncHover: true })
        .forEach(node => autofetchIfActive(node, { now: chart.getAttribute("renderedAt") }))
    })
    .on("play:blurChart", chart => {
      if (chart.getRoot().getAttribute("paused")) return

      toggleRender(chart.getAttribute("after") < 0 && !isRenderingPaused(chart))

      chart.getApplicableNodes({ syncHover: true }).forEach(node => autofetchIfActive(node))
    })
    .on("moveX", chart => {
      toggleRender(chart.getAttribute("after") < 0 && !isRenderingPaused(chart))

      chart.getApplicableNodes({ syncPanning: true }).forEach(node => {
        node.setAttributes({ viewUpdateEvery: 0, updateEvery: 0, fetchStartedAt: 0 })
        autofetchIfActive(node)
      })
    })
    .on("reconcilePlaybackState", reconcilePlaybackState)

  const offPaused = root.onAttributeChange("paused", refreshPlaybackState)
  root.updateAttribute("blurred", document.visibilityState === "hidden")

  return () => {
    offs()
    offPaused()
    clearTimeout(timeoutId)
    window.removeEventListener("blur", blur)
    window.removeEventListener("focus", focus)
    document.removeEventListener("visibilitychange", visibilityChange)
  }
}
