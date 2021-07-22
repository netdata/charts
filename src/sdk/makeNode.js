import { v4 as uuidv4 } from "uuid"
import makeListeners from "@/helpers/makeListeners"
import makeGetUnitSign from "./makeGetUnitSign"
import pristineComposite, { pristineCompositeKey } from "./pristineComposite"

export default ({ sdk, parent = null, attributes: initialAttributes }) => {
  const listeners = makeListeners()
  const uuid = uuidv4()
  const attributeListeners = makeListeners()
  let attributes = { ...initialAttributes }

  const init = () => {
    setParent(parent)
  }

  const setAttribute = (name, value) => {
    attributes[name] = value
  }

  const getAttribute = key => attributes[key]

  const updateAttribute = (name, value) => {
    const prevValue = attributes[name]
    if (prevValue === value) return

    const prevPristine = pristineComposite.update(attributes, name, value)
    setAttribute(name, value)
    attributeListeners.trigger(name, value, prevValue)

    if (prevPristine) {
      attributeListeners.trigger(
        pristineCompositeKey,
        attributes[pristineCompositeKey],
        prevPristine
      )
    }
  }

  const setAttributes = values =>
    Object.keys(values).forEach(name => setAttribute(name, values[name]))

  const getAttributes = () => attributes

  const updateAttributes = values => {
    let prevPristine = null

    const prevValues = Object.keys(values).reduce((acc, name) => {
      const value = values[name]
      const prevValue = attributes[name]
      if (prevValue === value) return acc

      const prev = pristineComposite.update(attributes, name, value)
      if (prev && !prevPristine) {
        prevPristine = prev
      }

      setAttribute(name, value)
      acc[name] = prevValue

      return acc
    }, {})

    Object.keys(prevValues).forEach(name =>
      attributeListeners.trigger(name, values[name], prevValues[name])
    )

    if (prevPristine) {
      attributeListeners.trigger(
        pristineCompositeKey,
        attributes[pristineCompositeKey],
        prevPristine
      )
    }
  }

  const onAttributeChange = (name, handler) => attributeListeners.on(name, handler)
  const onAttributesChange = (names, handler) =>
    names.reduce(
      (func, name) => (func ? func.on(name, handler) : attributeListeners.on(name, handler)),
      null
    )

  const onceAttributeChange = (name, handler) => attributeListeners.once(name, handler)

  const match = attrs => {
    if (typeof attrs === "function") return attrs(instance, attributes)

    return !attrs || !Object.keys(attrs).some(name => attrs[name] !== attributes[name])
  }

  const getUuid = () => uuid

  const setParent = (node, { inherit: inheritAttrs = true } = {}) => {
    parent = node
    if (inheritAttrs && node) inherit()
  }

  const getParent = () => parent

  const getAncestor = attributes => {
    let container = parent
    while (container?.match(attributes)) {
      container = container.parent
    }
    return container || sdk.getRoot()
  }

  const getApplicableNodes = (attributes, options) => {
    if (!match(attributes)) return [instance]

    const ancestor = getAncestor(attributes)
    return ancestor.getNodes(attributes, options)
  }

  const inherit = () => {
    attributes = { ...parent.getAttributes(), ...attributes }
  }

  const moveX = (after, before) => {
    sdk.trigger("moveX", instance, after, before)
  }

  const zoomX = multiplier => {
    let { after, before } = getAttributes()

    if (after < 0) {
      const now = Date.now() / 1000
      after = now + after
      before = now
    }

    const diff = multiplier * Math.round((before - after) / 4)
    moveX(after + diff, before - diff)
  }

  const zoomIn = () => zoomX(1)
  const zoomOut = () => zoomX(-1)

  const destroy = () => {
    listeners.offAll()
    attributeListeners.offAll()
    attributes = null
    parent = null
  }

  init()

  const instance = {
    attributeListeners,
    ...listeners,
    sdk,
    setAttribute,
    getAttribute,
    updateAttribute,
    setAttributes,
    getAttributes,
    updateAttributes,
    onAttributeChange,
    onAttributesChange,
    onceAttributeChange,
    match,
    getUuid,
    setParent,
    getParent,
    getAncestor,
    getApplicableNodes,
    inherit,
    moveX,
    zoomIn,
    zoomOut,
    destroy,
  }

  instance.getUnitSign = makeGetUnitSign(instance)

  return instance
}
