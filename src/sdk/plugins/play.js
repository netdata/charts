export default sdk => {
  let windowFocused = true
  let timeoutId

  const getNext = () => {
    sdk
      .getRoot()
      .getNodes(
        (node, { loaded, active, autofetchOnWindowBlur }) => {
          return (
            node.type === "chart" && loaded && active && (windowFocused || autofetchOnWindowBlur)
          )
        },
        {
          inherit: false,
        }
      )
      .forEach(node => {
        node.getUI().render()
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

  const autofetchIfActive = chart => {
    const { after, hovering, active } = chart.getAttributes()
    const autofetch = active && after < 0 && !hovering

    if (active && !autofetch) chart.fetchAndRender()

    if (autofetch) toggleRender(autofetch)
    chart.updateAttribute("autofetch", autofetch)
  }

  const blur = () => {
    windowFocused = false
    sdk.getNodes({ autofetchOnWindowBlur: false }).forEach(node => {
      if (node.type === "chart") node.updateAttributes({ autofetch: false })
    })
  }

  const focus = () => {
    windowFocused = true
    sdk.getNodes({ autofetchOnWindowBlur: false }).forEach(node => {
      if (node.type === "chart") autofetchIfActive(node)
    })
  }

  window.addEventListener("blur", blur)
  window.addEventListener("focus", focus)

  const offs = sdk
    .on("active", autofetchIfActive)
    .on("hoverChart", chart => {
      const autofetch = false
      if (autofetch === chart.getAttribute("autofetch")) return

      toggleRender(autofetch)
      chart.getApplicableNodes({ syncHover: true }).forEach(node => {
        node.updateAttribute("autofetch", autofetch)
      })
    })
    .on("blurChart", chart => {
      const autofetch = chart.getAttribute("after") < 0 && chart.getAttribute("active")

      if (autofetch === chart.getAttribute("autofetch")) return

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
