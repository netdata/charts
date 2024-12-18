export default (e, ctx = {}) => {
  const target = e.target || e.srcElement
  const rect = target.getBoundingClientRect()
  const [x, y] = /touch/.test(e.type)
    ? [ctx.initialTouches?.[0]?.pageX, ctx.initialTouches?.[0]?.pageY]
    : [e.clientX, e.clientY]
  return { offsetX: x - rect.left, offsetY: y - rect.top }
}
