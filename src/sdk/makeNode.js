import { v4 as uuidv4 } from "uuid"
import makeListeners from "@/helpers/makeListeners"
import makeGetUnitSign from "./makeGetUnitSign"
import pristineComposite, { pristineCompositeKey } from "./pristineComposite"
import makeIntls from "./makeIntls"

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

  const trigger = (name, value, prevValue) => attributeListeners.trigger(name, value, prevValue)

  const updateAttribute = (name, value) => {
    const prevValue = attributes[name]
    if (prevValue === value) return

    const prevPristine = pristineComposite.update(attributes, name, value)
    setAttribute(name, value)
    trigger(name, value, prevValue)

    if (prevPristine) {
      trigger(pristineCompositeKey, attributes[pristineCompositeKey], prevPristine)
      sdk.trigger("pristineChanged", pristineCompositeKey, instance, value, prevValue)
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

    Object.keys(prevValues).forEach(name => trigger(name, values[name], prevValues[name]))

    if (prevPristine) {
      trigger(pristineCompositeKey, attributes[pristineCompositeKey], prevPristine)
      sdk.trigger(
        "pristineChanged",
        pristineCompositeKey,
        instance,
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
    let current = instance
    let parent = null
    while (current.getParent()?.match(attributes)) {
      parent = current.getParent()
      current = parent
    }
    return parent
  }

  const {
    update: updateIntls,
    formatTime,
    formatDate,
    formatXAxis,
    destroy: destroyIntls,
  } = makeIntls()

  const inherit = () => {
    const parentAttributes = parent.getAttributes()
    attributes = {
      ...parentAttributes,
      ...attributes,
      overlays: { ...parentAttributes.overlays, ...attributes.overlays },
    }
    updateIntls(attributes.timezone)
  }

  const updateHeight = height => {
    updateAttribute("height", height)
    sdk.trigger("heightChanged", instance, height)
  }

  const moveY = (min, max) => {
    sdk.trigger("moveY", instance, min, max)
  }

  const moveX = (after, before) => {
    if (before - after < 60) return
    sdk.trigger("moveX", instance, Math.floor(after), Math.ceil(before))
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

  const updateValueRange = value => {
    if (!getAttribute("pristineValueRange")) {
      const pristine = getAttribute("valueRange")
      updateAttribute("pristineValueRange", pristine)
    }
    updateAttribute("valueRange", value)
  }

  const resetValueRange = () => {
    const pristine = getAttribute("pristineValueRange")
    updateAttribute("pristineValueRange", null)
    updateAttribute("valueRange", pristine)
  }

  updateIntls(getAttribute("timezone"))
  onAttributeChange("timezone", updateIntls)

  const destroy = () => {
    listeners.offAll()
    attributeListeners.offAll()
    attributes = null
    parent = null
    destroyIntls()
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
    inherit,
    updateHeight,
    updateValueRange,
    resetValueRange,
    moveY,
    moveX,
    zoomIn,
    zoomOut,
    destroy,
    formatTime,
    formatDate,
    formatXAxis,
  }

  instance.getUnitSign = makeGetUnitSign(instance)

  return instance
}
