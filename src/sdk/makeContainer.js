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

  const removeChild = node => {
    children = children.filter(n => n !== node)
    instance.trigger("nodeRemoved", node)
    sdk.trigger("nodeRemoved", instance, node)
    instance.trigger(`${node.type}Removed`, node)
    sdk.trigger(`${node.type}Removed`, instance, node)
  }

  const getNodes = (attributes, options, nodes = null) => {
    const list = nodes ? children : [instance]
    nodes = nodes || []

    list.forEach(child => {
      const match = child.match(attributes)

      if (!match && (!options || ("inherit" in options && options.inherit))) return
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

  const destroy = () => {
    const parent = node.getParent()
    if (parent) parent.removeChild(instance)

    node.destroy()
    children.forEach(node => node.destroy())
    children = []
    node = null
  }

  node.type = "container"
  node.getApplicableNodes = getApplicableNodes

  const instance = {
    ...node,
    destroy,
    appendChild,
    removeChild,
    getNodes,
    getChildren,
  }

  return instance
}
