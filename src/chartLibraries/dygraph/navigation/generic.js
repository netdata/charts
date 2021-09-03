import Dygraph from "dygraphs"

export default chartUI => {
  const mousedown = (event, g, context) => {
    // Do something regardless of navigation selected
  }

  return chartUI.on("mousedown", mousedown)
}
