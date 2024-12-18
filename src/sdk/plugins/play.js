export default sdk => {
  let timeoutId

  const getNext = () => {
    if (!sdk.getRoot().getAttribute("paused") && sdk.getRoot().getAttribute("after") < 0)
      sdk.getRoot().setAttribute("fetchAt", Date.now())

    sdk
      .getNodes(
        (node, { loaded, active }) =>
          node.type === "chart" && loaded && active && !sdk.getRoot().getAttribute("paused")
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
    const { after, hovering, active, loaded, fetchStartedAt } = chart.getAttributes()

    let autofetch = after < 0 && !hovering && !chart.getRoot().getAttribute("paused")

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

  const blur = () => {
    sdk.getRoot().updateAttributes({
      paused: !sdk.getRoot().getAttribute("autofetchOnWindowBlur"),
      blurred: true,
    })
    toggleRender(sdk.getRoot().getAttribute("after") < 0 && !sdk.getRoot().getAttribute("paused"))

    sdk.getNodes().forEach(node => autofetchIfActive(node))
  }

  const focus = () => {
    sdk.getRoot().updateAttributes({ paused: false, blurred: false })
    toggleRender(sdk.getRoot().getAttribute("after") < 0 && !sdk.getRoot().getAttribute("paused"))

    sdk.getNodes().forEach(node => autofetchIfActive(node))
  }

  window.addEventListener("blur", blur)
  window.addEventListener("focus", focus)

  const offs = sdk
    .on("active", chart => {
      toggleRender(
        chart.getAttribute("after") < 0 &&
          !chart.getAttribute("hovering") &&
          !sdk.getRoot().getAttribute("paused")
      )

      autofetchIfActive(chart, { force: true })
    })
    .on("play:hoverChart", chart => {
      toggleRender(false)

      if (sdk.getRoot().getAttribute("paused")) return

      chart
        .getApplicableNodes({ syncHover: true })
        .forEach(node => autofetchIfActive(node, { now: chart.getAttribute("renderedAt") }))
    })
    .on("play:blurChart", chart => {
      if (chart.getRoot().getAttribute("paused")) return

      toggleRender(chart.getAttribute("after") < 0 && !sdk.getRoot().getAttribute("paused"))

      chart.getApplicableNodes({ syncHover: true }).forEach(node => autofetchIfActive(node))
    })
    .on("moveX", chart => {
      toggleRender(chart.getAttribute("after") < 0 && !sdk.getRoot().getAttribute("paused"))

      chart.getApplicableNodes({ syncPanning: true }).forEach(node => {
        node.setAttributes({ viewUpdateEvery: 0, updateEvery: 0 })
        autofetchIfActive(node)
      })
    })

  sdk
    .getRoot()
    .onAttributeChange("paused", () => sdk.getNodes().forEach(node => autofetchIfActive(node)))

  return () => {
    offs()
    window.removeEventListener("blur", blur)
    window.removeEventListener("focus", focus)
  }
}
