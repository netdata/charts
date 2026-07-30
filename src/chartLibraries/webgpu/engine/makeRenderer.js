import makeRenderer from "@/chartLibraries/gpu/engine/makeRenderer"
import { getWebGPURuntime } from "./runtime"

export default options =>
  makeRenderer({
    ...options,
    rendererId: "webgpu",
    fallbackRenderer: "webgl2",
    getRuntime: getWebGPURuntime,
    makeLossError: info =>
      new Error(`WebGPU device lost: ${info.reason}: ${info.message}`),
  })
