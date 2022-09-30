import { v4 as uuidv4 } from "uuid"
import makeListeners from "@/helpers/makeListeners"
import makePristine from "@/helpers/makePristine"
import limitRange from "@/helpers/limitRange"
import pristineComposite, { pristineCompositeKey } from "./pristineComposite"
import makeIntls from "./makeIntls"

export default ({ sdk, parent = null, attributes: initialAttributes }) => {
  const listeners = makeListeners()
  const attributeListeners = makeListeners()
  const id = initialAttributes?.id || uuidv4()
  let attributes = { id, ...initialAttributes }

  const init = () => {
    setParent(parent)
  }

  const setAttribute = (name, value) => {
    attributes[name] = value
  }

  const getAttribute = key => attributes[key]

  const getId = () => attributes.id

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

    return (
      !attrs || !attributes || !Object.keys(attrs).some(name => attrs[name] !== attributes[name])
    )
  }

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
    const { fixedAfter, fixedBefore } = limitRange({ after, before })

    sdk.trigger("moveX", instance, Math.floor(fixedAfter), Math.floor(fixedBefore))
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
    if (getAttribute("pristineValueRange") === undefined) {
      const pristine = getAttribute("valueRange")
      updateAttribute("pristineValueRange", pristine)
    }
    updateAttribute("valueRange", value)
  }

  const resetValueRange = () => {
    const pristine = getAttribute("pristineValueRange")
    if (pristine === undefined) return

    updateAttribute("pristineValueRange", undefined)
    updateAttribute("valueRange", pristine)
  }

  const pristine = makePristine(
    "pristineEnabledHeightResize",
    ["enabledHeightResize"],
    updateAttributes
  )

  const resetNavigation = () => {
    const pristine = getAttribute("pristineValueRange")
    if (!getAttribute("enabledResetRange")) return
    if (pristine !== undefined) return resetValueRange()

    moveX(-900)
  }

  const toggleFullscreen = () => {
    const fullscreen = getAttribute("fullscreen")
    if (!fullscreen) {
      pristine.updatePristine(attributes, "enabledHeightResize", false)
      updateAttribute("enabledHeightResize", false)
      updateAttribute("fullscreen", !fullscreen)
      return
    }

    pristine.resetPristine(attributes)
    updateAttribute("fullscreen", !fullscreen)
  }

  updateIntls(getAttribute("timezone"))
  onAttributeChange("timezone", updateIntls)

  const destroy = () => {
    if (parent) parent.removeChild(getId())

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
    setParent,
    getParent,
    getId,
    getAncestor,
    inherit,
    updateHeight,
    updateValueRange,
    resetValueRange,
    toggleFullscreen,
    moveY,
    moveX,
    zoomIn,
    zoomOut,
    resetNavigation,
    destroy,
    formatTime,
    formatDate,
    formatXAxis,
  }

  return instance
}
