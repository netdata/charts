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

export const mergeNodeArrays = createMergeArrays((prev, next) => {
  if (deepEqual(next.chartIDs, prev.chartIDs)) {
    return prev
  }
  return {
    ...next,
    chartIDs: [...new Set([...prev.chartIDs, ...next.chartIDs])],
  }
})

const mergeArrays = createMergeArrays((prev, next) => next)
export default mergeArrays
