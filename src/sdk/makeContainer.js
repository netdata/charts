import makeNode from "./makeNode"

export default ({ sdk, parent, attributes } = {}) => {
  let node = makeNode({ sdk, parent, attributes })
  let children = []

  const appendChild = (node, { inherit = true } = {}) => {
    node.setParent(instance, { inherit })
    children.push(node)
    sdk.trigger("nodeAdded", node)
    sdk.trigger(`${node.type}Added`, node)
  }

  const removeChild = node => {
    children = children.filter(n => n !== node)
    sdk.trigger("nodeRemoved", node)
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
  const instance = { ...node, destroy, appendChild, removeChild, getNodes, getChildren }

  return instance
}
