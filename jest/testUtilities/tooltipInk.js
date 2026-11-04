const rgbToHex = rgb =>
  `#${rgb
    .match(/\d+/g)
    .slice(0, 3)
    .map(n => Number(n).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase()

export const inkOf = node => rgbToHex(getComputedStyle(node).color)

export const bubblesAround = (node, tooltipColor) => {
  const bubbles = []
  for (let el = node; el && el !== document.body; el = el.parentElement) {
    const { backgroundColor } = getComputedStyle(el)
    if (backgroundColor && rgbToHex(backgroundColor) === tooltipColor.toUpperCase())
      bubbles.push(el)
  }
  return bubbles
}
