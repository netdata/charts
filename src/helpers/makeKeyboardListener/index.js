import keyCodes, { aliasByCode } from "./keys"

const types = {
  keydown: "keydown",
  keyup: "keyup",
}

const equalByPolicy = {
  default: (a, b) => a.size === b.size && [...b].every(x => a.has(x) || a.has(aliasByCode[x])),
  intersection: (a, b) =>
    a.size <= b.size && [...b].filter(x => a.has(x) || a.has(aliasByCode[x])).length === a.size,
}

export default () => {
  const handlers = []
  const pressedSet = new Set()

  const onKeyChange = (
    keys,
    action,
    {
      fireOn = types.keydown, //: keydown | keyup | sequential
      policy,
    } = {}
  ) => {
    const keysSet = new Set(Array.isArray(keys) ? keys : [keys])

    const check = equalByPolicy[policy] || equalByPolicy.intersection
    const handler = eventType => {
      if (eventType !== fireOn) return false
      if (!check(keysSet, pressedSet)) return false
      action()
      return true
    }
    handlers.push(handler)
    const i = handlers.length - 1
    return () => handlers.splice(i, 1)
  }

  const onKeyAndMouse = (keys, action, { policy, allPressed = true } = {}) => {
    const keysSet = new Set(Array.isArray(keys) ? keys : [keys])

    const check = equalByPolicy[policy] || equalByPolicy.intersection

    return (...args) => {
      const handle = action(...args)
      const checkPressed = check(keysSet, pressedSet)
      if (allPressed && !checkPressed) return false
      handle({ allPressed: checkPressed })
      return true
    }
  }

  const eventListener = event => {
    const code = event.code || keyCodes[event.keyCode || event.which]
    const eventType = event.type

    if (eventType === types.keydown) {
      if (pressedSet.has(code)) return
      pressedSet.add(code)
    }

    handlers.some(handler => handler(eventType))

    if (eventType === types.keyup && pressedSet.has(code)) pressedSet.delete(code)
  }

  const initKeyboardListener = () => {
    window.addEventListener("keydown", eventListener)
    window.addEventListener("keyup", eventListener)
  }

  const clearKeyboardListener = () => {
    window.removeEventListener("keydown", eventListener)
    window.removeEventListener("keyup", eventListener)
  }

  return { onKeyChange, onKeyAndMouse, initKeyboardListener, clearKeyboardListener, eventListener }
}
