import uPlot from "uplot"

// uPlot keeps the device pixel ratio on the constructor, not on instances
export default () => uPlot.pxRatio || 1
