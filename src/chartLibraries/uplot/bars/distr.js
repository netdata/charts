const roundDec = (val, dec) => {
  const factor = 10 ** dec
  return Math.round(val * factor) / factor
}

export const SPACE_BETWEEN = 1
export const SPACE_AROUND = 2
export const SPACE_EVENLY = 3

const coord = (i, offs, iwid, gap) => roundDec(offs + i * (iwid + gap), 6)

export const distr = (numItems, sizeFactor, justify, onlyIdx, each) => {
  const space = 1 - sizeFactor

  let gap =
    justify === SPACE_BETWEEN
      ? space / (numItems - 1)
      : justify === SPACE_AROUND
        ? space / numItems
        : justify === SPACE_EVENLY
          ? space / (numItems + 1)
          : 0

  if (isNaN(gap) || gap === Infinity) gap = 0

  const offs =
    justify === SPACE_BETWEEN
      ? 0
      : justify === SPACE_AROUND
        ? gap / 2
        : justify === SPACE_EVENLY
          ? gap
          : 0

  const iwid = sizeFactor / numItems
  const roundedWid = roundDec(iwid, 6)

  if (onlyIdx == null) {
    for (let i = 0; i < numItems; i++) each(i, coord(i, offs, iwid, gap), roundedWid)
  } else {
    each(onlyIdx, coord(onlyIdx, offs, iwid, gap), roundedWid)
  }
}
