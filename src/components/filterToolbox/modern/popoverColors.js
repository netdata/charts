export const getPopoverSurface = ({ colors }) =>
  colors.popoverBackground ? "popoverBackground" : "dropdown"

const getPopoverTint =
  amount =>
  ({ theme }) => {
    const background = theme.colors[getPopoverSurface(theme)]
    const neutral = theme.colors.neutral[theme.name === "Dark" ? "white" : "black"]
    return `color-mix(in srgb, ${background}, ${neutral} ${amount}%)`
  }

export const popoverItemColors = {
  hover: getPopoverTint(9),
  selected: getPopoverTint(14),
  selectedHover: getPopoverTint(18),
}
