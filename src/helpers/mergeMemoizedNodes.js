import deepEqual from "./deepEqual"

const mergeMemoizedNodes = (prev, next) => {
  if (!prev) return next
  if (deepEqual(prev, next)) return prev

  const results = [...prev]
  next.forEach(nextNode => {
    const index = results.findIndex(({ id }) => id === nextNode.id)
    if (index !== -1) {
      results[index] = nextNode
      return
    }
    results.push(nextNode)
  })

  return results
}

export default mergeMemoizedNodes
