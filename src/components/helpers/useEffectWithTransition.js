import { useCallback, useEffect, useRef, useState } from "react"
import {
  unstable_cancelCallback as cancelCallback,
  unstable_scheduleCallback as scheduleCallback,
  unstable_runWithPriority as runWithPriority,
  unstable_IdlePriority as IdlePriority,
  unstable_ImmediatePriority as ImmediatePriority,
} from "scheduler"

export default () => {
  const [isPending, setPending] = useState(false)

  const taskRef = useRef()
  const cleanupRef = useRef()

  const stopTransitionEffect = useCallback(() => {
    if (taskRef.current) {
      cancelCallback(taskRef.current)
      taskRef.current = undefined
      setPending(false)
    }

    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = undefined
    }
  }, [])

  const startTransitionEffect = useCallback((callback, priorityLevel = IdlePriority) => {
    stopTransitionEffect()

    const generator = callback()

    const iterate = () => {
      const result = generator.next()

      cleanupRef.current = result.value

      if (result.done) setPending(false)
      else return iterate
    }

    const nextCallback = runWithPriority(priorityLevel, iterate)

    if (nextCallback) {
      runWithPriority(ImmediatePriority, () => setPending(true))

      taskRef.current = scheduleCallback(priorityLevel, nextCallback)
    }
  }, [])

  useEffect(() => {
    return stopTransitionEffect
  }, [])

  return [isPending, startTransitionEffect, stopTransitionEffect]
}
