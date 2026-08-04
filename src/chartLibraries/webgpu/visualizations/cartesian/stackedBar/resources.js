import makeLineResources from "../line/resources"

export default (runtime, canvas) =>
  makeLineResources(runtime, canvas, { fillMode: "stackedBar", markers: false })
