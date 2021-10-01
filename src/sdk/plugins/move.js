const getMoveX = (after, before) => {
  if (after < 0) return { after }

  if (before > Date.now() / 1000) return { after: Math.round(after - before) }

  return { after: Math.round(after), before: Math.round(before) }
}

export default sdk => {
  return sdk
    .on("moveX", (chart, after, before) => {
      const move = getMoveX(after, before)

      chart.getApplicableNodes({ syncPanning: true }).forEach(node => {
        node.updateAttributes(move)
        if (node.type === "chart" && node.getAttribute("active"))
          node.fetch().then(() => node.getUI().render())
      })
    })
    .on("moveY", (chart, min, max) => {
      chart.updateValueRange([min, max])
      const after = chart.getAttribute("after")
      if (after > 0) return

      const now = Date.now() / 1000
      chart.moveX(now + after, now)

      let offAfter = chart.onAttributeChange("after", after => {
        if (after > 0) return

        chart.resetValueRange()
        offAfter()
      })
    })
}
