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

  const autofetchIfActive = (chart, force) => {
    const {
      autofetch: prevAutofetch,
      after,
      hovering,
      active,
      paused,
      fetchStartedAt,
      renderedAt,
      loading,
    } = chart.getAttributes()
    const autofetch = (chart.type === "container" || active) && after < 0 && !hovering && !paused

    toggleRender(autofetch)

    if (active && !autofetch && fetchStartedAt < renderedAt && !loading) chart.fetchAndRender()

    if (chart.getAttribute("loaded")) {
      chart.updateAttribute("autofetch", autofetch)

      if (chart.type !== "chart" || prevAutofetch === autofetch) return

      return chart.trigger("render")
    }

    chart.updateAttribute("autofetch", autofetch)
    if (!autofetch && !force) return chart.trigger("render")
  }

  const blur = () => {
    windowFocused = false
    sdk.getNodes({ autofetchOnWindowBlur: false }, { inherit: true }).forEach(node => {
      node.updateAttribute("paused", true)
      autofetchIfActive(node, true)
    })
  }

  const focus = () => {
    windowFocused = true
    sdk.getNodes({ autofetchOnWindowBlur: false }, { inherit: true }).forEach(node => {
      node.updateAttribute("paused", false)
      autofetchIfActive(node, true)
    })
  }

  window.addEventListener("blur", blur)
  window.addEventListener("focus", focus)

  const offs = sdk
    .on("active", chart => {
      autofetchIfActive(chart, true)
    })
    .on("hoverChart", chart => {
      chart.getApplicableNodes({ syncHover: true }).forEach(node => {
        autofetchIfActive(node, true)
      })
    })
    .on("blurChart", chart => {
      chart.getApplicableNodes({ syncHover: true }).forEach(node => {
        autofetchIfActive(node, true)
      })
    })
    .on("moveX", chart => {
      chart.getApplicableNodes({ syncHover: true }).forEach(node => {
        autofetchIfActive(node, true)
      })
    })

  return () => {
    offs()
    window.removeEventListener("blur", blur)
    window.removeEventListener("focus", focus)
  }
}
