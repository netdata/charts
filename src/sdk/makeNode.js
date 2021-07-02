import { v4 as uuidv4 } from "uuid"
import makeListeners from "@/helpers/makeListeners"
import makeGetUnitSign from "./makeGetUnitSign"

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

    setAttribute(name, value)
    attributeListeners.trigger(name, value, prevValue)
  }

  const setAttributes = values =>
    Object.keys(values).forEach(name => setAttribute(name, values[name]))

  const getAttributes = () => attributes

  const updateAttributes = values => {
    const prevValues = Object.keys(values).reduce((acc, name) => {
      const value = values[name]
      const prevValue = attributes[name]
      if (prevValue !== value) {
        setAttribute(name, value)
        acc[name] = prevValue
      }
      return acc
    }, {})

    Object.keys(prevValues).forEach(name =>
      attributeListeners.trigger(name, values[name], prevValues[name])
    )
  }

  const onAttributeChange = (name, handler) => attributeListeners.on(name, handler)
  const onceAttributeChange = (name, handler) => attributeListeners.once(name, handler)

  const match = attrs =>
    !attrs || !Object.keys(attrs).some(name => attrs[name] !== attributes[name])

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

  const getApplicableNodes = attributes => {
    if (!match(attributes)) return [instance]

    const ancestor = getAncestor(attributes)
    return ancestor.getNodes(attributes, [ancestor])
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
      after = Date.now() / 1000 + after
      before = Date.now() / 1000
    }

    const diff = multiplier * Math.round((before - after) / 4)
    moveX(after + diff, before - diff)
  }

  const zoomIn = () => zoomX(1)
  const zoomOut = () => zoomX(-1)

  const destroy = () => {
    attributeListeners.offAll()
    attributes = null
  }

  init()

  const instance = {
    ...listeners,
    setAttribute,
    getAttribute,
    updateAttribute,
    setAttributes,
    getAttributes,
    updateAttributes,
    onAttributeChange,
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

  const getUnitSign = makeGetUnitSign(instance)

  return { ...instance, getUnitSign }
}
