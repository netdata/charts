const getWindowRange = ({ total, index, limit }) => {
  const size = Math.min(total, limit)
  const centeredFrom = index - Math.floor(size / 2)
  const from = Math.max(0, Math.min(centeredFrom, total - size))

  return { from, to: from + size }
}

export default getWindowRange
