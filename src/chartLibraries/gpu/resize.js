export default (element, action) => {
  const observer = new ResizeObserver(action)
  observer.observe(element)
  return () => observer.disconnect()
}
