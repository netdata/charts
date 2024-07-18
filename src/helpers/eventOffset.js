export default e => {
  const target = e.target || e.srcElement
  const rect = target.getBoundingClientRect()
  return { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top }
}
