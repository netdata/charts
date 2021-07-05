import makeNode from "./makeNode"

export default ({ sdk, parent, attributes } = {}) => {
  const node = makeNode({ sdk, parent, attributes })
  let children = []

  const appendChild = (node, { inherit = true } = {}) => {
    node.setParent(instance, { inherit })
    children.push(node)
    sdk.trigger("nodeAdded", node)
  }

  const removeChild = node => {
    children = children.filter(n => n !== node)
    sdk.trigger("nodeRemoved", node)
  }

  const getNodes = (attributes, options, nodes = []) => {
    children.forEach(child => {
      const match = child.match(attributes)

      if (!match && (!options || ("inherit" in options && options.inherit))) return
      if (match) nodes.push(child)

      if (child.type === "container") child.getNodes(attributes, options, nodes)
    })

    return nodes
  }

  const getChildren = () => children

  node.type = "container"
  const instance = { ...node, appendChild, removeChild, getNodes, getChildren }

  return instance
}
