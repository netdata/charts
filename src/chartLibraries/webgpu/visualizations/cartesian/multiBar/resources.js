import makeLineResources from "../line/resources"

export default (runtime, canvas) =>
  makeLineResources(runtime, canvas, { fillMode: "multiBar", markers: false })
