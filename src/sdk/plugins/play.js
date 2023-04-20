export default sdk => {
  let timeoutId

  const getNext = () => {
    if (
      (!sdk.getRoot().getAttribute("paused") ||
        sdk.getRoot().getAttribute("autofetchOnWindowBlur")) &&
      sdk.getRoot().getAttribute("after") < 0
    )
      sdk.getRoot().setAttribute("fetchAt", Date.now())

    sdk
      .getNodes(
        (node, { loaded, active, autofetchOnWindowBlur }) =>
          node.type === "chart" &&
          loaded &&
          active &&
          (!sdk.getRoot().getAttribute("paused") || autofetchOnWindowBlur)
      )
      .forEach(node => node.trigger("render"))

    timeoutId = setTimeout(getNext, 1000)
  }

  const toggleRender = enable => {
    clearTimeout(timeoutId)
    timeoutId = null
    if (enable) getNext()
  }

  const autofetchIfActive = (chart, force = false) => {
    const { after, hovering, active, paused, loaded } = chart.getAttributes()

    let autofetch = after < 0 && !hovering && !paused

    if (chart.type === "container") return chart.updateAttribute("autofetch", autofetch)

    autofetch = autofetch && active

    chart.updateAttribute("autofetch", autofetch)

    const [lastAfter, lastBefore] = chart.lastFetch
    const [fetchAfter, fetchBefore] = chart.getDateWindow()

    if (
      active &&
      !autofetch &&
      (force || (loaded && (lastAfter !== fetchAfter || lastBefore !== fetchBefore)))
    ) {
      chart.lastFetch = [fetchAfter, fetchBefore]
      chart.trigger("fetch")
    }
  }

  const blur = () => {
    sdk.getRoot().setAttribute("paused", true)
    toggleRender(sdk.getRoot().getAttribute("after") < 0 && !sdk.getRoot().getAttribute("paused"))

    sdk.getNodes().forEach(node => {
      node.updateAttribute("paused", true)
      autofetchIfActive(node)
    })
  }

  const focus = () => {
    sdk.getRoot().setAttribute("paused", false)
    toggleRender(sdk.getRoot().getAttribute("after") < 0 && !sdk.getRoot().getAttribute("paused"))

    sdk.getNodes().forEach(node => {
      node.updateAttribute("paused", false)
      autofetchIfActive(node)
    })
  }

  window.addEventListener("blur", blur)
  window.addEventListener("focus", focus)

  const offs = sdk
    .on("active", chart => {
      toggleRender(
        chart.getAttribute("after") < 0 &&
          !chart.getAttribute("hovering") &&
          !chart.getAttribute("paused")
      )

      autofetchIfActive(chart, !chart.getAttribute("loaded"))
    })
    .on("hoverChart", chart => {
      toggleRender(false)

      if (chart.getAttribute("paused")) return

      chart.getApplicableNodes({ syncHover: true }).forEach(node => autofetchIfActive(node))
    })
    .on("blurChart", chart => {
      if (chart.getAttribute("paused")) return

      toggleRender(chart.getAttribute("after") < 0 && !chart.getAttribute("paused"))

      chart.getApplicableNodes({ syncHover: true }).forEach(node => autofetchIfActive(node))
    })
    .on("moveX", chart => {
      toggleRender(chart.getAttribute("after") < 0 && !chart.getAttribute("paused"))

      chart.getApplicableNodes({ syncPanning: true }).forEach(node => autofetchIfActive(node))
    })

  return () => {
    offs()
    window.removeEventListener("blur", blur)
    window.removeEventListener("focus", focus)
  }
}
