import deepEqual from "./deepEqual"

const mergeMemoizedNodes = (prev, next) => {
  if (!prev) return next
  if (deepEqual(prev, next)) return prev

  return prev
}

export default mergeMemoizedNodes
