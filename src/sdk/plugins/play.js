export default sdk => {
  let windowFocused = true
  let timeoutId

  const getNext = () => {
    if (!sdk.getRoot().getAttribute("paused") && sdk.getRoot().getAttribute("after") < 0)
      sdk.getRoot().setAttribute("fetchAt", Date.now())

    sdk
      .getNodes(
        (node, { loaded, active, autofetchOnWindowBlur }) =>
          node.type === "chart" && loaded && active && (windowFocused || autofetchOnWindowBlur)
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

    toggleRender(autofetch)
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
    windowFocused = false
    sdk.getNodes({ autofetchOnWindowBlur: false }, { inherit: true }).forEach(node => {
      node.updateAttribute("paused", true)
      autofetchIfActive(node)
    })
  }

  const focus = () => {
    windowFocused = true
    sdk.getNodes({ autofetchOnWindowBlur: false }, { inherit: true }).forEach(node => {
      node.updateAttribute("paused", false)
      autofetchIfActive(node)
    })
  }

  window.addEventListener("blur", blur)
  window.addEventListener("focus", focus)

  const offs = sdk
    .on("active", chart => {
      autofetchIfActive(chart, !chart.getAttribute("loaded"))
    })
    .on("hoverChart", chart => {
      if (chart.getAttribute("paused")) return

      chart.getApplicableNodes({ syncHover: true }).forEach(node => autofetchIfActive(node))
    })
    .on("blurChart", chart => {
      if (chart.getAttribute("paused")) return

      chart.getApplicableNodes({ syncHover: true }).forEach(node => autofetchIfActive(node))
    })
    .on("moveX", chart => {
      chart.getApplicableNodes({ syncPanning: true }).forEach(node => autofetchIfActive(node))
    })

  return () => {
    offs()
    window.removeEventListener("blur", blur)
    window.removeEventListener("focus", focus)
  }
}
