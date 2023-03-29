export default sdk => {
  let windowFocused = true
  let timeoutId

  const getNext = () => {
    sdk
      .getNodes(
        (node, { loaded, active, autofetchOnWindowBlur }) =>
          node.type === "chart" && loaded && active && (windowFocused || autofetchOnWindowBlur)
      )
      .forEach(node => {
        if (node.getAttribute("loading") || Date.now() - node.getUI().getRenderedAt() < 1000) return

        node.trigger("render")
      })

    timeoutId = setTimeout(() => {
      getNext()
    }, 1000)
  }

  const toggleRender = enable => {
    if (enable && !timeoutId) return getNext()
    if (!enable) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const autofetchIfActive = (chart, force) => {
    const { after, hovering, active, paused } = chart.getAttributes()
    const autofetch = (chart.type === "container" || active) && after < 0 && !hovering && !paused

    if (!autofetch && !force) return chart.trigger("render")

    if (chart.getAttribute("loaded")) {
      chart.updateAttribute("autofetch", autofetch)

      if (chart.type !== "chart") return
      return chart.trigger("render")
    }

    if (active && !autofetch) chart.fetchAndRender()

    if (autofetch) toggleRender(autofetch)
    chart.updateAttribute("autofetch", autofetch)
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
      if (
        chart.getAttribute("hovering") &&
        chart.getAttribute("renderedAt") < chart.getUI().getRenderedAt()
      )
        chart.fetchAndRender()
    })
    .on("hoverChart", chart => {
      if (chart.getAttribute("paused") || !chart.getAttribute("autofetch")) return
      const autofetch = false

      toggleRender(autofetch)
      chart.getApplicableNodes({ syncHover: true }).forEach(node => {
        node.updateAttribute("autofetch", autofetch)
      })
    })
    .on("blurChart", chart => {
      const autofetch = chart.getAttribute("after") < 0 && chart.getAttribute("active")

      if (chart.getAttribute("paused") || autofetch === chart.getAttribute("autofetch")) return

      toggleRender(autofetch)
      chart.getApplicableNodes({ syncHover: true }).forEach(node => {
        node.updateAttribute("autofetch", autofetch)
      })
    })
    .on("moveX", (chart, after) => {
      const autofetch = after < 0 && !chart.getAttribute("hovering")

      if (autofetch === chart.getAttribute("autofetch")) return

      toggleRender(autofetch)
      chart.getApplicableNodes({ syncPanning: true }).forEach(node => {
        node.updateAttribute("autofetch", autofetch)
      })
    })

  return () => {
    offs()
    window.removeEventListener("blur", blur)
    window.removeEventListener("focus", focus)
  }
}
