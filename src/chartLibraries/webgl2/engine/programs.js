import {
  fragmentShader,
  vertexShader,
} from "@/chartLibraries/webgl2/visualizations/cartesian/line/shader"

export const sharedVisualizationProgramKey = "netdata-shared-visualization-v1"

export const getSharedVisualizationProgram = surface =>
  surface.getProgram(
    sharedVisualizationProgramKey,
    vertexShader,
    fragmentShader
  )
