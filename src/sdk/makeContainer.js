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

  const getNodes = (attributes, nodes = []) => {
    children.forEach(node => {
      if (!node.match(attributes)) return

      nodes.push(node)
      if (node.type === "container") node.getNodes(attributes, nodes)
    })

    return nodes
  }

  const instance = { ...node, type: "container", appendChild, removeChild, getNodes }

  return instance
}
