const minDuration = 60

const limitRange = ({ after, before = 0 }) => {
  const wantedDuration = Math.round(before - after)
  if (wantedDuration <= minDuration) {
    const diff = minDuration - wantedDuration
    const halfDiff = Math.floor(diff / 2)

    const remainder = diff % 2
    return {
      fixedAfter: after - halfDiff - remainder,
      fixedBefore: before + halfDiff,
    }
  }

  return {
    fixedAfter: after,
    fixedBefore: before,
  }
}

export default limitRange
