import deepEqual from "@/helpers/deepEqual"

const createMergeArrays = mergeItemFn => (prev, next) => {
  if (!prev) return next
  if (deepEqual(prev, next)) return prev

  const results = [...prev]
  next.forEach(nextNode => {
    const index = results.findIndex(({ id }) => id === nextNode.id)
    if (index !== -1) {
      results[index] = mergeItemFn(results[index], nextNode)
      return
    }
    results.push(nextNode)
  })

  return results
}

const mergeArrays = createMergeArrays((prev, next) => next)
export const mergeNodeArrays = createMergeArrays((prev, next) => {
  if (
    next.chartIDs.length === prev.chartIDs.length &&
    next.chartIDs.every(id => prev.chartIDs.includes(id))
  ) {
    return next
  }
  return {
    ...next,
    chartIDs: [...new Set([...prev.chartIDs, ...next.chartIDs])],
  }
})

export default mergeArrays
