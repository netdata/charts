export default sdk => {
  let windowFocused = true
  let timeoutId

  const getNext = () => {
    sdk
      .getNodes(
        (node, { loaded, active, autofetchOnWindowBlur }) =>
          node.type === "chart" && loaded && active && (windowFocused || autofetchOnWindowBlur)
      )
      .forEach(node => node.trigger("render"))

    timeoutId = setTimeout(getNext, 1000)
  }

  const toggleRender = enable => {
    if (enable && !timeoutId) return getNext()
    if (!enable) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const autofetchIfActive = chart => {
    const {
      autofetch: prevAutofetch,
      after,
      hovering,
      active,
      paused,
      fetchStartedAt,
      renderedAt,
      loading,
      loaded,
    } = chart.getAttributes()

    let autofetch = after < 0 && !hovering && !paused

    if (chart.type === "container") return chart.updateAttribute("autofetch", autofetch)

    autofetch = autofetch && active

    toggleRender(autofetch)

    if (
      active &&
      !autofetch &&
      (!loaded || (!!renderedAt && fetchStartedAt < renderedAt && !loading))
    )
      chart.trigger("fetch")

    chart.updateAttribute("autofetch", autofetch)

    if (chart.type !== "chart" || prevAutofetch === autofetch || !active) return

    return chart.trigger("render")
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
      autofetchIfActive(chart, true)
    })
    .on("hoverChart", chart => {
      chart.getApplicableNodes({ syncHover: true }).forEach(autofetchIfActive)
    })
    .on("blurChart", chart => {
      chart.getApplicableNodes({ syncHover: true }).forEach(autofetchIfActive)
    })
    .on("moveX", chart => {
      chart.getApplicableNodes({ syncPanning: true }).forEach(autofetchIfActive)
    })

  return () => {
    offs()
    window.removeEventListener("blur", blur)
    window.removeEventListener("focus", focus)
  }
}
