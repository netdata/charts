export default () => {
  let onceListenersByEvent = {}
  let listenersByEvent = {}

  const off = (eventName, handler) => {
    listenersByEvent[eventName]?.delete(handler)
    onceListenersByEvent[eventName]?.delete(handler)
  }

  const on = (eventName, handler, offs = []) => {
    listenersByEvent[eventName] = listenersByEvent[eventName] || new Set()
    listenersByEvent[eventName].add(handler)

    offs.push(() => off(eventName, handler))

    const remove = () => offs.forEach(o => o())

    remove.on = (eventName, handler) => on(eventName, handler, offs)

    return remove
  }

  const once = (eventName, handler) => {
    on(eventName, handler)

    onceListenersByEvent[eventName] = onceListenersByEvent[eventName] || new Set()
    onceListenersByEvent[eventName].add(handler)

    return () => off(eventName, handler)
  }

  const trigger = (eventName, ...args) => {
    const listeners = listenersByEvent[eventName]
    listeners?.forEach(handler => handler(...args))

    const onceListeners = onceListenersByEvent[eventName]
    if (!onceListeners?.size) return

    listenersByEvent[eventName] = listeners.forEach(c => {
      if (!onceListeners.has(c)) return

      onceListeners.delete(c)
      listeners.delete(c)
    })
  }

  const offAll = () => {
    listenersByEvent = {}
    onceListenersByEvent = {}
  }

  return {
    off,
    on,
    once,
    trigger,
    offAll,
  }
}
