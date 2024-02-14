export const unregister =
  (...funcs) =>
  () =>
    funcs.forEach(func => func && func())

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

    offs.unshift(() => off(eventName, handler))

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
    listeners?.forEach(handler => handler(...args, eventName))

    const onceListeners = onceListenersByEvent[eventName]
    if (!onceListeners?.size) return

    listenersByEvent[eventName] = onceListeners.forEach(handler => {
      onceListeners.delete(handler)
      listeners.delete(handler)
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
