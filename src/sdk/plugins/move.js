const getMoveX = (after, before = 0) => {
  if (after < 0) return { after, before }

  if (before > Math.ceil(Date.now() / 1000))
    return { after: Math.floor(after - before + 1), before: 0 }

  return { after: Math.floor(after), before: Math.ceil(before) }
}

export default sdk => {
  let offAfter

  return sdk
    .on("moveX", (chart, after, before) => {
      const move = getMoveX(after, before)

      chart.getApplicableNodes({ syncPanning: true }).forEach(node => {
        node.updateAttributes(move)
        if (node.type === "chart" && node.getAttribute("active")) node.fetchAndRender()
      })
    })
    .on("moveY", (chart, min, max) => {
      chart.updateValueRange([min, max])
      const after = chart.getAttribute("after")

      if (after < 0) {
        const now = Date.now() / 1000 - 1
        chart.moveX(now + after, now)
      }

      if (offAfter) offAfter()
      offAfter = chart.onAttributeChange("after", after => {
        if (after > 0) return

        chart.resetValueRange()
        offAfter()
      })
    })
}
