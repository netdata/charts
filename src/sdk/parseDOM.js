import { underscoreToCamel } from "@/helpers/objectTransform"

const findContainerAncestor = element => {
  element = element.parentElement
  while (element) {
    if (element.hasAttribute("data-netdata-wrapper")) return element
    element = element.parentElement
  }
}

const parseValue = value => {
  if (!value) return value

  if (!isNaN(value)) {
    const number = parseFloat(value)
    if (!isNaN(number)) return number
  }

  if (value === "false") return false
  if (value === "true") return true

  // heuristic
  const [first] = value
  if (first === "[" || first === "{") {
    try {
      JSON.parse(value)
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }

  return value
}

const parseTag = element =>
  element.getAttributeNames().reduce((acc, name) => {
    const attributeName = underscoreToCamel(name.replace(/^data-/g, "").replace(/-/g, "_"))
    acc[attributeName] = parseValue(element.getAttribute(name))
    return acc
  }, {})

export default sdk => {
  const elementsMap = new Map()

  const getParent = element => {
    const ancestor = findContainerAncestor(element)
    return ancestor ? elementsMap.get(ancestor) : sdk.getRoot()
  }

  const makeNode = element => {
    const isContainer = element.hasAttribute("data-netdata-wrapper")

    const attributes = parseTag(element)
    const node = isContainer ? sdk.makeContainer(attributes) : sdk.makeChart(attributes)

    elementsMap.set(element, node)

    return node
  }

  const elements = [...document.querySelectorAll("[data-netdata],[data-netdata-wrapper]")]

  elements.forEach(element => {
    const parent = getParent(element)
    const node = makeNode(element)
    parent.appendChild(node)
  })
}
