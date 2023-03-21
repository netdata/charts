import makeNode from "./makeNode"

export default ({ sdk, parent, attributes } = {}) => {
  let node = makeNode({ sdk, parent, attributes })
  let children = []

  const appendChild = (node, { inherit = true } = {}) => {
    node.setParent(instance, { inherit })
    children.push(node)
    instance.trigger("nodeAdded", node)
    sdk.trigger("nodeAdded", instance, node)
    instance.trigger(`${node.type}Added`, node)
    sdk.trigger(`${node.type}Added`, instance, node)
  }

  const removeChild = id => {
    children = children.filter(n => n.getId() !== id)
    instance.trigger("nodeRemoved", node)
    sdk.trigger("nodeRemoved", instance, node)
    instance.trigger(`${node.type}Removed`, node)
    sdk.trigger(`${node.type}Removed`, instance, node)
  }

  const getNode = (attributes, options, nodes = [instance]) => {
    let target
    nodes.some(child => {
      const match = child.match(attributes)

      if (!match && options?.inherit) return
      if (match) {
        target = child
        return true
      }

      if (child.type === "container") {
        target = child.getNode(attributes, options, children)
        if (target) return true
      }
    })

    return target
  }

  const getNodes = (attributes, options, nodes = null) => {
    const list = nodes ? children : [instance]
    nodes = nodes || []

    list.forEach(child => {
      const match = child.match(attributes)

      if (!match && options?.inherit) return
      if (match) nodes.push(child)

      if (child.type === "container") child.getNodes(attributes, options, nodes)
    })

    return nodes
  }

  const getApplicableNodes = (attributes, options) => {
    if (!node.match(attributes)) return [instance]

    const ancestor = node.getAncestor(attributes)
    if (!ancestor) return getNodes(attributes, options)

    return ancestor.getNodes(attributes, options)
  }

  const getChildren = () => children

  let colorsByGroupId = {}

  const getNextColor = (getNext, groupId, id) => {
    if (!(groupId in colorsByGroupId)) {
      colorsByGroupId[groupId] = {}
    }

    const byId = colorsByGroupId[groupId]

    if (id in byId) return byId[id]

    const chartColor = getNext()

    byId[id] = chartColor

    return chartColor
  }

  const destroy = () => {
    if (!node) return

    node.destroy()
    children.forEach(node => node.destroy())
    children = []
    colorsByGroupId = {}
    node = null
  }

  node.type = "container"
  node.getApplicableNodes = getApplicableNodes

  const instance = {
    ...node,
    destroy,
    appendChild,
    removeChild,
    getNode,
    getNodes,
    getChildren,
    getNextColor,
  }

  return instance
}
